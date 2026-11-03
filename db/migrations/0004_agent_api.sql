CREATE TABLE agent_clients (
  id uuid PRIMARY KEY,
  name text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  CHECK (length(trim(name)) BETWEEN 2 AND 120)
);

CREATE TABLE agent_tokens (
  id uuid PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES agent_clients(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  token_prefix text NOT NULL,
  scopes jsonb NOT NULL CHECK (jsonb_typeof(scopes) = 'array'),
  expires_at timestamptz NOT NULL,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_by uuid NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at > created_at)
);
CREATE INDEX agent_tokens_client_idx ON agent_tokens(client_id, expires_at) WHERE revoked_at IS NULL;

CREATE TABLE agent_action_requests (
  id uuid PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES agent_clients(id) ON DELETE RESTRICT,
  token_id uuid NOT NULL REFERENCES agent_tokens(id) ON DELETE RESTRICT,
  action_type text NOT NULL CHECK (action_type IN ('inventory_adjustment', 'shipping_dispatch', 'product_content_update', 'price_change', 'refund')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  target_type text NOT NULL,
  target_id text NOT NULL,
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  idempotency_key text NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_note text,
  UNIQUE (client_id, idempotency_key),
  CHECK (length(trim(idempotency_key)) BETWEEN 8 AND 120),
  CHECK (length(trim(target_id)) BETWEEN 1 AND 200),
  CHECK ((status = 'pending' AND reviewed_at IS NULL AND reviewed_by IS NULL) OR status <> 'pending')
);
CREATE INDEX agent_action_requests_status_idx ON agent_action_requests(status, requested_at DESC);

CREATE TABLE agent_audit_logs (
  id uuid PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES agent_clients(id) ON DELETE RESTRICT,
  token_id uuid REFERENCES agent_tokens(id) ON DELETE SET NULL,
  method text NOT NULL,
  path text NOT NULL,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  request_id text,
  outcome text NOT NULL CHECK (outcome IN ('success', 'denied', 'failed')),
  data jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(data) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX agent_audit_logs_client_created_idx ON agent_audit_logs(client_id, created_at DESC);

