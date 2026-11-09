-- Sandbox-readiness hardening. This migration is additive and is not approved
-- for production execution as part of Sprint 01.1-01.4.

ALTER TABLE product_variants
  ADD COLUMN sku_approval_status text NOT NULL DEFAULT 'pending_approval',
  ADD COLUMN sku_reviewed_by uuid REFERENCES admin_users(id) ON DELETE RESTRICT,
  ADD COLUMN sku_reviewed_at timestamptz,
  ADD COLUMN sku_reviewed_value text,
  ADD COLUMN sku_review_note text;

ALTER TABLE product_variants
  ADD CONSTRAINT product_variants_sku_approval_status_check
    CHECK (sku_approval_status IN ('pending_approval','approved','rejected')),
  ADD CONSTRAINT product_variants_sku_review_check
    CHECK (
      (sku_approval_status='pending_approval' AND sku_reviewed_by IS NULL
        AND sku_reviewed_at IS NULL AND sku_reviewed_value IS NULL)
      OR
      (sku_approval_status IN ('approved','rejected') AND sku_reviewed_by IS NOT NULL
        AND sku_reviewed_at IS NOT NULL AND sku_reviewed_value IS NOT DISTINCT FROM sku)
    ),
  ADD CONSTRAINT product_variants_approved_sku_check
    CHECK (sku_approval_status<>'approved' OR (sku IS NOT NULL AND length(trim(sku))>0));

CREATE INDEX product_variants_sku_approval_pending_idx
  ON product_variants(sku_approval_status,product_id,position)
  WHERE active AND sku_approval_status<>'approved';

CREATE OR REPLACE FUNCTION reset_variant_sku_approval_on_change() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.sku IS DISTINCT FROM OLD.sku THEN
    NEW.sku_approval_status:='pending_approval';
    NEW.sku_reviewed_by:=NULL;
    NEW.sku_reviewed_at:=NULL;
    NEW.sku_reviewed_value:=NULL;
    NEW.sku_review_note:=NULL;
  END IF;
  RETURN NEW;
END;$$;
CREATE TRIGGER product_variants_sku_approval_reset_trigger
  BEFORE UPDATE OF sku ON product_variants
  FOR EACH ROW EXECUTE FUNCTION reset_variant_sku_approval_on_change();

