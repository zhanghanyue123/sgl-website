CREATE TABLE customers (
  id uuid PRIMARY KEY,
  email text,
  phone text,
  display_name text,
  locale text NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'zh-CN', 'ja-JP', 'ko-KR', 'it-IT')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (email IS NULL OR length(trim(email)) BETWEEN 3 AND 320),
  CHECK (phone IS NULL OR length(trim(phone)) BETWEEN 3 AND 50)
);
CREATE UNIQUE INDEX customers_email_unique ON customers (lower(email)) WHERE email IS NOT NULL;

CREATE TABLE orders (
  id uuid PRIMARY KEY,
  order_number text NOT NULL UNIQUE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  customer_email text,
  customer_name text,
  locale text NOT NULL CHECK (locale IN ('en', 'zh-CN', 'ja-JP', 'ko-KR', 'it-IT')),
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  items_subtotal_cents integer NOT NULL CHECK (items_subtotal_cents >= 0),
  shipping_cents integer NOT NULL DEFAULT 0 CHECK (shipping_cents >= 0),
  tax_cents integer NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
  discount_cents integer NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  total_cents integer NOT NULL CHECK (total_cents >= 0),
  order_status text NOT NULL DEFAULT 'draft' CHECK (order_status IN ('draft', 'pending_payment', 'confirmed', 'cancelled', 'expired')),
  payment_status text NOT NULL DEFAULT 'not_started' CHECK (payment_status IN ('not_started', 'pending', 'paid', 'failed', 'cancelled', 'partially_refunded', 'refunded', 'disputed')),
  fulfillment_status text NOT NULL DEFAULT 'unfulfilled' CHECK (fulfillment_status IN ('unfulfilled', 'processing', 'shipped', 'delivered', 'cancelled')),
  reservation_expires_at timestamptz,
  idempotency_key text NOT NULL UNIQUE,
  request_hash text NOT NULL,
  payment_reference text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  paid_at timestamptz,
  CHECK (total_cents = items_subtotal_cents + shipping_cents + tax_cents - discount_cents),
  CHECK (discount_cents <= items_subtotal_cents + shipping_cents + tax_cents),
  CHECK (customer_email IS NULL OR length(trim(customer_email)) BETWEEN 3 AND 320),
  CHECK (payment_status <> 'paid' OR paid_at IS NOT NULL),
  CHECK (order_status <> 'confirmed' OR payment_status IN ('paid', 'partially_refunded', 'refunded', 'disputed'))
);
CREATE INDEX orders_created_at_idx ON orders(created_at DESC);
CREATE INDEX orders_status_idx ON orders(order_status, payment_status, fulfillment_status, created_at DESC);
CREATE INDEX orders_reservation_expiry_idx ON orders(reservation_expires_at) WHERE order_status = 'pending_payment';
CREATE UNIQUE INDEX orders_payment_reference_unique ON orders(payment_reference) WHERE payment_reference IS NOT NULL;

CREATE TABLE order_addresses (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  address_type text NOT NULL CHECK (address_type IN ('shipping', 'billing')),
  recipient_name text NOT NULL,
  phone text,
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  region text,
  postal_code text,
  country_code text NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, address_type),
  CHECK (length(trim(recipient_name)) > 0),
  CHECK (length(trim(line1)) > 0),
  CHECK (length(trim(city)) > 0)
);
CREATE INDEX order_addresses_order_id_idx ON order_addresses(order_id);

CREATE TABLE order_items (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id uuid NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  sku text,
  product_title text NOT NULL,
  variant_title text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(options) = 'array'),
  image_url text,
  unit_price_cents integer NOT NULL CHECK (unit_price_cents >= 0),
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 99),
  line_total_cents integer NOT NULL CHECK (line_total_cents >= 0),
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, variant_id),
  CHECK (length(trim(product_title)) > 0),
  CHECK (length(trim(variant_title)) > 0),
  CHECK (line_total_cents = unit_price_cents * quantity),
  CHECK (sku IS NULL OR length(trim(sku)) > 0)
);
CREATE INDEX order_items_order_id_idx ON order_items(order_id);
CREATE INDEX order_items_variant_id_idx ON order_items(variant_id);

