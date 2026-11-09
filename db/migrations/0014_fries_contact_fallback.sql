CREATE TABLE IF NOT EXISTS support_contact_submissions (
  id uuid PRIMARY KEY,
  idempotency_key text NOT NULL UNIQUE,
  content_hash text NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  locale text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending','sent','failed')),
  provider_message_id text,
  last_error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);
CREATE INDEX IF NOT EXISTS support_contact_submissions_status_created_idx ON support_contact_submissions(status,created_at DESC);
