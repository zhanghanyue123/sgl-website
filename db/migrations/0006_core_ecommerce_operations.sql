-- Phase 3.2 core e-commerce operations. Development/staging migration only
-- until an explicitly approved production rollout is prepared.

CREATE TABLE collections (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug)
);

CREATE TABLE product_collections (
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, collection_id)
);
CREATE INDEX product_collections_collection_idx ON product_collections(collection_id, position, product_id);

CREATE TABLE inventory_stocktakes (
  id uuid PRIMARY KEY,
  variant_id uuid NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  warehouse_id uuid NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  previous_on_hand integer NOT NULL CHECK (previous_on_hand >= 0),
  counted_on_hand integer NOT NULL CHECK (counted_on_hand >= 0),
  adjustment integer NOT NULL,
  reason text NOT NULL,
  counted_by uuid NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (counted_on_hand - previous_on_hand = adjustment)
);
CREATE INDEX inventory_stocktakes_variant_created_idx ON inventory_stocktakes(variant_id, warehouse_id, created_at DESC);

CREATE TABLE order_cancellation_requests (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'withdrawn')),
  requested_by uuid NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  reviewed_by uuid REFERENCES admin_users(id) ON DELETE RESTRICT,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
CREATE UNIQUE INDEX order_cancellation_one_open_idx ON order_cancellation_requests(order_id) WHERE status='requested';
CREATE INDEX order_cancellation_order_created_idx ON order_cancellation_requests(order_id, created_at DESC);

ALTER TABLE fulfillment_shipments ADD COLUMN internal_notes text;
ALTER TABLE fulfillment_shipments ADD COLUMN shipment_date timestamptz;

CREATE TABLE fulfillment_shipment_items (
  shipment_id uuid NOT NULL REFERENCES fulfillment_shipments(id) ON DELETE RESTRICT,
  order_item_id uuid NOT NULL REFERENCES order_items(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (shipment_id, order_item_id)
);
CREATE INDEX fulfillment_shipment_items_order_item_idx ON fulfillment_shipment_items(order_item_id, shipment_id);

UPDATE fulfillment_shipments SET shipment_date=COALESCE(dispatched_at,created_at) WHERE shipment_date IS NULL;
