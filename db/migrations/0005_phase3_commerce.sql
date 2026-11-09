-- Phase 3 commerce operations extension. The fixed bootstrap identifiers only
-- establish an isolated development tenancy; production tenancy is configured
-- explicitly before any controlled migration.
CREATE TABLE organizations (
  id uuid PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE stores (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  slug text NOT NULL,
  name text NOT NULL,
  timezone text NOT NULL DEFAULT 'Asia/Shanghai',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug)
);

CREATE TABLE warehouses (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  store_id uuid REFERENCES stores(id) ON DELETE RESTRICT,
  code text NOT NULL,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code)
);

INSERT INTO organizations (id, slug, name)
VALUES ('00000000-0000-4000-8000-000000000001', 'sgl', 'The Seagull Labs')
ON CONFLICT (id) DO NOTHING;
INSERT INTO stores (id, organization_id, slug, name)
VALUES ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', 'online', 'SGL Online')
ON CONFLICT (id) DO NOTHING;
INSERT INTO warehouses (id, organization_id, store_id, code, name)
VALUES ('00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'ONLINE', 'Online Fulfillment')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE organization_memberships (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'inventory', 'fulfillment', 'support', 'viewer')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE TABLE store_memberships (
  id uuid PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'editor', 'inventory', 'fulfillment', 'support', 'viewer')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, user_id)
);

INSERT INTO organization_memberships (id, organization_id, user_id, role)
SELECT gen_random_uuid(), '00000000-0000-4000-8000-000000000001', id, role FROM admin_users
ON CONFLICT (organization_id, user_id) DO NOTHING;

ALTER TABLE products ADD COLUMN organization_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001' REFERENCES organizations(id);
ALTER TABLE customers ADD COLUMN organization_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001' REFERENCES organizations(id);
ALTER TABLE customers ADD COLUMN membership_status text NOT NULL DEFAULT 'guest' CHECK (membership_status IN ('guest', 'member', 'vip', 'inactive'));
ALTER TABLE customers ADD COLUMN marketing_consent boolean NOT NULL DEFAULT false;
ALTER TABLE customers ADD COLUMN communication_preferences jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(communication_preferences) = 'object');
ALTER TABLE orders ADD COLUMN organization_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001' REFERENCES organizations(id);
ALTER TABLE orders ADD COLUMN store_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000002' REFERENCES stores(id);
ALTER TABLE orders ADD COLUMN warehouse_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000003' REFERENCES warehouses(id);
ALTER TABLE orders ADD COLUMN fulfillment_stage text NOT NULL DEFAULT 'pending' CHECK (fulfillment_stage IN ('pending', 'picking', 'packing', 'ready', 'shipped', 'delivered', 'cancelled'));
CREATE INDEX orders_store_created_idx ON orders(store_id, created_at DESC);

ALTER TABLE inventory_levels ADD COLUMN warehouse_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000003' REFERENCES warehouses(id);
ALTER TABLE inventory_levels DROP CONSTRAINT inventory_levels_pkey;
ALTER TABLE inventory_levels ADD PRIMARY KEY (variant_id, warehouse_id);
CREATE INDEX inventory_levels_warehouse_idx ON inventory_levels(warehouse_id, available, low_stock_threshold);
ALTER TABLE inventory_movements ADD COLUMN warehouse_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000003' REFERENCES warehouses(id);
CREATE INDEX inventory_movements_warehouse_created_idx ON inventory_movements(warehouse_id, created_at DESC);

ALTER TABLE fulfillment_shipments ADD COLUMN store_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000002' REFERENCES stores(id);
ALTER TABLE fulfillment_shipments ADD COLUMN warehouse_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000003' REFERENCES warehouses(id);
ALTER TABLE fulfillment_shipments ADD COLUMN provider text NOT NULL DEFAULT 'manual';

CREATE TABLE order_notes (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 2000),
  created_by uuid NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_notes_order_idx ON order_notes(order_id, created_at DESC);

CREATE TABLE payments (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  provider text NOT NULL CHECK (provider IN ('stripe', 'alipay', 'development')),
  provider_reference text,
  idempotency_key text NOT NULL,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  status text NOT NULL CHECK (status IN ('created', 'pending', 'authorized', 'paid', 'failed', 'cancelled', 'partially_refunded', 'refunded', 'disputed')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, idempotency_key),
  UNIQUE (provider, provider_reference)
);
CREATE INDEX payments_order_created_idx ON payments(order_id, created_at DESC);

