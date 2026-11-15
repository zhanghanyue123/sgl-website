CREATE TABLE IF NOT EXISTS paypal_sandbox_test_orders (
  test_order_id uuid PRIMARY KEY,
  paypal_order_id text UNIQUE,
  expected_amount_cents integer NOT NULL CHECK (expected_amount_cents > 0),
  currency text NOT NULL CHECK (currency = 'USD'),
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created','approved','pending','captured','denied','cancelled','amount_mismatch','failed')),
  capture_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  captured_at timestamptz
);

CREATE OR REPLACE FUNCTION apply_paypal_sandbox_event(
  p_event_type text,
  p_paypal_order_id text,
  p_capture_id text,
  p_provider_status text,
  p_amount_cents integer,
  p_currency text
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target paypal_sandbox_test_orders;
  next_status text;
BEGIN
  IF p_event_type NOT IN (
    'CHECKOUT.ORDER.APPROVED','CHECKOUT.ORDER.COMPLETED','PAYMENT.CAPTURE.PENDING',
    'PAYMENT.CAPTURE.COMPLETED','PAYMENT.CAPTURE.DENIED','PAYMENT.CAPTURE.REFUNDED','PAYMENT.CAPTURE.REVERSED'
  ) THEN RAISE EXCEPTION 'event type is not allowed'; END IF;
  IF p_paypal_order_id IS NULL THEN RETURN 'not_matched'; END IF;

  SELECT * INTO target FROM paypal_sandbox_test_orders
  WHERE paypal_order_id = p_paypal_order_id FOR UPDATE;
  IF NOT FOUND THEN RETURN 'not_matched'; END IF;

  IF p_amount_cents IS NOT NULL AND (p_amount_cents <> target.expected_amount_cents OR p_currency <> target.currency) THEN
    UPDATE paypal_sandbox_test_orders SET status='amount_mismatch', updated_at=now()
    WHERE test_order_id=target.test_order_id;
    RETURN 'amount_mismatch';
  END IF;

  next_status := CASE
    WHEN p_event_type='CHECKOUT.ORDER.APPROVED' THEN 'approved'
    WHEN p_event_type='PAYMENT.CAPTURE.PENDING' THEN 'pending'
    WHEN p_event_type IN ('CHECKOUT.ORDER.COMPLETED','PAYMENT.CAPTURE.COMPLETED') THEN 'captured'
    WHEN p_event_type IN ('PAYMENT.CAPTURE.DENIED','PAYMENT.CAPTURE.REVERSED') THEN 'denied'
    WHEN p_event_type='PAYMENT.CAPTURE.REFUNDED' THEN 'cancelled'
    ELSE 'failed'
  END;

  UPDATE paypal_sandbox_test_orders SET
    status=next_status,
    capture_id=COALESCE(p_capture_id, capture_id),
    captured_at=CASE WHEN next_status='captured' THEN COALESCE(captured_at, now()) ELSE captured_at END,
    updated_at=now()
  WHERE test_order_id=target.test_order_id;
  RETURN next_status;
END;
$$;

REVOKE ALL ON FUNCTION apply_paypal_sandbox_event(text,text,text,text,integer,text) FROM PUBLIC;
