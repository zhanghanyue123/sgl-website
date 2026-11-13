-- Consumer accounts extend the existing customers table. They do not create a
-- second customer identity or alter guest checkout.
CREATE TABLE customer_credentials (
  customer_id uuid PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  password_salt text NOT NULL,
  email_verified_at timestamptz,
  failed_login_count integer NOT NULL DEFAULT 0 CHECK (failed_login_count >= 0),
  locked_until timestamptz,
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
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX customer_sessions_customer_idx ON customer_sessions(customer_id, expires_at DESC);

CREATE TABLE customer_email_verifications (
  id uuid PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  delivery_status text NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending','sent','failed','not_configured')),
  delivery_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX customer_email_verifications_customer_idx ON customer_email_verifications(customer_id, created_at DESC);

CREATE TABLE customer_addresses (
  id uuid PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Shipping',
  recipient_name text NOT NULL,
  phone text,
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  region text,
  postal_code text,
  country_code char(2) NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX customer_addresses_customer_idx ON customer_addresses(customer_id, created_at);
CREATE UNIQUE INDEX customer_addresses_one_default_idx ON customer_addresses(customer_id) WHERE is_default;

CREATE TABLE customer_wishlist_items (
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_slug text NOT NULL,
  variant_key text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(customer_id, product_slug, variant_key)
);

CREATE TABLE customer_account_events (
  id uuid PRIMARY KEY,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX customer_account_events_customer_idx ON customer_account_events(customer_id, created_at DESC);

CREATE TABLE customer_auth_rate_limits (
  key_hash text NOT NULL,
  action text NOT NULL,
  window_started_at timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  PRIMARY KEY(key_hash, action, window_started_at)
);