CREATE TABLE payment_events (
  id uuid PRIMARY KEY,
  payment_id uuid NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  event_type text NOT NULL,
  external_event_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (payment_id, external_event_id)
);

CREATE TABLE refunds (
  id uuid PRIMARY KEY,
  payment_id uuid NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  provider_reference text,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  status text NOT NULL CHECK (status IN ('requested', 'approved', 'processing', 'succeeded', 'failed', 'cancelled')),
  reason text NOT NULL,
  requested_by uuid NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  approved_by uuid REFERENCES admin_users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX refunds_order_created_idx ON refunds(order_id, created_at DESC);

CREATE TABLE returns (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  status text NOT NULL CHECK (status IN ('requested', 'approved', 'received', 'inspected', 'completed', 'rejected', 'cancelled')),
  reason text NOT NULL,
  resolution text CHECK (resolution IS NULL OR resolution IN ('refund', 'exchange', 'store_credit', 'none')),
  tracking_number text,
  created_by uuid NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  updated_by uuid NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX returns_order_created_idx ON returns(order_id, created_at DESC);

CREATE TABLE return_items (
  return_id uuid NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  order_item_id uuid NOT NULL REFERENCES order_items(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  condition text,
  PRIMARY KEY (return_id, order_item_id)
);

CREATE TABLE support_conversations (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  store_id uuid REFERENCES stores(id) ON DELETE RESTRICT,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  customer_name text,
  customer_email text,
  locale text NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'zh-CN', 'ja-JP', 'ko-KR', 'it-IT')),
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'waiting_customer', 'waiting_staff', 'resolved', 'closed')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_user_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  access_token_hash text NOT NULL UNIQUE,
  human_handoff_requested boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
CREATE INDEX support_conversations_queue_idx ON support_conversations(status, priority, updated_at DESC);

CREATE TABLE support_messages (
  id uuid PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('customer', 'ai', 'staff', 'system')),
  sender_user_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  body text NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 4000),
  provider text,
  provider_reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX support_messages_conversation_idx ON support_messages(conversation_id, created_at);

CREATE TABLE support_tags (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#d9ff3f',
  UNIQUE (organization_id, name)
);
CREATE TABLE support_conversation_tags (
  conversation_id uuid NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES support_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, tag_id)
);

CREATE TABLE knowledge_base_articles (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('brand', 'product', 'specification', 'shipping', 'returns', 'faq', 'instruction')),
  slug text NOT NULL,
  locale text NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'zh-CN', 'ja-JP', 'ko-KR', 'it-IT')),
  title text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  updated_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, locale, slug)
);
CREATE INDEX knowledge_base_published_idx ON knowledge_base_articles(organization_id, locale, category) WHERE status = 'published';

CREATE TABLE integration_outbox (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  store_id uuid REFERENCES stores(id) ON DELETE RESTRICT,
  destination text NOT NULL CHECK (destination IN ('station', 'retail_agent', 'email', 'shipping', 'camera')),
  event_type text NOT NULL,
  aggregate_type text NOT NULL,
  aggregate_id text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload) = 'object'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'delivered', 'failed', 'cancelled')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  next_attempt_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX integration_outbox_pending_idx ON integration_outbox(destination, status, next_attempt_at, created_at);

