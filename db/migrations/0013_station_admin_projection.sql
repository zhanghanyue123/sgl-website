-- Station OS remains the system of record. This table stores only its latest
-- bounded management projection; edits travel through the existing outbox.
INSERT INTO stores(id,organization_id,slug,name)
VALUES ('00000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000001','station-shanghai','Seagull Station Shanghai')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE station_admin_snapshots (
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  version bigint NOT NULL CHECK (version >= 1),
  generated_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL,
  payload_digest text NOT NULL CHECK (length(payload_digest) = 64),
  PRIMARY KEY (organization_id, store_id),
  CHECK (jsonb_typeof(payload) = 'object'),
  CHECK (octet_length(payload::text) <= 524288)
);

CREATE INDEX station_admin_snapshots_received_idx
  ON station_admin_snapshots(received_at DESC);

CREATE INDEX integration_outbox_station_admin_idx
  ON integration_outbox(destination, source, status, next_attempt_at, created_at)
  WHERE destination = 'station' AND source = 'website';
