CREATE TABLE shipping_regions (
  id uuid PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  country_codes jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(country_codes) = 'array'),
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE fulfillment_shipments (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  carrier text NOT NULL,
  tracking_number text NOT NULL,
  tracking_url text,
  status text NOT NULL DEFAULT 'shipped' CHECK (status IN ('prepared', 'shipped', 'delivered', 'cancelled')),
  address_confirmed_at timestamptz NOT NULL,
  dispatched_at timestamptz,
  delivered_at timestamptz,
  created_by uuid NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  updated_by uuid NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (carrier, tracking_number),
  CHECK (length(trim(carrier)) BETWEEN 2 AND 100),
  CHECK (length(trim(tracking_number)) BETWEEN 2 AND 150)
);
CREATE INDEX fulfillment_shipments_order_idx ON fulfillment_shipments(order_id, created_at DESC);

CREATE TABLE fulfillment_events (
  id uuid PRIMARY KEY,
  shipment_id uuid NOT NULL REFERENCES fulfillment_shipments(id) ON DELETE RESTRICT,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  event_type text NOT NULL,
  actor_user_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(data) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX fulfillment_events_order_idx ON fulfillment_events(order_id, created_at DESC);

CREATE TABLE notification_outbox (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  notification_type text NOT NULL CHECK (notification_type IN ('order_confirmation', 'payment_confirmation', 'shipment_confirmation', 'tracking_update', 'cancellation', 'refund')),
  locale text NOT NULL CHECK (locale IN ('en', 'zh-CN', 'ja-JP', 'ko-KR', 'it-IT')),
  recipient text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'delivered', 'failed', 'cancelled')),
  provider text,
  provider_reference text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload) = 'object'),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  next_attempt_at timestamptz,
  accepted_at timestamptz,
  delivered_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notification_outbox_pending_idx ON notification_outbox(status, next_attempt_at, created_at);