CREATE TABLE order_events (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  event_type text NOT NULL,
  actor_type text NOT NULL CHECK (actor_type IN ('system', 'customer', 'admin', 'payment')),
  actor_user_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  external_reference text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(data) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_events_order_created_idx ON order_events(order_id, created_at DESC);
CREATE UNIQUE INDEX order_events_external_unique ON order_events(event_type, external_reference) WHERE external_reference IS NOT NULL;

CREATE OR REPLACE FUNCTION reserve_order_inventory(
  p_order_id uuid,
  p_expires_at timestamptz
) RETURNS orders
LANGUAGE plpgsql
AS $$
DECLARE
  target orders;
  item record;
  level inventory_levels;
BEGIN
  SELECT * INTO target FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not found'; END IF;
  IF target.order_status = 'pending_payment' AND target.reservation_expires_at > now() THEN RETURN target; END IF;
  IF target.order_status <> 'draft' THEN RAISE EXCEPTION 'order cannot reserve inventory from status %', target.order_status; END IF;
  IF p_expires_at < now() + interval '30 minutes' OR p_expires_at > now() + interval '24 hours' THEN
    RAISE EXCEPTION 'reservation expiry must be between 30 minutes and 24 hours';
  END IF;

  FOR item IN
    SELECT variant_id, quantity FROM order_items WHERE order_id = p_order_id ORDER BY variant_id
  LOOP
    UPDATE inventory_levels
    SET reserved = reserved + item.quantity, updated_at = now()
    WHERE variant_id = item.variant_id AND available >= item.quantity
    RETURNING * INTO level;
    IF NOT FOUND THEN RAISE EXCEPTION 'insufficient inventory for variant %', item.variant_id; END IF;

    INSERT INTO inventory_movements (
      id, variant_id, movement_type, delta_on_hand, delta_reserved,
      on_hand_after, reserved_after, reference_type, reference_id, reason
    ) VALUES (
      gen_random_uuid(), item.variant_id, 'reservation', 0, item.quantity,
      level.on_hand, level.reserved, 'order', p_order_id::text, 'Checkout inventory reservation'
    );
  END LOOP;

  UPDATE orders
  SET order_status = 'pending_payment', payment_status = 'pending', reservation_expires_at = p_expires_at, updated_at = now()
  WHERE id = p_order_id RETURNING * INTO target;
  INSERT INTO order_events (id, order_id, event_type, actor_type, data)
  VALUES (gen_random_uuid(), p_order_id, 'inventory.reserved', 'system', jsonb_build_object('expiresAt', p_expires_at));
  RETURN target;
END;
$$;

CREATE OR REPLACE FUNCTION release_order_reservation(
  p_order_id uuid,
  p_final_status text,
  p_reason text
) RETURNS orders
LANGUAGE plpgsql
AS $$
DECLARE
  target orders;
  item record;
  level inventory_levels;
BEGIN
  IF p_final_status NOT IN ('cancelled', 'expired') THEN RAISE EXCEPTION 'invalid reservation final status'; END IF;
  IF length(trim(p_reason)) = 0 THEN RAISE EXCEPTION 'release reason is required'; END IF;
  SELECT * INTO target FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not found'; END IF;
  IF target.order_status <> 'pending_payment' THEN RETURN target; END IF;

  FOR item IN
    SELECT variant_id, quantity FROM order_items WHERE order_id = p_order_id ORDER BY variant_id
  LOOP
    UPDATE inventory_levels
    SET reserved = reserved - item.quantity, updated_at = now()
    WHERE variant_id = item.variant_id AND reserved >= item.quantity
    RETURNING * INTO level;
    IF NOT FOUND THEN RAISE EXCEPTION 'reserved inventory is inconsistent for variant %', item.variant_id; END IF;

    INSERT INTO inventory_movements (
      id, variant_id, movement_type, delta_on_hand, delta_reserved,
      on_hand_after, reserved_after, reference_type, reference_id, reason
    ) VALUES (
      gen_random_uuid(), item.variant_id, 'release', 0, -item.quantity,
      level.on_hand, level.reserved, 'order', p_order_id::text, p_reason
    );
  END LOOP;

  UPDATE orders
  SET order_status = p_final_status,
      payment_status = CASE WHEN payment_status IN ('not_started', 'pending') THEN 'cancelled' ELSE payment_status END,
      reservation_expires_at = NULL, cancelled_at = now(), updated_at = now()
  WHERE id = p_order_id RETURNING * INTO target;
  INSERT INTO order_events (id, order_id, event_type, actor_type, data)
  VALUES (gen_random_uuid(), p_order_id, 'inventory.released', 'system', jsonb_build_object('reason', p_reason, 'status', p_final_status));
  RETURN target;
END;
$$;

CREATE OR REPLACE FUNCTION capture_order_payment(
  p_order_id uuid,
  p_payment_reference text
) RETURNS orders
LANGUAGE plpgsql
AS $$
DECLARE
  target orders;
  item record;
  level inventory_levels;
BEGIN
  IF length(trim(p_payment_reference)) = 0 THEN RAISE EXCEPTION 'payment reference is required'; END IF;
  SELECT * INTO target FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not found'; END IF;
  IF target.payment_status = 'paid' AND target.payment_reference = p_payment_reference THEN RETURN target; END IF;
  IF target.order_status <> 'pending_payment' OR target.payment_status <> 'pending' OR target.reservation_expires_at <= now() THEN
    RAISE EXCEPTION 'order is not eligible for payment capture';
  END IF;

  FOR item IN
    SELECT variant_id, quantity FROM order_items WHERE order_id = p_order_id ORDER BY variant_id
  LOOP
    UPDATE inventory_levels
    SET on_hand = on_hand - item.quantity, reserved = reserved - item.quantity, updated_at = now()
    WHERE variant_id = item.variant_id AND on_hand >= item.quantity AND reserved >= item.quantity
    RETURNING * INTO level;
    IF NOT FOUND THEN RAISE EXCEPTION 'reserved inventory is inconsistent for variant %', item.variant_id; END IF;

    INSERT INTO inventory_movements (
      id, variant_id, movement_type, delta_on_hand, delta_reserved,
      on_hand_after, reserved_after, reference_type, reference_id, reason
    ) VALUES (
      gen_random_uuid(), item.variant_id, 'sale', -item.quantity, -item.quantity,
      level.on_hand, level.reserved, 'order', p_order_id::text, 'Verified payment captured'
    );
  END LOOP;

  UPDATE orders
  SET order_status = 'confirmed', payment_status = 'paid', payment_reference = p_payment_reference,
      reservation_expires_at = NULL, paid_at = now(), confirmed_at = now(), updated_at = now()
  WHERE id = p_order_id RETURNING * INTO target;
  INSERT INTO order_events (id, order_id, event_type, actor_type, external_reference, data)
  VALUES (gen_random_uuid(), p_order_id, 'payment.captured', 'payment', p_payment_reference, '{}'::jsonb);
  RETURN target;
END;
$$;

CREATE OR REPLACE FUNCTION expire_order_reservations() RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  candidate record;
  expired_count integer := 0;
BEGIN
  FOR candidate IN
    SELECT id FROM orders
    WHERE order_status = 'pending_payment' AND reservation_expires_at <= now()
    ORDER BY reservation_expires_at
    FOR UPDATE SKIP LOCKED
  LOOP
    PERFORM release_order_reservation(candidate.id, 'expired', 'Checkout reservation expired');
    expired_count := expired_count + 1;
  END LOOP;
  RETURN expired_count;
END;
$$;
