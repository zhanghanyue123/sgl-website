-- Forward-only PayPal reliability remediation.
-- This migration is intentionally separate from the already-applied 0001.

ALTER TABLE paypal_ops.captures
  ADD COLUMN provider_occurred_at timestamptz,
  ADD COLUMN last_external_event_id text;
UPDATE paypal_ops.captures
  SET provider_occurred_at=COALESCE(provider_occurred_at,updated_at)
  WHERE provider_occurred_at IS NULL;
ALTER TABLE paypal_ops.captures ALTER COLUMN provider_occurred_at SET NOT NULL;

ALTER TABLE paypal_ops.webhook_events DROP CONSTRAINT webhook_events_event_type_check;
ALTER TABLE paypal_ops.webhook_events
  ADD COLUMN refund_id text,
  ADD COLUMN related_capture_id text,
  ADD COLUMN occurred_at timestamptz,
  ADD COLUMN processing_status text NOT NULL DEFAULT 'received',
  ADD CONSTRAINT webhook_events_event_type_check CHECK (event_type IN (
    'CHECKOUT.ORDER.APPROVED','CHECKOUT.ORDER.COMPLETED','CHECKOUT.PAYMENT-APPROVAL.REVERSED',
    'PAYMENT.CAPTURE.PENDING','PAYMENT.CAPTURE.COMPLETED','PAYMENT.CAPTURE.DENIED',
    'PAYMENT.CAPTURE.REFUNDED','PAYMENT.CAPTURE.REVERSED'
  )),
  ADD CONSTRAINT webhook_events_refund_id_check
    CHECK (refund_id IS NULL OR refund_id ~ '^[A-Z0-9-]{8,128}$'),
  ADD CONSTRAINT webhook_events_related_capture_id_check
    CHECK (related_capture_id IS NULL OR related_capture_id ~ '^[A-Z0-9-]{8,128}$'),
  ADD CONSTRAINT webhook_events_processing_status_check
    CHECK (processing_status IN ('received','processed','duplicate','ignored','requires_review'));
UPDATE paypal_ops.webhook_events
  SET occurred_at=COALESCE(occurred_at,received_at)
  WHERE occurred_at IS NULL;
ALTER TABLE paypal_ops.webhook_events ALTER COLUMN occurred_at SET NOT NULL;

