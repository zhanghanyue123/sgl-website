-- Airwallex Sandbox support. This migration depends on 0005 and 0006 and is
-- intentionally additive so an already-recorded migration is never rewritten.

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_provider_check;
ALTER TABLE payments ADD CONSTRAINT payments_provider_check
  CHECK (provider IN ('stripe', 'alipay', 'airwallex', 'development'));

ALTER TABLE payments
  ADD COLUMN environment text NOT NULL DEFAULT 'legacy',
  ADD COLUMN provider_request_id text,
  ADD COLUMN merchant_order_reference text,
  ADD COLUMN request_hash text,
  ADD COLUMN provider_status text,
  ADD COLUMN provider_event_type text,
  ADD COLUMN provider_transition_rank integer,
  ADD COLUMN captured_amount_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN refunded_amount_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN provider_updated_at timestamptz,
  ADD COLUMN succeeded_at timestamptz;

UPDATE payments SET environment='development' WHERE provider='development';
UPDATE payments SET captured_amount_cents=amount_cents
  WHERE status IN ('paid','partially_refunded','refunded','disputed');

-- Never hide an already-over-refunded legacy ledger by truncating the
-- projection. The migration must stop so an operator can reconcile the source
-- records before retrying it.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM payments p
    JOIN refunds r ON r.payment_id=p.id AND r.status='succeeded'
    GROUP BY p.id,p.amount_cents
    HAVING sum(r.amount_cents)>p.amount_cents
  ) THEN
    RAISE EXCEPTION 'legacy refund total exceeds captured payment; reconcile before Airwallex migration';
  END IF;
END;$$;

UPDATE payments p SET refunded_amount_cents=COALESCE(
  (SELECT sum(r.amount_cents) FROM refunds r
    WHERE r.payment_id=p.id AND r.status='succeeded'),0
);

ALTER TABLE payments
  ADD CONSTRAINT payments_environment_check
    CHECK (environment IN ('legacy','development','sandbox','production')),
  ADD CONSTRAINT payments_provider_request_check
    CHECK (provider_request_id IS NULL OR length(provider_request_id) BETWEEN 1 AND 64),
  ADD CONSTRAINT payments_merchant_order_reference_check
    CHECK (merchant_order_reference IS NULL OR length(merchant_order_reference) BETWEEN 1 AND 64),
  ADD CONSTRAINT payments_request_hash_check
    CHECK (request_hash IS NULL OR request_hash ~ '^[0-9a-f]{64}$'),
  ADD CONSTRAINT payments_provider_transition_rank_check
    CHECK (provider_transition_rank IS NULL OR provider_transition_rank>=0),
  ADD CONSTRAINT payments_amount_projection_check
    CHECK (captured_amount_cents BETWEEN 0 AND amount_cents
      AND refunded_amount_cents BETWEEN 0 AND captured_amount_cents),
  ADD CONSTRAINT payments_airwallex_sandbox_check
    CHECK (provider <> 'airwallex' OR (
      environment='sandbox' AND currency='USD' AND amount_cents>0
      AND provider_request_id IS NOT NULL
      AND merchant_order_reference IS NOT NULL
      AND request_hash IS NOT NULL
    ));

CREATE UNIQUE INDEX payments_provider_request_unique
  ON payments(provider,environment,provider_request_id)
  WHERE provider_request_id IS NOT NULL;
CREATE UNIQUE INDEX payments_one_open_airwallex_intent_per_order
  ON payments(order_id)
  WHERE provider='airwallex' AND environment='sandbox'
    AND status IN ('created','pending','authorized');

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_order_status_check
  CHECK (order_status IN ('draft','pending_payment','confirmed','payment_review','cancelled','expired'));
ALTER TABLE orders ADD CONSTRAINT orders_payment_review_check
  CHECK (order_status <> 'payment_review'
    OR payment_status IN ('paid','partially_refunded','refunded','disputed'));

