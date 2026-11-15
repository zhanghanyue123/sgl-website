CREATE SCHEMA IF NOT EXISTS paypal_ops;

CREATE TABLE paypal_ops.schema_migrations (
  version text PRIMARY KEY,
  checksum text NOT NULL CHECK (checksum ~ '^[0-9a-f]{64}$'),
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE paypal_ops.payment_associations (
  order_id uuid PRIMARY KEY REFERENCES public.orders(id) ON DELETE RESTRICT,
  payment_id uuid NOT NULL UNIQUE REFERENCES public.payments(id) ON DELETE RESTRICT,
  paypal_order_id text NOT NULL UNIQUE CHECK (paypal_order_id ~ '^[A-Z0-9]{10,32}$'),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL CHECK (currency = 'USD'),
  cart_hash text NOT NULL CHECK (cart_hash ~ '^[0-9a-f]{64}$'),
  idempotency_key text NOT NULL UNIQUE CHECK (length(idempotency_key) BETWEEN 8 AND 120),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE paypal_ops.captures (
  capture_id text PRIMARY KEY CHECK (capture_id ~ '^[A-Z0-9]{10,32}$'),
  order_id uuid NOT NULL REFERENCES paypal_ops.payment_associations(order_id) ON DELETE RESTRICT,
  paypal_order_id text NOT NULL REFERENCES paypal_ops.payment_associations(paypal_order_id) ON DELETE RESTRICT,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL CHECK (currency = 'USD'),
  status text NOT NULL CHECK (status IN ('PENDING','COMPLETED','DENIED','REFUNDED','REVERSED')),
  idempotency_key text NOT NULL UNIQUE CHECK (length(idempotency_key) BETWEEN 8 AND 120),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE paypal_ops.webhook_events (
  event_id text PRIMARY KEY CHECK (event_id ~ '^[A-Z0-9-]{8,128}$'),
  event_type text NOT NULL CHECK (event_type IN (
    'CHECKOUT.ORDER.APPROVED','CHECKOUT.ORDER.COMPLETED','PAYMENT.CAPTURE.PENDING',
    'PAYMENT.CAPTURE.COMPLETED','PAYMENT.CAPTURE.DENIED','PAYMENT.CAPTURE.REFUNDED',
    'PAYMENT.CAPTURE.REVERSED'
  )),
  payload_sha256 text NOT NULL CHECK (payload_sha256 ~ '^[0-9a-f]{64}$'),
  paypal_order_id text,
  capture_id text,
  provider_status text,
  amount_cents integer CHECK (amount_cents IS NULL OR amount_cents > 0),
  currency text CHECK (currency IS NULL OR currency = 'USD'),
  delivery_count integer NOT NULL DEFAULT 1 CHECK (delivery_count > 0),
  received_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  CHECK (paypal_order_id IS NULL OR paypal_order_id ~ '^[A-Z0-9]{10,32}$'),
  CHECK (capture_id IS NULL OR capture_id ~ '^[A-Z0-9]{10,32}$')
);

ALTER TABLE public.payments DROP CONSTRAINT payments_provider_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_provider_check
  CHECK (provider IN ('stripe','alipay','airwallex','development','paypal'));

CREATE UNIQUE INDEX payments_one_open_paypal_live_per_order
  ON public.payments(order_id)
  WHERE provider='paypal' AND environment='production' AND status IN ('created','pending','authorized');

CREATE OR REPLACE FUNCTION paypal_ops.register_order(
  p_order_id uuid,
  p_paypal_order_id text,
  p_amount_cents integer,
  p_currency text,
  p_cart_hash text,
  p_idempotency_key text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, paypal_ops
AS $$
DECLARE target public.orders; existing paypal_ops.payment_associations; payment_id uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('paypal-order:' || p_paypal_order_id,0));
  SELECT * INTO target FROM public.orders WHERE id=p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not found'; END IF;
  IF target.order_status<>'pending_payment' OR target.payment_status<>'pending' THEN
    RAISE EXCEPTION 'order is not awaiting payment';
  END IF;
  IF target.total_cents<>p_amount_cents OR target.currency<>upper(p_currency) OR upper(p_currency)<>'USD' THEN
    RAISE EXCEPTION 'payment amount or currency mismatch';
  END IF;
  SELECT * INTO existing FROM paypal_ops.payment_associations
    WHERE order_id=p_order_id OR paypal_order_id=p_paypal_order_id FOR UPDATE;
  IF FOUND THEN
    IF existing.order_id<>p_order_id OR existing.paypal_order_id<>p_paypal_order_id
       OR existing.amount_cents<>p_amount_cents OR existing.currency<>upper(p_currency)
       OR existing.cart_hash<>p_cart_hash THEN RAISE EXCEPTION 'payment association conflict'; END IF;
    RETURN jsonb_build_object('persisted',true,'orderId',p_order_id,'status','duplicate');
  END IF;
  payment_id:=gen_random_uuid();
  INSERT INTO public.payments(id,order_id,provider,provider_reference,idempotency_key,amount_cents,currency,
    status,environment,provider_request_id,merchant_order_reference,request_hash,provider_status,metadata)
  VALUES(payment_id,p_order_id,'paypal',p_paypal_order_id,p_idempotency_key,p_amount_cents,'USD',
    'created','production',p_idempotency_key,p_order_id::text,p_cart_hash,'CREATED','{}'::jsonb);
  INSERT INTO paypal_ops.payment_associations(order_id,payment_id,paypal_order_id,amount_cents,currency,cart_hash,idempotency_key)
  VALUES(p_order_id,payment_id,p_paypal_order_id,p_amount_cents,'USD',p_cart_hash,p_idempotency_key);
  RETURN jsonb_build_object('persisted',true,'orderId',p_order_id,'status','created');
END;$$;

CREATE OR REPLACE FUNCTION paypal_ops.capture_context(p_paypal_order_id text) RETURNS jsonb
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = pg_catalog, public, paypal_ops
AS $$
  SELECT jsonb_build_object('orderId',order_id,'paypalOrderId',paypal_order_id,
    'amountTotal',amount_cents,'currency',lower(currency))
  FROM paypal_ops.payment_associations WHERE paypal_order_id=p_paypal_order_id
$$;

CREATE OR REPLACE FUNCTION paypal_ops.save_capture(
  p_paypal_order_id text,
  p_capture_id text,
  p_status text,
  p_amount_cents integer,
  p_currency text,
  p_idempotency_key text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, paypal_ops
AS $$
DECLARE assoc paypal_ops.payment_associations; existing paypal_ops.captures; new_payment_status text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('paypal-capture:' || p_capture_id,0));
  SELECT * INTO assoc FROM paypal_ops.payment_associations WHERE paypal_order_id=p_paypal_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'payment association not found'; END IF;
  IF assoc.amount_cents<>p_amount_cents OR assoc.currency<>upper(p_currency) THEN
    RAISE EXCEPTION 'capture amount or currency mismatch';
  END IF;
  SELECT * INTO existing FROM paypal_ops.captures WHERE capture_id=p_capture_id FOR UPDATE;
  IF FOUND THEN
    IF existing.paypal_order_id<>p_paypal_order_id OR existing.amount_cents<>p_amount_cents
       OR existing.currency<>upper(p_currency) THEN RAISE EXCEPTION 'capture conflict'; END IF;
    RETURN jsonb_build_object('persisted',true,'orderId',assoc.order_id,'status','duplicate');
  END IF;
  IF p_status NOT IN ('PENDING','COMPLETED','DENIED','REFUNDED','REVERSED') THEN RAISE EXCEPTION 'capture status invalid'; END IF;
  INSERT INTO paypal_ops.captures(capture_id,order_id,paypal_order_id,amount_cents,currency,status,idempotency_key)
  VALUES(p_capture_id,assoc.order_id,p_paypal_order_id,p_amount_cents,'USD',p_status,p_idempotency_key);
  new_payment_status:=CASE p_status WHEN 'COMPLETED' THEN 'paid' WHEN 'PENDING' THEN 'pending'
    WHEN 'DENIED' THEN 'failed' WHEN 'REFUNDED' THEN 'refunded' ELSE 'disputed' END;
  UPDATE public.payments SET status=new_payment_status,provider_status=p_status,
    captured_amount_cents=CASE WHEN p_status IN ('COMPLETED','REFUNDED','REVERSED') THEN p_amount_cents ELSE captured_amount_cents END,
    succeeded_at=CASE WHEN p_status='COMPLETED' THEN now() ELSE succeeded_at END,
    provider_updated_at=now(),updated_at=now() WHERE id=assoc.payment_id;
  INSERT INTO public.payment_events(id,payment_id,event_type,external_event_id,payload,provider_status,provider_occurred_at)
  VALUES(gen_random_uuid(),assoc.payment_id,'paypal.capture.'||lower(p_status),p_capture_id,'{}'::jsonb,p_status,now())
  ON CONFLICT(payment_id,external_event_id) DO NOTHING;
  IF p_status='COMPLETED' THEN PERFORM public.capture_order_payment(assoc.order_id,p_capture_id); END IF;
  RETURN jsonb_build_object('persisted',true,'orderId',assoc.order_id,'status','created');
END;$$;

CREATE OR REPLACE FUNCTION paypal_ops.save_webhook(
  p_event_id text,p_event_type text,p_payload_sha256 text,p_paypal_order_id text,p_capture_id text,
  p_provider_status text,p_amount_cents integer,p_currency text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, paypal_ops
AS $$
DECLARE inserted boolean;
BEGIN
  INSERT INTO paypal_ops.webhook_events(event_id,event_type,payload_sha256,paypal_order_id,capture_id,
    provider_status,amount_cents,currency)
  VALUES(p_event_id,p_event_type,p_payload_sha256,p_paypal_order_id,p_capture_id,p_provider_status,p_amount_cents,upper(p_currency))
  ON CONFLICT(event_id) DO UPDATE SET last_seen_at=now(),delivery_count=paypal_ops.webhook_events.delivery_count+1
  RETURNING (xmax=0) INTO inserted;
  IF inserted AND p_event_type LIKE 'PAYMENT.CAPTURE.%' THEN
    IF p_capture_id IS NULL OR p_paypal_order_id IS NULL OR p_amount_cents IS NULL OR p_currency IS NULL THEN
      RAISE EXCEPTION 'capture webhook context incomplete';
    END IF;
    PERFORM paypal_ops.save_capture(p_paypal_order_id,p_capture_id,
      replace(p_event_type,'PAYMENT.CAPTURE.',''),p_amount_cents,p_currency,
      'paypal-webhook-' || md5(p_event_id));
  END IF;
  RETURN jsonb_build_object('persisted',true,'eventId',p_event_id,'status',CASE WHEN inserted THEN 'created' ELSE 'duplicate' END);
END;$$;

REVOKE ALL ON SCHEMA paypal_ops FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA paypal_ops FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA paypal_ops FROM PUBLIC;