CREATE OR REPLACE FUNCTION adjust_inventory_at_location(
  p_movement_id uuid,
  p_variant_id uuid,
  p_warehouse_id uuid,
  p_delta_on_hand integer,
  p_delta_reserved integer,
  p_movement_type text,
  p_reason text,
  p_reference_type text,
  p_reference_id text,
  p_actor_user_id uuid
) RETURNS inventory_levels
LANGUAGE plpgsql
AS $$
DECLARE level inventory_levels;
BEGIN
  IF p_movement_type NOT IN ('seed', 'adjustment', 'reservation', 'release', 'sale', 'return', 'correction') THEN RAISE EXCEPTION 'invalid inventory movement type'; END IF;
  IF length(trim(p_reason)) = 0 THEN RAISE EXCEPTION 'inventory adjustment reason is required'; END IF;
  UPDATE inventory_levels SET on_hand = on_hand + p_delta_on_hand, reserved = reserved + p_delta_reserved, updated_at = now()
    WHERE variant_id = p_variant_id AND warehouse_id = p_warehouse_id
      AND on_hand + p_delta_on_hand >= 0 AND reserved + p_delta_reserved >= 0
      AND on_hand + p_delta_on_hand >= reserved + p_delta_reserved RETURNING * INTO level;
  IF NOT FOUND THEN RAISE EXCEPTION 'inventory adjustment would make stock negative or location was not found'; END IF;
  INSERT INTO inventory_movements (id, variant_id, warehouse_id, movement_type, delta_on_hand, delta_reserved, on_hand_after, reserved_after, reference_type, reference_id, reason, actor_user_id)
    VALUES (p_movement_id, p_variant_id, p_warehouse_id, p_movement_type, p_delta_on_hand, p_delta_reserved, level.on_hand, level.reserved, p_reference_type, p_reference_id, p_reason, p_actor_user_id);
  RETURN level;
END;
$$;

-- Backwards-compatible single-location entry point. New code must call the
-- location-aware function explicitly.
CREATE OR REPLACE FUNCTION adjust_inventory(
  p_movement_id uuid,p_variant_id uuid,p_delta_on_hand integer,p_delta_reserved integer,
  p_movement_type text,p_reason text,p_reference_type text,p_reference_id text,p_actor_user_id uuid
) RETURNS inventory_levels LANGUAGE sql AS $$
  SELECT * FROM adjust_inventory_at_location(p_movement_id,p_variant_id,'00000000-0000-4000-8000-000000000003',p_delta_on_hand,p_delta_reserved,p_movement_type,p_reason,p_reference_type,p_reference_id,p_actor_user_id);
$$;

CREATE OR REPLACE FUNCTION reserve_order_inventory(p_order_id uuid,p_expires_at timestamptz) RETURNS orders LANGUAGE plpgsql AS $$
DECLARE target orders; item record; level inventory_levels;
BEGIN
  SELECT * INTO target FROM orders WHERE id=p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not found'; END IF;
  IF target.order_status='pending_payment' AND target.reservation_expires_at>now() THEN RETURN target; END IF;
  IF target.order_status<>'draft' THEN RAISE EXCEPTION 'order cannot reserve inventory from status %',target.order_status; END IF;
  IF p_expires_at<now()+interval '30 minutes' OR p_expires_at>now()+interval '24 hours' THEN RAISE EXCEPTION 'reservation expiry must be between 30 minutes and 24 hours'; END IF;
  FOR item IN SELECT variant_id,quantity FROM order_items WHERE order_id=p_order_id ORDER BY variant_id LOOP
    UPDATE inventory_levels SET reserved=reserved+item.quantity,updated_at=now()
      WHERE variant_id=item.variant_id AND warehouse_id=target.warehouse_id AND available>=item.quantity RETURNING * INTO level;
    IF NOT FOUND THEN RAISE EXCEPTION 'insufficient inventory for variant %',item.variant_id; END IF;
    INSERT INTO inventory_movements(id,variant_id,warehouse_id,movement_type,delta_on_hand,delta_reserved,on_hand_after,reserved_after,reference_type,reference_id,reason)
      VALUES(gen_random_uuid(),item.variant_id,target.warehouse_id,'reservation',0,item.quantity,level.on_hand,level.reserved,'order',p_order_id::text,'Checkout inventory reservation');
  END LOOP;
  UPDATE orders SET order_status='pending_payment',payment_status='pending',reservation_expires_at=p_expires_at,updated_at=now() WHERE id=p_order_id RETURNING * INTO target;
  INSERT INTO order_events(id,order_id,event_type,actor_type,data) VALUES(gen_random_uuid(),p_order_id,'inventory.reserved','system',jsonb_build_object('expiresAt',p_expires_at,'warehouseId',target.warehouse_id));
  RETURN target;
END;$$;