CREATE TABLE payment_webhook_inbox (
  id uuid PRIMARY KEY,
  provider text NOT NULL CHECK (provider='airwallex'),
  environment text NOT NULL CHECK (environment='sandbox'),
  external_event_id text NOT NULL,
  event_type text NOT NULL,
  api_version text NOT NULL,
  account_id text NOT NULL,
  external_organization_id text,
  resource_type text NOT NULL CHECK (resource_type IN ('payment_intent','refund')),
  resource_id text NOT NULL,
  parent_resource_id text,
  provider_request_id text,
  internal_reference text,
  merchant_order_reference text,
  amount_cents integer NOT NULL CHECK (amount_cents>0),
  currency text NOT NULL CHECK (currency='USD'),
  provider_status text NOT NULL,
  occurred_at timestamptz NOT NULL,
  payment_id uuid REFERENCES payments(id) ON DELETE RESTRICT,
  signature_timestamp_ms bigint NOT NULL CHECK (signature_timestamp_ms>0),
  signature_verified_at timestamptz NOT NULL,
  payload_sha256 text NOT NULL CHECK (payload_sha256 ~ '^[0-9a-f]{64}$'),
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload)='object'),
  processing_status text NOT NULL DEFAULT 'received'
    CHECK (processing_status IN ('received','processing','processed','ignored','requires_review','failed')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts>=0),
  processed_at timestamptz,
  last_error text,
  received_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((resource_type='payment_intent' AND merchant_order_reference IS NOT NULL AND parent_resource_id IS NULL)
    OR (resource_type='refund' AND parent_resource_id IS NOT NULL AND provider_request_id IS NOT NULL)),
  UNIQUE(provider,environment,external_event_id)
);
CREATE INDEX payment_webhook_inbox_pending_idx
  ON payment_webhook_inbox(processing_status,received_at)
  WHERE processing_status IN ('received','failed');

ALTER TABLE payment_events
  ADD COLUMN webhook_inbox_id uuid REFERENCES payment_webhook_inbox(id) ON DELETE RESTRICT,
  ADD COLUMN provider_status text,
  ADD COLUMN provider_occurred_at timestamptz;
CREATE UNIQUE INDEX payment_events_webhook_unique
  ON payment_events(webhook_inbox_id) WHERE webhook_inbox_id IS NOT NULL;

CREATE TABLE payment_reconciliation_issues (
  id uuid PRIMARY KEY,
  webhook_inbox_id uuid NOT NULL UNIQUE REFERENCES payment_webhook_inbox(id) ON DELETE RESTRICT,
  payment_id uuid REFERENCES payments(id) ON DELETE RESTRICT,
  order_id uuid REFERENCES orders(id) ON DELETE RESTRICT,
  issue_code text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(details)='object'),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','dismissed')),
  reviewed_by uuid REFERENCES admin_users(id) ON DELETE RESTRICT,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payment_reconciliation_open_idx
  ON payment_reconciliation_issues(status,created_at) WHERE status='open';

ALTER TABLE refunds DROP CONSTRAINT IF EXISTS refunds_status_check;
ALTER TABLE refunds
  ADD COLUMN environment text NOT NULL DEFAULT 'legacy',
  ADD COLUMN provider_request_id text,
  ADD COLUMN request_source text NOT NULL DEFAULT 'admin',
  ADD COLUMN provider_status text,
  ADD COLUMN provider_updated_at timestamptz,
  ADD COLUMN executed_by uuid REFERENCES admin_users(id) ON DELETE RESTRICT,
  ADD COLUMN executed_at timestamptz;
UPDATE refunds r SET environment=p.environment FROM payments p WHERE p.id=r.payment_id;
ALTER TABLE refunds
  ADD CONSTRAINT refunds_status_check CHECK (status IN (
    'requested','approved','submitting','received','accepted','settled',
    'processing','succeeded','failed','cancelled','requires_review'
  )),
  ADD CONSTRAINT refunds_environment_check
    CHECK (environment IN ('legacy','development','sandbox','production')),
  ADD CONSTRAINT refunds_source_check CHECK (request_source='admin'),
  ADD CONSTRAINT refunds_provider_request_check
    CHECK (provider_request_id IS NULL OR length(provider_request_id) BETWEEN 1 AND 64),
  ADD CONSTRAINT refunds_maker_checker_check
    CHECK (approved_by IS NULL OR approved_by<>requested_by) NOT VALID,
  ADD CONSTRAINT refunds_execution_check
    CHECK ((executed_by IS NULL AND executed_at IS NULL)
      OR (executed_by IS NOT NULL AND executed_at IS NOT NULL AND approved_by IS NOT NULL)),
  ADD CONSTRAINT refunds_sandbox_approval_state_check
    CHECK (environment<>'sandbox' OR status IN ('requested','cancelled') OR approved_by IS NOT NULL) NOT VALID,
  ADD CONSTRAINT refunds_sandbox_execution_state_check
    CHECK (environment<>'sandbox' OR status NOT IN (
      'submitting','received','accepted','settled','processing','succeeded','requires_review'
    ) OR (approved_by IS NOT NULL AND executed_by IS NOT NULL AND executed_at IS NOT NULL
      AND provider_request_id IS NOT NULL)) NOT VALID;

