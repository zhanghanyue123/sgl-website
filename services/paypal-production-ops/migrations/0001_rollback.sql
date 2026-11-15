DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM paypal_ops.payment_associations) OR
     EXISTS (SELECT 1 FROM paypal_ops.captures) OR
     EXISTS (SELECT 1 FROM paypal_ops.webhook_events) THEN
    RAISE EXCEPTION 'PayPal OPS contains business data; rollback requires reconciliation';
  END IF;
END;$$;

DROP INDEX IF EXISTS public.payments_one_open_paypal_live_per_order;
DROP SCHEMA IF EXISTS paypal_ops CASCADE;
ALTER TABLE public.payments DROP CONSTRAINT payments_provider_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_provider_check
  CHECK (provider IN ('stripe','alipay','airwallex','development'));
DROP ROLE IF EXISTS sgl_paypal_ops_runtime;
