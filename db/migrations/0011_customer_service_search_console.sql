ALTER TABLE support_conversations
  ADD COLUMN category text CHECK (category IS NULL OR category IN (
    'product_enquiry','order_issue','payment_issue','shipping_delay','damaged_item',
    'wrong_item','return_exchange','general_feedback'
  )),
  ADD COLUMN ai_summary text,
  ADD COLUMN last_ai_summary_at timestamptz;

CREATE TABLE support_tickets (
  id uuid PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN (
    'product_enquiry','order_issue','payment_issue','shipping_delay','damaged_item',
    'wrong_item','return_exchange','general_feedback'
  )),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','pending','resolved')),
  summary text NOT NULL,
  customer_name text,
  customer_email text,
  assigned_user_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  UNIQUE (conversation_id)
);
CREATE INDEX support_tickets_queue_idx ON support_tickets(status, priority, updated_at DESC);

CREATE TABLE search_console_connections (
  id uuid PRIMARY KEY,
  provider text NOT NULL CHECK (provider = 'google_search_console'),
  property_uri text NOT NULL,
  auth_mode text NOT NULL CHECK (auth_mode IN ('oauth_refresh_token','service_account')),
  status text NOT NULL DEFAULT 'not_connected' CHECK (status IN ('not_connected','connected','error','disabled')),
  last_successful_sync_at timestamptz,
  last_error_code text,
  last_error_at timestamptz,
  created_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, property_uri)
);

CREATE TABLE search_console_sync_runs (
  id uuid PRIMARY KEY,
  connection_id uuid REFERENCES search_console_connections(id) ON DELETE SET NULL,
  property_uri text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  dimensions jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(dimensions) = 'array'),
  status text NOT NULL CHECK (status IN ('running','completed','failed')),
  row_count integer NOT NULL DEFAULT 0 CHECK (row_count >= 0),
  error_code text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE INDEX search_console_sync_runs_recent_idx ON search_console_sync_runs(started_at DESC);

CREATE TABLE search_console_evidence (
  id uuid PRIMARY KEY,
  sync_run_id uuid NOT NULL REFERENCES search_console_sync_runs(id) ON DELETE CASCADE,
  property_uri text NOT NULL,
  query text,
  page_url text,
  country text,
  device text,
  period_start date NOT NULL,
  period_end date NOT NULL,
  clicks double precision NOT NULL CHECK (clicks >= 0),
  impressions double precision NOT NULL CHECK (impressions >= 0),
  ctr double precision NOT NULL CHECK (ctr >= 0 AND ctr <= 1),
  average_position double precision NOT NULL CHECK (average_position >= 0),
  observed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX search_console_evidence_page_idx ON search_console_evidence(page_url, period_end DESC);
CREATE INDEX search_console_evidence_query_idx ON search_console_evidence(query, period_end DESC);