-- Existing rows are part of the authoritative ledger. Do not leave historical
-- exceptions permanently outside the maker-checker guarantees.
ALTER TABLE refunds VALIDATE CONSTRAINT refunds_maker_checker_check;
ALTER TABLE refunds VALIDATE CONSTRAINT refunds_sandbox_approval_state_check;
ALTER TABLE refunds VALIDATE CONSTRAINT refunds_sandbox_execution_state_check;

DO $$
BEGIN
  IF EXISTS (
    SELECT provider_reference FROM refunds
    WHERE provider_reference IS NOT NULL
    GROUP BY provider_reference HAVING count(*)>1
  ) THEN
    RAISE EXCEPTION 'duplicate legacy refund provider_reference; reconcile before Airwallex migration';
  END IF;
END;$$;
CREATE UNIQUE INDEX refunds_provider_request_unique
  ON refunds(environment,provider_request_id) WHERE provider_request_id IS NOT NULL;
CREATE UNIQUE INDEX refunds_provider_reference_unique
  ON refunds(provider_reference) WHERE provider_reference IS NOT NULL;

CREATE TABLE refund_events (
  id uuid PRIMARY KEY,
  refund_id uuid NOT NULL REFERENCES refunds(id) ON DELETE RESTRICT,
  webhook_inbox_id uuid UNIQUE REFERENCES payment_webhook_inbox(id) ON DELETE RESTRICT,
  external_event_id text,
  event_type text NOT NULL,
  provider_status text NOT NULL,
  occurred_at timestamptz NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(data)='object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(refund_id,external_event_id)
);

CREATE OR REPLACE FUNCTION enforce_refund_integrity() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE target_payment payments; committed_or_reserved bigint;
BEGIN
  SELECT * INTO target_payment FROM payments WHERE id=NEW.payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'payment not found'; END IF;
  IF NEW.order_id<>target_payment.order_id OR NEW.currency<>target_payment.currency
     OR NEW.environment<>target_payment.environment THEN
    RAISE EXCEPTION 'refund does not match payment';
  END IF;
  IF target_payment.captured_amount_cents<=0 THEN
    RAISE EXCEPTION 'payment has no captured amount';
  END IF;
  IF NEW.status IN ('requested','approved','submitting','received','accepted','settled','processing','succeeded') THEN
    SELECT COALESCE(sum(amount_cents),0) INTO committed_or_reserved
      FROM refunds WHERE payment_id=NEW.payment_id AND id<>NEW.id
      AND status IN ('requested','approved','submitting','received','accepted','settled','processing','succeeded');
    IF committed_or_reserved+NEW.amount_cents>target_payment.captured_amount_cents THEN
      RAISE EXCEPTION 'refund total exceeds captured payment';
    END IF;
  END IF;
  RETURN NEW;
END;$$;
CREATE TRIGGER refunds_integrity_trigger
  BEFORE INSERT OR UPDATE OF payment_id,order_id,amount_cents,currency,environment,status
  ON refunds FOR EACH ROW EXECUTE FUNCTION enforce_refund_integrity();

ALTER TABLE integration_outbox
  ADD COLUMN dedupe_key text,
  ADD COLUMN locked_at timestamptz,
  ADD COLUMN delivered_at timestamptz,
  ADD COLUMN last_error text;
UPDATE integration_outbox SET dedupe_key=id::text WHERE dedupe_key IS NULL;
ALTER TABLE integration_outbox ALTER COLUMN dedupe_key SET NOT NULL;
ALTER TABLE integration_outbox ADD CONSTRAINT integration_outbox_destination_dedupe_unique
  UNIQUE(destination,dedupe_key);