CREATE OR REPLACE FUNCTION release_order_reservation(p_order_id uuid,p_final_status text,p_reason text) RETURNS orders LANGUAGE plpgsql AS $$
DECLARE target orders; item record; level inventory_levels;
BEGIN
  IF p_final_status NOT IN ('cancelled','expired') THEN RAISE EXCEPTION 'invalid reservation final status'; END IF;
  IF length(trim(p_reason))=0 THEN RAISE EXCEPTION 'release reason is required'; END IF;
  SELECT * INTO target FROM orders WHERE id=p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not found'; END IF;
  IF target.order_status<>'pending_payment' THEN RETURN target; END IF;
  FOR item IN SELECT variant_id,quantity FROM order_items WHERE order_id=p_order_id ORDER BY variant_id LOOP
    UPDATE inventory_levels SET reserved=reserved-item.quantity,updated_at=now()
      WHERE variant_id=item.variant_id AND warehouse_id=target.warehouse_id AND reserved>=item.quantity RETURNING * INTO level;
    IF NOT FOUND THEN RAISE EXCEPTION 'reserved inventory is inconsistent for variant %',item.variant_id; END IF;
    INSERT INTO inventory_movements(id,variant_id,warehouse_id,movement_type,delta_on_hand,delta_reserved,on_hand_after,reserved_after,reference_type,reference_id,reason)
      VALUES(gen_random_uuid(),item.variant_id,target.warehouse_id,'release',0,-item.quantity,level.on_hand,level.reserved,'order',p_order_id::text,p_reason);
  END LOOP;
  UPDATE orders SET order_status=p_final_status,payment_status=CASE WHEN payment_status IN('not_started','pending') THEN 'cancelled' ELSE payment_status END,reservation_expires_at=NULL,cancelled_at=now(),updated_at=now() WHERE id=p_order_id RETURNING * INTO target;
  INSERT INTO order_events(id,order_id,event_type,actor_type,data) VALUES(gen_random_uuid(),p_order_id,'inventory.released','system',jsonb_build_object('reason',p_reason,'status',p_final_status,'warehouseId',target.warehouse_id));
  RETURN target;
END;$$;

CREATE OR REPLACE FUNCTION capture_order_payment(p_order_id uuid,p_payment_reference text) RETURNS orders LANGUAGE plpgsql AS $$
DECLARE target orders; item record; level inventory_levels;
BEGIN
  IF length(trim(p_payment_reference))=0 THEN RAISE EXCEPTION 'payment reference is required'; END IF;
  SELECT * INTO target FROM orders WHERE id=p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not found'; END IF;
  IF target.payment_status='paid' AND target.payment_reference=p_payment_reference THEN RETURN target; END IF;
  IF target.order_status<>'pending_payment' OR target.payment_status<>'pending' OR target.reservation_expires_at<=now() THEN RAISE EXCEPTION 'order is not payable'; END IF;
  FOR item IN SELECT variant_id,quantity FROM order_items WHERE order_id=p_order_id ORDER BY variant_id LOOP
    UPDATE inventory_levels SET on_hand=on_hand-item.quantity,reserved=reserved-item.quantity,updated_at=now()
      WHERE variant_id=item.variant_id AND warehouse_id=target.warehouse_id AND on_hand>=item.quantity AND reserved>=item.quantity RETURNING * INTO level;
    IF NOT FOUND THEN RAISE EXCEPTION 'reserved inventory is inconsistent for variant %',item.variant_id; END IF;
    INSERT INTO inventory_movements(id,variant_id,warehouse_id,movement_type,delta_on_hand,delta_reserved,on_hand_after,reserved_after,reference_type,reference_id,reason)
      VALUES(gen_random_uuid(),item.variant_id,target.warehouse_id,'sale',-item.quantity,-item.quantity,level.on_hand,level.reserved,'order',p_order_id::text,'Payment captured');
  END LOOP;
  UPDATE orders SET order_status='confirmed',payment_status='paid',payment_reference=p_payment_reference,reservation_expires_at=NULL,confirmed_at=now(),paid_at=now(),updated_at=now() WHERE id=p_order_id RETURNING * INTO target;
  INSERT INTO order_events(id,order_id,event_type,actor_type,external_reference,data) VALUES(gen_random_uuid(),p_order_id,'payment.captured','payment',p_payment_reference,jsonb_build_object('warehouseId',target.warehouse_id));
  RETURN target;
END;$$;
