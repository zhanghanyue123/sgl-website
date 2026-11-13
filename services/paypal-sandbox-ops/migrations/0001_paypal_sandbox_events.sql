CREATE TABLE IF NOT EXISTS paypal_sandbox_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  payload_sha256 text NOT NULL CHECK (payload_sha256 ~ '^[a-f0-9]{64}$'),
  resource_id text,
  received_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  delivery_count integer NOT NULL DEFAULT 1 CHECK (delivery_count > 0),
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processed', 'ignored', 'failed'))
);

CREATE INDEX IF NOT EXISTS paypal_sandbox_webhook_events_received_idx
  ON paypal_sandbox_webhook_events (received_at DESC);