-- Validate the commerce scope before any payment-driven inventory mutation.
-- The Phase 3 schema predates composite tenant foreign keys, so this guard
-- fails closed when an order, location, product or variant crosses scopes.
CREATE OR REPLACE FUNCTION assert_order_inventory_scope(
  p_order_id uuid
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE target orders;
BEGIN
  SELECT * INTO target FROM orders WHERE id=p_order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not found'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM stores s JOIN warehouses w ON w.id=target.warehouse_id
    WHERE s.id=target.store_id
      AND s.organization_id=target.organization_id
      AND w.organization_id=target.organization_id
      AND (w.store_id IS NULL OR w.store_id=target.store_id)
  ) THEN
    RAISE EXCEPTION 'order store or warehouse is outside its organization';
  END IF;
  IF EXISTS (
    SELECT 1 FROM order_items oi
    JOIN product_variants v ON v.id=oi.variant_id
    JOIN products p ON p.id=oi.product_id
    WHERE oi.order_id=target.id
      AND (v.product_id<>oi.product_id OR p.organization_id<>target.organization_id)
  ) THEN
    RAISE EXCEPTION 'order item product or variant is outside its organization';
  END IF;
END;$$;

-- Applies only a previously signature-verified, durably stored success event.
-- Provider truth, order state, inventory, event history and outbox are changed
-- in the caller's single database transaction.
CREATE OR REPLACE FUNCTION apply_airwallex_payment_succeeded(
  p_webhook_inbox_id uuid
) RETURNS text LANGUAGE plpgsql AS $$
DECLARE evt payment_webhook_inbox; pay payments; target orders; item record; level inventory_levels;
  can_capture boolean; inventory_consistent boolean; inconsistent_variant_id uuid;
  released_reservations integer:=0; skipped_reservations integer:=0;