-- Shared server-side checkout rate limiting. Only irreversible HMAC digests of
-- the trusted proxy IP and anonymous browser identifier are stored.
CREATE TABLE checkout_rate_limit_buckets (
  dimension text NOT NULL CHECK (dimension IN ('ip','client')),
  key_hash text NOT NULL CHECK (key_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz NOT NULL,
  request_count integer NOT NULL CHECK (request_count>0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(dimension,key_hash,window_started_at)
);
CREATE INDEX checkout_rate_limit_window_idx ON checkout_rate_limit_buckets(window_started_at);

CREATE TABLE checkout_security_events (
  id uuid PRIMARY KEY,
  request_id text,
  provider text NOT NULL,
  decision text NOT NULL CHECK (decision IN ('blocked','rate_limited')),
  reason_code text NOT NULL,
  ip_hash text CHECK (ip_hash IS NULL OR ip_hash ~ '^[0-9a-f]{64}$'),
  client_hash text CHECK (client_hash IS NULL OR client_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX checkout_security_events_created_idx ON checkout_security_events(created_at DESC);

CREATE OR REPLACE FUNCTION consume_checkout_rate_limit(
  p_ip_hash text,
  p_client_hash text,
  p_window_seconds integer,
  p_ip_limit integer,
  p_client_limit integer
 ) RETURNS TABLE(allowed boolean,retry_after_seconds integer)
LANGUAGE plpgsql AS $$
DECLARE
  v_now timestamptz:=clock_timestamp();
  window_start timestamptz;
  window_end timestamptz;
  ip_count integer;
  client_count integer;
BEGIN
  IF p_ip_hash !~ '^[0-9a-f]{64}$' OR p_client_hash !~ '^[0-9a-f]{64}$'
     OR p_window_seconds<1 OR p_window_seconds>86400
     OR p_ip_limit<1 OR p_ip_limit>10000 OR p_client_limit<1 OR p_client_limit>10000 THEN
    RAISE EXCEPTION 'invalid checkout rate limit input';
  END IF;
  window_start:=to_timestamp(floor(extract(epoch FROM v_now)/p_window_seconds)*p_window_seconds);
  window_end:=window_start+make_interval(secs=>p_window_seconds);

  INSERT INTO checkout_rate_limit_buckets(dimension,key_hash,window_started_at,request_count)
    VALUES('ip',p_ip_hash,window_start,1)
  ON CONFLICT(dimension,key_hash,window_started_at) DO UPDATE
    SET request_count=checkout_rate_limit_buckets.request_count+1,updated_at=now()
  RETURNING request_count INTO ip_count;

  INSERT INTO checkout_rate_limit_buckets(dimension,key_hash,window_started_at,request_count)
    VALUES('client',p_client_hash,window_start,1)
  ON CONFLICT(dimension,key_hash,window_started_at) DO UPDATE
    SET request_count=checkout_rate_limit_buckets.request_count+1,updated_at=now()
  RETURNING request_count INTO client_count;

  RETURN QUERY SELECT ip_count<=p_ip_limit AND client_count<=p_client_limit,
    GREATEST(1,ceil(extract(epoch FROM window_end-v_now))::integer);
END;$$;

-- Replace the legacy single-location routines with warehouse-aware versions.
CREATE OR REPLACE FUNCTION reserve_order_inventory(
  p_order_id uuid,
  p_expires_at timestamptz
) RETURNS orders
LANGUAGE plpgsql AS $$
DECLARE target orders; item record; level inventory_levels;
BEGIN
  SELECT * INTO target FROM orders WHERE id=p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not found'; END IF;
  PERFORM assert_order_inventory_scope(target.id);
  IF p_expires_at IS NULL OR p_expires_at<now()+interval '30 minutes' OR p_expires_at>now()+interval '24 hours' THEN
    RAISE EXCEPTION 'reservation expiry must be between 30 minutes and 24 hours';
  END IF;
  IF target.order_status='pending_payment' AND target.reservation_expires_at>now() THEN RETURN target; END IF;
  IF target.order_status<>'draft' THEN RAISE EXCEPTION 'order cannot reserve inventory from status %',target.order_status; END IF;
  FOR item IN SELECT variant_id,quantity FROM order_items WHERE order_id=p_order_id ORDER BY variant_id LOOP
    UPDATE inventory_levels SET reserved=reserved+item.quantity,updated_at=now()
      WHERE variant_id=item.variant_id AND warehouse_id=target.warehouse_id AND available>=item.quantity
      RETURNING * INTO level;
    IF NOT FOUND THEN RAISE EXCEPTION 'insufficient inventory for variant %',item.variant_id; END IF;
    INSERT INTO inventory_movements(
      id,variant_id,warehouse_id,movement_type,delta_on_hand,delta_reserved,
      on_hand_after,reserved_after,reference_type,reference_id,reason
    ) VALUES(
      gen_random_uuid(),item.variant_id,target.warehouse_id,'reservation',0,item.quantity,
      level.on_hand,level.reserved,'order',p_order_id::text,'Checkout inventory reservation'
    );
  END LOOP;
  UPDATE orders SET order_status='pending_payment',payment_status='pending',
    reservation_expires_at=p_expires_at,updated_at=now() WHERE id=p_order_id RETURNING * INTO target;
  INSERT INTO order_events(id,order_id,event_type,actor_type,data)
    VALUES(gen_random_uuid(),p_order_id,'inventory.reserved','system',jsonb_build_object(
      'expiresAt',p_expires_at,'warehouseId',target.warehouse_id));
  RETURN target;
END;$$;

CREATE OR REPLACE FUNCTION release_order_reservation(
  p_order_id uuid,
  p_final_status text,
  p_reason text
) RETURNS orders
LANGUAGE plpgsql AS $$
DECLARE target orders; item record; level inventory_levels;
BEGIN
  IF p_final_status NOT IN ('cancelled','expired') THEN RAISE EXCEPTION 'invalid reservation final status'; END IF;
  IF p_reason IS NULL OR length(trim(p_reason))=0 THEN RAISE EXCEPTION 'release reason is required'; END IF;
  SELECT * INTO target FROM orders WHERE id=p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not found'; END IF;
  PERFORM assert_order_inventory_scope(target.id);
  IF target.order_status<>'pending_payment' THEN RETURN target; END IF;
  IF target.payment_status IN ('paid','partially_refunded','refunded','disputed') THEN
    RAISE EXCEPTION 'financially settled order reservation cannot be released';
  END IF;
  FOR item IN SELECT variant_id,quantity FROM order_items WHERE order_id=p_order_id ORDER BY variant_id LOOP
    UPDATE inventory_levels SET reserved=reserved-item.quantity,updated_at=now()
      WHERE variant_id=item.variant_id AND warehouse_id=target.warehouse_id AND reserved>=item.quantity
      RETURNING * INTO level;
    IF NOT FOUND THEN RAISE EXCEPTION 'reserved inventory is inconsistent for variant %',item.variant_id; END IF;
    INSERT INTO inventory_movements(
      id,variant_id,warehouse_id,movement_type,delta_on_hand,delta_reserved,
      on_hand_after,reserved_after,reference_type,reference_id,reason
    ) VALUES(
      gen_random_uuid(),item.variant_id,target.warehouse_id,'release',0,-item.quantity,
      level.on_hand,level.reserved,'order',p_order_id::text,p_reason
    );
  END LOOP;
  UPDATE orders SET order_status=p_final_status,
    payment_status=CASE WHEN payment_status IN ('not_started','pending','failed','cancelled') THEN 'cancelled' ELSE payment_status END,
    reservation_expires_at=NULL,cancelled_at=now(),updated_at=now()
    WHERE id=p_order_id RETURNING * INTO target;
  INSERT INTO order_events(id,order_id,event_type,actor_type,data)
    VALUES(gen_random_uuid(),p_order_id,'inventory.released','system',jsonb_build_object(
      'reason',p_reason,'status',p_final_status,'warehouseId',target.warehouse_id));
  RETURN target;
END;$$;

CREATE OR REPLACE FUNCTION capture_order_payment(
  p_order_id uuid,
  p_payment_reference text
) RETURNS orders
LANGUAGE plpgsql AS $$
DECLARE target orders; item record; level inventory_levels;
BEGIN
  IF p_payment_reference IS NULL OR length(trim(p_payment_reference))=0 THEN RAISE EXCEPTION 'payment reference is required'; END IF;
  SELECT * INTO target FROM orders WHERE id=p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not found'; END IF;
  PERFORM assert_order_inventory_scope(target.id);
  IF target.payment_status='paid' AND target.payment_reference=p_payment_reference THEN RETURN target; END IF;
  IF target.order_status<>'pending_payment' OR target.payment_status<>'pending'
     OR target.reservation_expires_at<=now() THEN
    RAISE EXCEPTION 'order is not eligible for payment capture';
  END IF;
  FOR item IN SELECT variant_id,quantity FROM order_items WHERE order_id=p_order_id ORDER BY variant_id LOOP
    UPDATE inventory_levels SET on_hand=on_hand-item.quantity,reserved=reserved-item.quantity,updated_at=now()
      WHERE variant_id=item.variant_id AND warehouse_id=target.warehouse_id
        AND on_hand>=item.quantity AND reserved>=item.quantity RETURNING * INTO level;
    IF NOT FOUND THEN RAISE EXCEPTION 'reserved inventory is inconsistent for variant %',item.variant_id; END IF;
    INSERT INTO inventory_movements(
      id,variant_id,warehouse_id,movement_type,delta_on_hand,delta_reserved,
      on_hand_after,reserved_after,reference_type,reference_id,reason
    ) VALUES(
      gen_random_uuid(),item.variant_id,target.warehouse_id,'sale',-item.quantity,-item.quantity,
      level.on_hand,level.reserved,'order',p_order_id::text,'Verified payment captured'
    );
  END LOOP;
  UPDATE orders SET order_status='confirmed',payment_status='paid',payment_reference=p_payment_reference,
    reservation_expires_at=NULL,paid_at=now(),confirmed_at=now(),updated_at=now()
    WHERE id=p_order_id RETURNING * INTO target;
  INSERT INTO order_events(id,order_id,event_type,actor_type,external_reference,data)
    VALUES(gen_random_uuid(),p_order_id,'payment.captured','payment',p_payment_reference,
      jsonb_build_object('warehouseId',target.warehouse_id))
    ON CONFLICT(event_type,external_reference) WHERE external_reference IS NOT NULL DO NOTHING;
  RETURN target;
END;$$;

CREATE TABLE order_expiration_failures (
  order_id uuid PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
  attempts integer NOT NULL DEFAULT 1 CHECK (attempts>0),
  last_error_code text NOT NULL,
  last_error_message text NOT NULL,
  first_failed_at timestamptz NOT NULL DEFAULT now(),
  last_failed_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
CREATE INDEX order_expiration_failures_open_idx
  ON order_expiration_failures(last_failed_at) WHERE resolved_at IS NULL;

CREATE OR REPLACE FUNCTION prune_checkout_security_data() RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE deleted_count integer:=0; affected integer;
BEGIN
  DELETE FROM checkout_rate_limit_buckets
    WHERE window_started_at<now()-interval '1 day';
  GET DIAGNOSTICS affected=ROW_COUNT;
  deleted_count:=deleted_count+affected;
  DELETE FROM checkout_security_events
    WHERE created_at<now()-interval '90 days';
  GET DIAGNOSTICS affected=ROW_COUNT;
  deleted_count:=deleted_count+affected;
  RETURN deleted_count;
END;$$;

CREATE OR REPLACE FUNCTION expire_order_reservations() RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE candidate record; expired_count integer:=0; failure_state text; failure_message text;
BEGIN
  PERFORM prune_checkout_security_data();
  FOR candidate IN
    SELECT id FROM orders
    WHERE order_status='pending_payment'
      AND payment_status IN ('not_started','pending','failed','cancelled')
      AND reservation_expires_at<=now()
    ORDER BY reservation_expires_at
    LIMIT 100
    FOR UPDATE SKIP LOCKED
  LOOP
    BEGIN
      PERFORM release_order_reservation(candidate.id,'expired','Checkout reservation expired');
      expired_count:=expired_count+1;
      UPDATE order_expiration_failures SET resolved_at=now() WHERE order_id=candidate.id AND resolved_at IS NULL;
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS failure_state=RETURNED_SQLSTATE,failure_message=MESSAGE_TEXT;
      INSERT INTO order_expiration_failures(order_id,last_error_code,last_error_message)
        VALUES(candidate.id,failure_state,left(failure_message,500))
      ON CONFLICT(order_id) DO UPDATE SET
        attempts=order_expiration_failures.attempts+1,
        last_error_code=EXCLUDED.last_error_code,
        last_error_message=EXCLUDED.last_error_message,
        last_failed_at=now(),resolved_at=NULL;
    END;
  END LOOP;
  RETURN expired_count;
END;$$;
