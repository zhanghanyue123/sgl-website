-- Minimal global-site customer authentication.
-- Pending registrations are deliberately not linked to customers until email
-- ownership has been verified. This prevents an unverified registrant from
-- claiming an existing guest or CRM customer record.
CREATE TABLE customer_pending_registrations (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  display_name text,
  password_hash text NOT NULL,
  password_salt text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'superseded')),
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (email = lower(trim(email))),
  CHECK (length(email) BETWEEN 3 AND 254),
  CHECK (display_name IS NULL OR length(trim(display_name)) BETWEEN 1 AND 120)
);
CREATE UNIQUE INDEX customer_pending_registrations_email_unique
  ON customer_pending_registrations (lower(email)) WHERE status = 'pending';
CREATE INDEX customer_pending_registrations_expiry_idx
  ON customer_pending_registrations (expires_at) WHERE status = 'pending';

CREATE TABLE customer_email_verifications (
  id uuid PRIMARY KEY,
  pending_registration_id uuid NOT NULL REFERENCES customer_pending_registrations(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  delivery_status text NOT NULL DEFAULT 'pending'
    CHECK (delivery_status IN ('pending', 'sent', 'failed', 'not_configured')),
  delivery_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX customer_email_verifications_pending_idx
  ON customer_email_verifications (pending_registration_id, created_at DESC);

CREATE TABLE customer_credentials (
  customer_id uuid PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  password_salt text NOT NULL,
  email_verified_at timestamptz NOT NULL,
  failed_login_count integer NOT NULL DEFAULT 0 CHECK (failed_login_count >= 0),
  locked_until timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE customer_sessions (
  id uuid PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  user_agent text,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX customer_sessions_customer_idx
  ON customer_sessions (customer_id, expires_at DESC);
CREATE INDEX customer_sessions_active_idx
  ON customer_sessions (expires_at) WHERE revoked_at IS NULL;

CREATE TABLE customer_auth_rate_limits (
  key_hash text NOT NULL,
  action text NOT NULL,
  window_started_at timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 1 CHECK (request_count > 0),
  PRIMARY KEY (key_hash, action, window_started_at)
);

CREATE TABLE customer_account_events (
  id uuid PRIMARY KEY,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(data) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX customer_account_events_customer_idx
  ON customer_account_events (customer_id, created_at DESC);
