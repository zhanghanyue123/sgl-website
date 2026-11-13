-- Forward-only Preview compatibility migration.
-- The legacy account schema is retained, while unverified registrations move
-- to records that cannot reference or claim a Customer ID.
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

CREATE TABLE customer_registration_verifications (
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
CREATE INDEX customer_registration_verifications_pending_idx
  ON customer_registration_verifications (pending_registration_id, created_at DESC);

ALTER TABLE customer_credentials ADD COLUMN last_login_at timestamptz;
ALTER TABLE customer_credentials ADD CONSTRAINT customer_credentials_verified_required
  CHECK (email_verified_at IS NOT NULL) NOT VALID;
ALTER TABLE customer_sessions ADD COLUMN ip_hash text;
