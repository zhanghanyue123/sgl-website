-- Website support events use the existing integration outbox. This migration
-- adds a client-bound, expiring lease rather than creating another customer,
-- order, CMS, or delivery table.
ALTER TABLE integration_outbox
  ADD COLUMN source text NOT NULL DEFAULT 'commerce'
    CHECK (source IN ('commerce', 'website')),
  ADD COLUMN lease_expires_at timestamptz,
  ADD COLUMN leased_by_agent_client_id uuid REFERENCES agent_clients(id) ON DELETE SET NULL,
  ADD COLUMN lease_token_hash text,
  ADD COLUMN acknowledged_at timestamptz,
  ADD COLUMN ack_idempotency_key text,
  ADD COLUMN max_attempts integer NOT NULL DEFAULT 5 CHECK (max_attempts BETWEEN 1 AND 20),
  ADD COLUMN failed_at timestamptz,
  ADD COLUMN last_error_code text CHECK (last_error_code IS NULL OR length(last_error_code) BETWEEN 2 AND 80);

ALTER TABLE agent_clients
  ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE RESTRICT
    DEFAULT '00000000-0000-4000-8000-000000000001',
  ADD COLUMN store_id uuid REFERENCES stores(id) ON DELETE RESTRICT;
ALTER TABLE agent_clients ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE agent_clients ALTER COLUMN organization_id DROP DEFAULT;

ALTER TABLE integration_outbox
  ADD CONSTRAINT integration_outbox_lease_state_check CHECK (
    source <> 'website' OR status <> 'processing' OR
    (lease_expires_at IS NOT NULL
      AND leased_by_agent_client_id IS NOT NULL AND lease_token_hash IS NOT NULL)
  ),
  ADD CONSTRAINT integration_outbox_ack_state_check CHECK (
    source <> 'website' OR status <> 'delivered' OR
    (acknowledged_at IS NOT NULL AND ack_idempotency_key IS NOT NULL)
  ),
  ADD CONSTRAINT integration_outbox_ack_idempotency_length_check CHECK (
    ack_idempotency_key IS NULL OR length(ack_idempotency_key) BETWEEN 8 AND 120
  );

CREATE INDEX integration_outbox_support_pull_idx
  ON integration_outbox(source, destination, status, next_attempt_at, lease_expires_at, created_at)
  WHERE source = 'website' AND destination = 'retail_agent';

CREATE UNIQUE INDEX integration_outbox_agent_ack_idempotency_idx
  ON integration_outbox(leased_by_agent_client_id, ack_idempotency_key)
  WHERE ack_idempotency_key IS NOT NULL;

CREATE INDEX agent_clients_tenant_scope_idx ON agent_clients(organization_id,store_id) WHERE active;