CREATE TABLE paypal_ops.refunds (
  refund_id text PRIMARY KEY CHECK (refund_id ~ '^[A-Z0-9-]{8,128}$'),
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  capture_id text NOT NULL REFERENCES paypal_ops.captures(capture_id) ON DELETE RESTRICT,
  paypal_order_id text NOT NULL REFERENCES paypal_ops.payment_associations(paypal_order_id) ON DELETE RESTRICT,
  event_id text NOT NULL UNIQUE REFERENCES paypal_ops.webhook_events(event_id) ON DELETE RESTRICT,
  amount_cents integer NOT NULL CHECK (amount_cents>0),
  currency text NOT NULL CHECK (currency='USD'),
  status text NOT NULL CHECK (status IN ('COMPLETED')),
  provider_occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX paypal_refunds_payment_idx ON paypal_ops.refunds(payment_id,provider_occurred_at);

CREATE TABLE paypal_ops.reversals (
  event_id text PRIMARY KEY REFERENCES paypal_ops.webhook_events(event_id) ON DELETE RESTRICT,
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  capture_id text NOT NULL REFERENCES paypal_ops.captures(capture_id) ON DELETE RESTRICT,
  paypal_order_id text NOT NULL REFERENCES paypal_ops.payment_associations(paypal_order_id) ON DELETE RESTRICT,
  amount_cents integer NOT NULL CHECK (amount_cents>0),
  currency text NOT NULL CHECK (currency='USD'),
  provider_occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Extend the existing shared reconciliation model instead of creating a second
-- operations queue. Existing Airwallex inserts continue to use their defaults.
ALTER TABLE public.payment_reconciliation_issues
  ALTER COLUMN webhook_inbox_id DROP NOT NULL,
  ADD COLUMN provider text NOT NULL DEFAULT 'airwallex',
  ADD COLUMN external_event_id text;
ALTER TABLE public.payment_reconciliation_issues
  ADD CONSTRAINT payment_reconciliation_provider_check
    CHECK (provider IN ('airwallex','paypal')),
  ADD CONSTRAINT payment_reconciliation_source_check
    CHECK (webhook_inbox_id IS NOT NULL OR (provider='paypal' AND external_event_id IS NOT NULL));
CREATE UNIQUE INDEX payment_reconciliation_provider_event_issue_unique
  ON public.payment_reconciliation_issues(provider,external_event_id,issue_code)
  WHERE external_event_id IS NOT NULL;

CREATE OR REPLACE FUNCTION paypal_ops.record_reconciliation_issue(
  p_external_event_id text,
  p_payment_id uuid,
  p_order_id uuid,
  p_issue_code text,
  p_details jsonb
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path=pg_catalog,public,paypal_ops
AS $$
DECLARE target public.orders;
BEGIN
  INSERT INTO public.payment_reconciliation_issues(
    id,webhook_inbox_id,payment_id,order_id,issue_code,details,provider,external_event_id
  ) VALUES(
    gen_random_uuid(),NULL,p_payment_id,p_order_id,p_issue_code,COALESCE(p_details,'{}'::jsonb),'paypal',p_external_event_id
  ) ON CONFLICT(provider,external_event_id,issue_code) WHERE external_event_id IS NOT NULL DO NOTHING;

  SELECT * INTO target FROM public.orders WHERE id=p_order_id;
  IF FOUND THEN
    INSERT INTO public.integration_outbox(
      id,organization_id,store_id,destination,event_type,aggregate_type,aggregate_id,payload,dedupe_key
    ) VALUES(
      gen_random_uuid(),target.organization_id,target.store_id,'station','payment.reconciliation.required',
      'order',p_order_id::text,
      jsonb_build_object('orderId',p_order_id,'paymentId',p_payment_id,'issueCode',p_issue_code),
      'paypal:reconciliation:' || p_issue_code || ':' || p_external_event_id
    ) ON CONFLICT(destination,dedupe_key) DO NOTHING;
  END IF;
END;$$;

CREATE OR REPLACE FUNCTION paypal_ops.save_capture_v2(
  p_paypal_order_id text,
  p_capture_id text,
  p_status text,
  p_amount_cents integer,
  p_currency text,
  p_idempotency_key text,
  p_occurred_at timestamptz,
  p_external_event_id text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path=pg_catalog,public,paypal_ops
AS $$
DECLARE
  assoc paypal_ops.payment_associations;
  existing paypal_ops.captures;
  pay public.payments;
  target public.orders;
  result_status text:='created';
  capture_error text;
BEGIN
  IF p_status NOT IN ('PENDING','COMPLETED','DENIED') THEN RAISE EXCEPTION 'capture status invalid'; END IF;
  IF p_occurred_at IS NULL OR p_occurred_at>now()+interval '10 minutes' THEN RAISE EXCEPTION 'capture timestamp invalid'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('paypal-capture:' || p_capture_id,0));
  SELECT * INTO assoc FROM paypal_ops.payment_associations WHERE paypal_order_id=p_paypal_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'payment association not found'; END IF;
  IF assoc.amount_cents<>p_amount_cents OR assoc.currency<>upper(p_currency) THEN
    RAISE EXCEPTION 'capture amount or currency mismatch';
  END IF;
  SELECT * INTO pay FROM public.payments WHERE id=assoc.payment_id FOR UPDATE;
  SELECT * INTO target FROM public.orders WHERE id=assoc.order_id FOR UPDATE;
  SELECT * INTO existing FROM paypal_ops.captures WHERE capture_id=p_capture_id FOR UPDATE;

  IF FOUND THEN
    IF existing.paypal_order_id<>p_paypal_order_id OR existing.amount_cents<>p_amount_cents
       OR existing.currency<>upper(p_currency) THEN RAISE EXCEPTION 'capture conflict'; END IF;
    IF existing.status=p_status THEN
      RETURN jsonb_build_object('persisted',true,'orderId',assoc.order_id,'status','duplicate','paymentStatus',target.payment_status);
    END IF;
    IF p_occurred_at<existing.provider_occurred_at THEN
      RETURN jsonb_build_object('persisted',true,'orderId',assoc.order_id,'status','stale','paymentStatus',target.payment_status);
    END IF;
    IF existing.status IN ('COMPLETED','DENIED') THEN
      PERFORM paypal_ops.record_reconciliation_issue(
        p_external_event_id,assoc.payment_id,assoc.order_id,'paypal_capture_terminal_conflict',
        jsonb_build_object('captureId',p_capture_id,'currentStatus',existing.status,'incomingStatus',p_status)
      );
      RETURN jsonb_build_object('persisted',true,'orderId',assoc.order_id,'status','requires_review','paymentStatus',target.payment_status);
    END IF;
    UPDATE paypal_ops.captures SET status=p_status,provider_occurred_at=p_occurred_at,
      last_external_event_id=p_external_event_id,updated_at=now() WHERE capture_id=p_capture_id;
    result_status:='updated';
  ELSE
    INSERT INTO paypal_ops.captures(
      capture_id,order_id,paypal_order_id,amount_cents,currency,status,idempotency_key,
      provider_occurred_at,last_external_event_id
    ) VALUES(
      p_capture_id,assoc.order_id,p_paypal_order_id,p_amount_cents,'USD',p_status,p_idempotency_key,
      p_occurred_at,p_external_event_id
    );
  END IF;

  INSERT INTO public.payment_events(
    id,payment_id,event_type,external_event_id,payload,provider_status,provider_occurred_at
  ) VALUES(
    gen_random_uuid(),assoc.payment_id,'paypal.capture.'||lower(p_status),p_external_event_id,'{}'::jsonb,p_status,p_occurred_at
  ) ON CONFLICT(payment_id,external_event_id) DO NOTHING;

  IF p_status='PENDING' THEN
    UPDATE public.payments SET status='pending',provider_status='PENDING',provider_updated_at=p_occurred_at,updated_at=now()
      WHERE id=assoc.payment_id AND status IN ('created','pending');
  ELSIF p_status='DENIED' THEN
    UPDATE public.payments SET status='failed',provider_status='DENIED',provider_updated_at=p_occurred_at,updated_at=now()
      WHERE id=assoc.payment_id AND status IN ('created','pending','authorized');
    IF target.order_status='pending_payment' AND target.payment_status IN ('pending','failed') THEN
      BEGIN
        PERFORM public.release_order_reservation(assoc.order_id,'cancelled','PayPal capture denied');
      EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS capture_error=MESSAGE_TEXT;
        PERFORM paypal_ops.record_reconciliation_issue(
          p_external_event_id,assoc.payment_id,assoc.order_id,'paypal_denied_reservation_release_failed',
          jsonb_build_object('captureId',p_capture_id,'reason',capture_error)
        );
        result_status:='requires_review';
      END;
    END IF;
  ELSE
    BEGIN
      PERFORM public.capture_order_payment(assoc.order_id,p_capture_id);
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS capture_error=MESSAGE_TEXT;
      UPDATE public.orders SET order_status='payment_review',payment_status='paid',payment_reference=p_capture_id,
        paid_at=COALESCE(paid_at,p_occurred_at),reservation_expires_at=NULL,updated_at=now()
        WHERE id=assoc.order_id;
      PERFORM paypal_ops.record_reconciliation_issue(
        p_external_event_id,assoc.payment_id,assoc.order_id,'paypal_paid_inventory_reconciliation_required',
        jsonb_build_object('captureId',p_capture_id,'reason',capture_error)
      );
      result_status:='requires_review';
    END;
    UPDATE public.payments SET status='paid',provider_status='COMPLETED',captured_amount_cents=p_amount_cents,
      succeeded_at=COALESCE(succeeded_at,p_occurred_at),provider_updated_at=p_occurred_at,updated_at=now()
      WHERE id=assoc.payment_id;
  END IF;

  SELECT * INTO target FROM public.orders WHERE id=assoc.order_id;
  RETURN jsonb_build_object('persisted',true,'orderId',assoc.order_id,'status',result_status,'paymentStatus',target.payment_status);
END;$$;

-- Preserve the original callable signature during a rolling deployment.
CREATE OR REPLACE FUNCTION paypal_ops.save_capture(
  p_paypal_order_id text,p_capture_id text,p_status text,p_amount_cents integer,p_currency text,p_idempotency_key text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path=pg_catalog,public,paypal_ops
AS $$
BEGIN
  RETURN paypal_ops.save_capture_v2(
    p_paypal_order_id,p_capture_id,p_status,p_amount_cents,p_currency,p_idempotency_key,
    now(),p_idempotency_key
  );
END;$$;

CREATE OR REPLACE FUNCTION paypal_ops.apply_refund(
  p_event_id text,p_paypal_order_id text,p_capture_id text,p_refund_id text,
  p_amount_cents integer,p_currency text,p_occurred_at timestamptz
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path=pg_catalog,public,paypal_ops
AS $$
DECLARE assoc paypal_ops.payment_associations; capture paypal_ops.captures; existing paypal_ops.refunds;
  total_refunded integer; payment_projection text; target public.orders;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('paypal-refund:' || p_refund_id,0));
  SELECT * INTO assoc FROM paypal_ops.payment_associations WHERE paypal_order_id=p_paypal_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'payment association not found'; END IF;
  SELECT * INTO capture FROM paypal_ops.captures WHERE capture_id=p_capture_id FOR UPDATE;
  IF NOT FOUND OR capture.paypal_order_id<>p_paypal_order_id OR capture.status<>'COMPLETED' THEN
    PERFORM paypal_ops.record_reconciliation_issue(p_event_id,assoc.payment_id,assoc.order_id,
      'paypal_refund_capture_not_settled',jsonb_build_object('captureId',p_capture_id,'refundId',p_refund_id));
    RETURN jsonb_build_object('persisted',true,'orderId',assoc.order_id,'status','requires_review');
  END IF;
  IF upper(p_currency)<>capture.currency OR p_amount_cents<=0 THEN RAISE EXCEPTION 'refund amount or currency invalid'; END IF;
  SELECT * INTO existing FROM paypal_ops.refunds WHERE refund_id=p_refund_id FOR UPDATE;
  IF FOUND THEN
    IF existing.capture_id<>p_capture_id OR existing.amount_cents<>p_amount_cents OR existing.currency<>upper(p_currency) THEN
      PERFORM paypal_ops.record_reconciliation_issue(p_event_id,assoc.payment_id,assoc.order_id,
        'paypal_refund_conflict',jsonb_build_object('captureId',p_capture_id,'refundId',p_refund_id));
      RETURN jsonb_build_object('persisted',true,'orderId',assoc.order_id,'status','requires_review');
    END IF;
    RETURN jsonb_build_object('persisted',true,'orderId',assoc.order_id,'status','duplicate');
  END IF;
  SELECT COALESCE(sum(amount_cents),0)::integer INTO total_refunded FROM paypal_ops.refunds
    WHERE payment_id=assoc.payment_id;
  IF total_refunded+p_amount_cents>capture.amount_cents THEN
    PERFORM paypal_ops.record_reconciliation_issue(p_event_id,assoc.payment_id,assoc.order_id,
      'paypal_refund_total_exceeds_capture',jsonb_build_object('captureId',p_capture_id,'refundId',p_refund_id));
    RETURN jsonb_build_object('persisted',true,'orderId',assoc.order_id,'status','requires_review');
  END IF;
  INSERT INTO paypal_ops.refunds(
    refund_id,payment_id,order_id,capture_id,paypal_order_id,event_id,amount_cents,currency,status,provider_occurred_at
  ) VALUES(
    p_refund_id,assoc.payment_id,assoc.order_id,p_capture_id,p_paypal_order_id,p_event_id,p_amount_cents,'USD','COMPLETED',p_occurred_at
  );
  total_refunded:=total_refunded+p_amount_cents;
  payment_projection:=CASE WHEN total_refunded=capture.amount_cents THEN 'refunded' ELSE 'partially_refunded' END;
  UPDATE public.payments SET refunded_amount_cents=total_refunded,status=payment_projection,
    provider_status=CASE WHEN payment_projection='refunded' THEN 'REFUNDED' ELSE 'PARTIALLY_REFUNDED' END,
    provider_updated_at=p_occurred_at,updated_at=now() WHERE id=assoc.payment_id;
  UPDATE public.orders SET payment_status=payment_projection,updated_at=now() WHERE id=assoc.order_id;
  INSERT INTO public.payment_events(
    id,payment_id,event_type,external_event_id,payload,provider_status,provider_occurred_at
  ) VALUES(
    gen_random_uuid(),assoc.payment_id,'paypal.refund.completed',p_event_id,
    jsonb_build_object('refundId',p_refund_id,'amountCents',p_amount_cents),payment_projection,p_occurred_at
  ) ON CONFLICT(payment_id,external_event_id) DO NOTHING;
  RETURN jsonb_build_object('persisted',true,'orderId',assoc.order_id,'status','created','paymentStatus',payment_projection);
END;$$;

CREATE OR REPLACE FUNCTION paypal_ops.apply_reversal(
  p_event_id text,p_paypal_order_id text,p_capture_id text,p_amount_cents integer,p_currency text,p_occurred_at timestamptz
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path=pg_catalog,public,paypal_ops
AS $$
DECLARE assoc paypal_ops.payment_associations; capture paypal_ops.captures;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('paypal-reversal:' || p_event_id,0));
  SELECT * INTO assoc FROM paypal_ops.payment_associations WHERE paypal_order_id=p_paypal_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'payment association not found'; END IF;
  SELECT * INTO capture FROM paypal_ops.captures WHERE capture_id=p_capture_id FOR UPDATE;
  IF NOT FOUND OR capture.paypal_order_id<>p_paypal_order_id OR capture.amount_cents<>p_amount_cents
     OR capture.currency<>upper(p_currency) THEN RAISE EXCEPTION 'reversal capture mismatch'; END IF;
  INSERT INTO paypal_ops.reversals(event_id,payment_id,order_id,capture_id,paypal_order_id,amount_cents,currency,provider_occurred_at)
    VALUES(p_event_id,assoc.payment_id,assoc.order_id,p_capture_id,p_paypal_order_id,p_amount_cents,'USD',p_occurred_at)
    ON CONFLICT(event_id) DO NOTHING;
  IF NOT FOUND THEN RETURN jsonb_build_object('persisted',true,'orderId',assoc.order_id,'status','duplicate'); END IF;
  UPDATE public.payments SET status='disputed',provider_status='REVERSED',provider_updated_at=p_occurred_at,updated_at=now()
    WHERE id=assoc.payment_id;
  UPDATE public.orders SET payment_status='disputed',updated_at=now() WHERE id=assoc.order_id;
  PERFORM paypal_ops.record_reconciliation_issue(p_event_id,assoc.payment_id,assoc.order_id,
    'paypal_capture_reversed',jsonb_build_object('captureId',p_capture_id));
  RETURN jsonb_build_object('persisted',true,'orderId',assoc.order_id,'status','requires_review','paymentStatus','disputed');
END;$$;

CREATE OR REPLACE FUNCTION paypal_ops.apply_approval_reversed(
  p_event_id text,p_paypal_order_id text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path=pg_catalog,public,paypal_ops
AS $$
DECLARE assoc paypal_ops.payment_associations; pay public.payments; target public.orders; release_error text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('paypal-approval-reversed:' || p_paypal_order_id,0));
  SELECT * INTO assoc FROM paypal_ops.payment_associations WHERE paypal_order_id=p_paypal_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'payment association not found'; END IF;
  SELECT * INTO pay FROM public.payments WHERE id=assoc.payment_id FOR UPDATE;
  SELECT * INTO target FROM public.orders WHERE id=assoc.order_id FOR UPDATE;
  IF pay.status IN ('paid','partially_refunded','refunded','disputed') THEN
    PERFORM paypal_ops.record_reconciliation_issue(p_event_id,assoc.payment_id,assoc.order_id,
      'paypal_approval_reversed_after_settlement',jsonb_build_object('paypalOrderId',p_paypal_order_id));
    RETURN jsonb_build_object('persisted',true,'orderId',assoc.order_id,'status','requires_review','paymentStatus',target.payment_status);
  END IF;
  UPDATE public.payments SET status='failed',provider_status='APPROVAL_REVERSED',provider_updated_at=now(),updated_at=now()
    WHERE id=assoc.payment_id;
  IF target.order_status='pending_payment' THEN
    BEGIN
      PERFORM public.release_order_reservation(assoc.order_id,'cancelled','PayPal approval reversed');
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS release_error=MESSAGE_TEXT;
      PERFORM paypal_ops.record_reconciliation_issue(p_event_id,assoc.payment_id,assoc.order_id,
        'paypal_approval_reversal_release_failed',jsonb_build_object('reason',release_error));
      RETURN jsonb_build_object('persisted',true,'orderId',assoc.order_id,'status','requires_review','paymentStatus',target.payment_status);
    END;
  END IF;
  RETURN jsonb_build_object('persisted',true,'orderId',assoc.order_id,'status','processed','paymentStatus','cancelled');
END;$$;

CREATE OR REPLACE FUNCTION paypal_ops.save_webhook_v2(
  p_event_id text,p_event_type text,p_payload_sha256 text,p_paypal_order_id text,
  p_capture_id text,p_refund_id text,p_related_capture_id text,p_provider_status text,
  p_amount_cents integer,p_currency text,p_occurred_at timestamptz
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path=pg_catalog,public,paypal_ops
AS $$
DECLARE existing paypal_ops.webhook_events; result jsonb;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('paypal-webhook:' || p_event_id,0));
  SELECT * INTO existing FROM paypal_ops.webhook_events WHERE event_id=p_event_id FOR UPDATE;
  IF FOUND THEN
    IF existing.payload_sha256<>p_payload_sha256 OR existing.event_type<>p_event_type THEN
      RAISE EXCEPTION 'webhook event replay conflict';
    END IF;
    UPDATE paypal_ops.webhook_events SET delivery_count=delivery_count+1,last_seen_at=now(),processing_status='duplicate'
      WHERE event_id=p_event_id;
    RETURN jsonb_build_object('persisted',true,'eventId',p_event_id,'status','duplicate');
  END IF;
  INSERT INTO paypal_ops.webhook_events(
    event_id,event_type,payload_sha256,paypal_order_id,capture_id,refund_id,related_capture_id,
    provider_status,amount_cents,currency,occurred_at
  ) VALUES(
    p_event_id,p_event_type,p_payload_sha256,p_paypal_order_id,p_capture_id,p_refund_id,p_related_capture_id,
    p_provider_status,p_amount_cents,upper(p_currency),p_occurred_at
  );

  IF p_event_type IN ('PAYMENT.CAPTURE.PENDING','PAYMENT.CAPTURE.COMPLETED','PAYMENT.CAPTURE.DENIED') THEN
    result:=paypal_ops.save_capture_v2(
      p_paypal_order_id,p_capture_id,replace(p_event_type,'PAYMENT.CAPTURE.',''),p_amount_cents,p_currency,
      'paypal-webhook-'||md5(p_event_id),p_occurred_at,p_event_id
    );
  ELSIF p_event_type='PAYMENT.CAPTURE.REFUNDED' THEN
    result:=paypal_ops.apply_refund(
      p_event_id,p_paypal_order_id,p_related_capture_id,p_refund_id,p_amount_cents,p_currency,p_occurred_at
    );
  ELSIF p_event_type='PAYMENT.CAPTURE.REVERSED' THEN
    result:=paypal_ops.apply_reversal(
      p_event_id,p_paypal_order_id,p_capture_id,p_amount_cents,p_currency,p_occurred_at
    );
  ELSIF p_event_type='CHECKOUT.PAYMENT-APPROVAL.REVERSED' THEN
    result:=paypal_ops.apply_approval_reversed(p_event_id,p_paypal_order_id);
  ELSE
    result:=jsonb_build_object('persisted',true,'orderId',NULL,'status','processed');
  END IF;
  UPDATE paypal_ops.webhook_events SET processing_status=CASE
    WHEN result->>'status'='requires_review' THEN 'requires_review'
    WHEN result->>'status' IN ('stale','ignored') THEN 'ignored'
    ELSE 'processed' END
    WHERE event_id=p_event_id;
  RETURN result || jsonb_build_object('eventId',p_event_id);
END;$$;

-- Keep the legacy webhook function callable during rollout. New code uses v2.
CREATE OR REPLACE FUNCTION paypal_ops.save_webhook(
  p_event_id text,p_event_type text,p_payload_sha256 text,p_paypal_order_id text,p_capture_id text,
  p_provider_status text,p_amount_cents integer,p_currency text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path=pg_catalog,public,paypal_ops
AS $$
BEGIN
  RETURN paypal_ops.save_webhook_v2(
    p_event_id,p_event_type,p_payload_sha256,p_paypal_order_id,p_capture_id,NULL,NULL,
    p_provider_status,p_amount_cents,p_currency,now()
  );
END;$$;

REVOKE ALL ON TABLE paypal_ops.refunds,paypal_ops.reversals FROM PUBLIC;
REVOKE ALL ON FUNCTION paypal_ops.record_reconciliation_issue(text,uuid,uuid,text,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION paypal_ops.save_capture_v2(text,text,text,integer,text,text,timestamptz,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION paypal_ops.apply_refund(text,text,text,text,integer,text,timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION paypal_ops.apply_reversal(text,text,text,integer,text,timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION paypal_ops.apply_approval_reversed(text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION paypal_ops.save_webhook_v2(text,text,text,text,text,text,text,text,integer,text,timestamptz) FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='sgl_paypal_ops_runtime') THEN
    GRANT EXECUTE ON FUNCTION paypal_ops.save_capture_v2(text,text,text,integer,text,text,timestamptz,text)
      TO sgl_paypal_ops_runtime;
    GRANT EXECUTE ON FUNCTION paypal_ops.save_webhook_v2(text,text,text,text,text,text,text,text,integer,text,timestamptz)
      TO sgl_paypal_ops_runtime;
  END IF;
END;$$;