BEGIN
  SELECT * INTO evt FROM payment_webhook_inbox WHERE id=p_webhook_inbox_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'webhook event not found'; END IF;
  IF evt.processing_status IN ('processed','ignored','requires_review') THEN RETURN evt.processing_status; END IF;
  IF evt.event_type<>'payment_intent.succeeded' OR evt.resource_type<>'payment_intent'
     OR evt.provider_status<>'SUCCEEDED' THEN
    RAISE EXCEPTION 'webhook event is not a PaymentIntent success';
  END IF;
  UPDATE payment_webhook_inbox SET processing_status='processing',last_error=NULL WHERE id=evt.id;

  SELECT * INTO pay FROM payments
    WHERE provider='airwallex' AND environment='sandbox'
      AND provider_reference=evt.resource_id
    ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO payment_reconciliation_issues(id,webhook_inbox_id,issue_code,details)
      VALUES(gen_random_uuid(),evt.id,'payment_not_found',jsonb_build_object('resourceId',evt.resource_id));
    UPDATE payment_webhook_inbox SET processing_status='requires_review',processed_at=now() WHERE id=evt.id;
    RETURN 'requires_review';
  END IF;
  SELECT * INTO target FROM orders WHERE id=pay.order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'payment order not found'; END IF;
  PERFORM assert_order_inventory_scope(target.id);

  IF pay.provider_reference IS NOT NULL AND pay.provider_reference<>evt.resource_id
     OR pay.merchant_order_reference<>evt.merchant_order_reference
     OR evt.merchant_order_reference<>target.id::text
     OR evt.amount_cents<>pay.amount_cents OR evt.amount_cents<>target.total_cents
     OR evt.currency<>pay.currency OR evt.currency<>target.currency THEN
    INSERT INTO payment_reconciliation_issues(id,webhook_inbox_id,payment_id,order_id,issue_code,details)
      VALUES(gen_random_uuid(),evt.id,pay.id,target.id,'payment_payload_mismatch',jsonb_build_object(
        'resourceId',evt.resource_id,'merchantOrderReference',evt.merchant_order_reference,
        'amountCents',evt.amount_cents,'currency',evt.currency));
    UPDATE payment_webhook_inbox SET payment_id=pay.id,processing_status='requires_review',processed_at=now() WHERE id=evt.id;
    RETURN 'requires_review';
  END IF;

  INSERT INTO payment_events(id,payment_id,event_type,external_event_id,payload,webhook_inbox_id,provider_status,provider_occurred_at)
    VALUES(gen_random_uuid(),pay.id,evt.event_type,evt.external_event_id,evt.payload,evt.id,evt.provider_status,evt.occurred_at)
    ON CONFLICT(payment_id,external_event_id) DO NOTHING;

  -- A provider terminal state must never be overwritten silently by an
  -- out-of-order success. An older success after cancellation is stale; a
  -- genuinely newer, contradictory terminal event requires human review and
  -- leaves payment, order and inventory state unchanged.
  IF pay.status='cancelled' THEN
    IF pay.provider_updated_at IS NOT NULL AND evt.occurred_at<=pay.provider_updated_at THEN
      UPDATE payment_webhook_inbox SET payment_id=pay.id,processing_status='ignored',processed_at=now()
        WHERE id=evt.id;
      RETURN 'ignored';
    END IF;
    INSERT INTO payment_reconciliation_issues(id,webhook_inbox_id,payment_id,order_id,issue_code,details)
      VALUES(gen_random_uuid(),evt.id,pay.id,target.id,'payment_terminal_conflict',jsonb_build_object(
        'currentPaymentStatus',pay.status,'currentProviderStatus',pay.provider_status,
        'currentProviderUpdatedAt',pay.provider_updated_at,'incomingProviderStatus',evt.provider_status,
        'incomingOccurredAt',evt.occurred_at))
      ON CONFLICT(webhook_inbox_id) DO NOTHING;
    UPDATE payment_webhook_inbox SET payment_id=pay.id,processing_status='requires_review',processed_at=now()
      WHERE id=evt.id;
    RETURN 'requires_review';
  END IF;

  IF pay.status IN ('paid','partially_refunded','refunded','disputed')
     AND target.payment_status IN ('paid','partially_refunded','refunded','disputed') THEN
    UPDATE payment_webhook_inbox SET payment_id=pay.id,processing_status='processed',processed_at=now() WHERE id=evt.id;
    RETURN 'processed';
  END IF;

  UPDATE payments SET provider_reference=COALESCE(provider_reference,evt.resource_id),provider_status=evt.provider_status,
    provider_event_type=evt.event_type,provider_transition_rank=1000,
    status=CASE WHEN refunded_amount_cents=amount_cents THEN 'refunded'
      WHEN refunded_amount_cents>0 THEN 'partially_refunded' ELSE 'paid' END,
    captured_amount_cents=amount_cents,provider_updated_at=GREATEST(COALESCE(provider_updated_at,evt.occurred_at),evt.occurred_at),
    succeeded_at=COALESCE(succeeded_at,evt.occurred_at),updated_at=now() WHERE id=pay.id;

  can_capture:=target.order_status='pending_payment' AND target.payment_status='pending'
    AND target.reservation_expires_at IS NOT NULL AND evt.occurred_at<=target.reservation_expires_at;
  IF can_capture THEN
    inventory_consistent:=true;
    FOR item IN SELECT variant_id,quantity FROM order_items WHERE order_id=target.id ORDER BY variant_id LOOP
      SELECT * INTO level FROM inventory_levels
        WHERE variant_id=item.variant_id AND warehouse_id=target.warehouse_id FOR UPDATE;
      IF NOT FOUND THEN inventory_consistent:=false; inconsistent_variant_id:=item.variant_id; EXIT; END IF;
      IF level.on_hand<item.quantity OR level.reserved<item.quantity THEN
        inventory_consistent:=false; inconsistent_variant_id:=item.variant_id; EXIT;
      END IF;
    END LOOP;
    IF NOT inventory_consistent THEN
      -- Release every reservation that can be attributed safely to this order.
      -- A deficient/missing row is left for reconciliation rather than risking
      -- an underflow or consuming another order's aggregate reservation.
      released_reservations:=0; skipped_reservations:=0;
      FOR item IN SELECT variant_id,quantity FROM order_items WHERE order_id=target.id ORDER BY variant_id LOOP
        UPDATE inventory_levels SET reserved=reserved-item.quantity,updated_at=now()
          WHERE variant_id=item.variant_id AND warehouse_id=target.warehouse_id
            AND reserved>=item.quantity
            AND EXISTS (
              SELECT 1 FROM inventory_movements reservation
              WHERE reservation.variant_id=item.variant_id
                AND reservation.warehouse_id=target.warehouse_id
                AND reservation.reference_type='order'
                AND reservation.reference_id=target.id::text
                AND reservation.movement_type='reservation'
                AND reservation.delta_reserved=item.quantity
            )
            AND NOT EXISTS (
              SELECT 1 FROM inventory_movements completion
              WHERE completion.variant_id=item.variant_id
                AND completion.warehouse_id=target.warehouse_id
                AND completion.reference_type='order'
                AND completion.reference_id=target.id::text
                AND completion.movement_type IN ('release','sale')
            )
          RETURNING * INTO level;
        IF FOUND THEN
          released_reservations:=released_reservations+1;
          INSERT INTO inventory_movements(id,variant_id,warehouse_id,movement_type,delta_on_hand,delta_reserved,
            on_hand_after,reserved_after,reference_type,reference_id,reason)
            VALUES(gen_random_uuid(),item.variant_id,target.warehouse_id,'release',0,-item.quantity,
              level.on_hand,level.reserved,'payment_webhook_review',evt.external_event_id,
              'Payment inventory inconsistency requires human reconciliation');
        ELSE
          skipped_reservations:=skipped_reservations+1;
        END IF;
      END LOOP;
      UPDATE orders SET order_status='payment_review',payment_status='paid',payment_reference=evt.resource_id,
        reservation_expires_at=NULL,paid_at=COALESCE(paid_at,evt.occurred_at),updated_at=now() WHERE id=target.id;
      INSERT INTO payment_reconciliation_issues(id,webhook_inbox_id,payment_id,order_id,issue_code,details)
        VALUES(gen_random_uuid(),evt.id,pay.id,target.id,'inventory_inconsistent',jsonb_build_object(
          'phase','capture','variantId',inconsistent_variant_id,
          'releasedReservationLines',released_reservations,'skippedReservationLines',skipped_reservations));
      UPDATE payment_webhook_inbox SET payment_id=pay.id,processing_status='requires_review',processed_at=now() WHERE id=evt.id;
      RETURN 'requires_review';
    END IF;
    FOR item IN SELECT variant_id,quantity FROM order_items WHERE order_id=target.id ORDER BY variant_id LOOP
      UPDATE inventory_levels SET on_hand=on_hand-item.quantity,reserved=reserved-item.quantity,updated_at=now()
        WHERE variant_id=item.variant_id AND warehouse_id=target.warehouse_id
          AND on_hand>=item.quantity AND reserved>=item.quantity RETURNING * INTO level;
      IF NOT FOUND THEN RAISE EXCEPTION 'reserved inventory inconsistent for variant %',item.variant_id; END IF;
      INSERT INTO inventory_movements(id,variant_id,warehouse_id,movement_type,delta_on_hand,delta_reserved,
        on_hand_after,reserved_after,reference_type,reference_id,reason)
        VALUES(gen_random_uuid(),item.variant_id,target.warehouse_id,'sale',-item.quantity,-item.quantity,
          level.on_hand,level.reserved,'payment_webhook',evt.external_event_id,'Verified Airwallex Sandbox payment');
    END LOOP;
    UPDATE orders SET order_status='confirmed',payment_status='paid',payment_reference=evt.resource_id,
      reservation_expires_at=NULL,confirmed_at=COALESCE(confirmed_at,evt.occurred_at),
      paid_at=COALESCE(paid_at,evt.occurred_at),updated_at=now() WHERE id=target.id;
    INSERT INTO order_events(id,order_id,event_type,actor_type,external_reference,data)
      VALUES(gen_random_uuid(),target.id,'payment.captured','payment',evt.external_event_id,
        jsonb_build_object('provider','airwallex','environment','sandbox','paymentId',pay.id))
      ON CONFLICT(event_type,external_reference) WHERE external_reference IS NOT NULL DO NOTHING;
    INSERT INTO integration_outbox(id,organization_id,store_id,destination,event_type,aggregate_type,aggregate_id,payload,dedupe_key)
      VALUES(gen_random_uuid(),target.organization_id,target.store_id,'retail_agent','order.paid','order',target.id::text,
        jsonb_build_object('orderId',target.id,'paymentId',pay.id,'provider','airwallex'),
        'airwallex:'||evt.external_event_id||':retail_agent')
      ON CONFLICT(destination,dedupe_key) DO NOTHING;
    UPDATE payment_webhook_inbox SET payment_id=pay.id,processing_status='processed',processed_at=now() WHERE id=evt.id;
    RETURN 'processed';
  END IF;

  IF target.order_status='pending_payment' THEN
    inventory_consistent:=true;
    FOR item IN SELECT variant_id,quantity FROM order_items WHERE order_id=target.id ORDER BY variant_id LOOP
      SELECT * INTO level FROM inventory_levels
        WHERE variant_id=item.variant_id AND warehouse_id=target.warehouse_id FOR UPDATE;
      IF NOT FOUND THEN inventory_consistent:=false; inconsistent_variant_id:=item.variant_id; EXIT; END IF;
      IF level.reserved<item.quantity THEN inventory_consistent:=false; inconsistent_variant_id:=item.variant_id; EXIT; END IF;
    END LOOP;
    IF NOT inventory_consistent THEN
      released_reservations:=0; skipped_reservations:=0;
      FOR item IN SELECT variant_id,quantity FROM order_items WHERE order_id=target.id ORDER BY variant_id LOOP
        UPDATE inventory_levels SET reserved=reserved-item.quantity,updated_at=now()
          WHERE variant_id=item.variant_id AND warehouse_id=target.warehouse_id
            AND reserved>=item.quantity
            AND EXISTS (
              SELECT 1 FROM inventory_movements reservation
              WHERE reservation.variant_id=item.variant_id
                AND reservation.warehouse_id=target.warehouse_id
                AND reservation.reference_type='order'
                AND reservation.reference_id=target.id::text
                AND reservation.movement_type='reservation'
                AND reservation.delta_reserved=item.quantity
            )
            AND NOT EXISTS (
              SELECT 1 FROM inventory_movements completion
              WHERE completion.variant_id=item.variant_id
                AND completion.warehouse_id=target.warehouse_id
                AND completion.reference_type='order'
                AND completion.reference_id=target.id::text
                AND completion.movement_type IN ('release','sale')
            )
          RETURNING * INTO level;
        IF FOUND THEN
          released_reservations:=released_reservations+1;
          INSERT INTO inventory_movements(id,variant_id,warehouse_id,movement_type,delta_on_hand,delta_reserved,
            on_hand_after,reserved_after,reference_type,reference_id,reason)
            VALUES(gen_random_uuid(),item.variant_id,target.warehouse_id,'release',0,-item.quantity,
              level.on_hand,level.reserved,'payment_webhook_review',evt.external_event_id,
              'Late payment inventory inconsistency requires human reconciliation');
        ELSE
          skipped_reservations:=skipped_reservations+1;
        END IF;
      END LOOP;
      UPDATE orders SET order_status='payment_review',payment_status='paid',payment_reference=evt.resource_id,
        reservation_expires_at=NULL,paid_at=COALESCE(paid_at,evt.occurred_at),updated_at=now() WHERE id=target.id;
      INSERT INTO payment_reconciliation_issues(id,webhook_inbox_id,payment_id,order_id,issue_code,details)
        VALUES(gen_random_uuid(),evt.id,pay.id,target.id,'inventory_inconsistent',jsonb_build_object(
          'phase','release_for_review','variantId',inconsistent_variant_id,
          'releasedReservationLines',released_reservations,'skippedReservationLines',skipped_reservations));
      UPDATE payment_webhook_inbox SET payment_id=pay.id,processing_status='requires_review',processed_at=now() WHERE id=evt.id;
      RETURN 'requires_review';
    END IF;
    FOR item IN SELECT variant_id,quantity FROM order_items WHERE order_id=target.id ORDER BY variant_id LOOP
      UPDATE inventory_levels SET reserved=reserved-item.quantity,updated_at=now()
        WHERE variant_id=item.variant_id AND warehouse_id=target.warehouse_id AND reserved>=item.quantity RETURNING * INTO level;
      IF NOT FOUND THEN RAISE EXCEPTION 'reserved inventory inconsistent for variant %',item.variant_id; END IF;
      INSERT INTO inventory_movements(id,variant_id,warehouse_id,movement_type,delta_on_hand,delta_reserved,
        on_hand_after,reserved_after,reference_type,reference_id,reason)
        VALUES(gen_random_uuid(),item.variant_id,target.warehouse_id,'release',0,-item.quantity,
          level.on_hand,level.reserved,'payment_webhook_review',evt.external_event_id,'Payment requires human reconciliation');
    END LOOP;
  END IF;
  UPDATE orders SET order_status='payment_review',payment_status='paid',payment_reference=evt.resource_id,
    reservation_expires_at=NULL,paid_at=COALESCE(paid_at,evt.occurred_at),updated_at=now() WHERE id=target.id;
  INSERT INTO payment_reconciliation_issues(id,webhook_inbox_id,payment_id,order_id,issue_code,details)
    VALUES(gen_random_uuid(),evt.id,pay.id,target.id,'late_success_after_release',jsonb_build_object(
      'previousOrderStatus',target.order_status,'reservationExpiresAt',target.reservation_expires_at));
  UPDATE payment_webhook_inbox SET payment_id=pay.id,processing_status='requires_review',processed_at=now() WHERE id=evt.id;
  RETURN 'requires_review';
END;$$;
