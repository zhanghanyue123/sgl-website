-- Product Content and Marketing agents share the existing product, SKU, order,
-- admin, and agent identities. Drafts never duplicate catalogue or sales data.

CREATE TABLE content_drafts (
  id uuid PRIMARY KEY,
  module text NOT NULL CHECK (module IN ('product_content','marketing')),
  kind text NOT NULL CHECK (kind IN ('product_content_bundle','weekly_marketing_plan')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','approved','published')),
  product_id uuid REFERENCES products(id) ON DELETE RESTRICT,
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 240),
  locale text CHECK (locale IS NULL OR locale IN ('en','zh-CN')),
  channel text,
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload)='object'),
  source_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(source_snapshot)='object'),
  generation_metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(generation_metadata)='object'),
  created_by_admin_id uuid REFERENCES admin_users(id) ON DELETE RESTRICT,
  created_by_agent_client_id uuid REFERENCES agent_clients(id) ON DELETE RESTRICT,
  reviewed_by uuid REFERENCES admin_users(id) ON DELETE RESTRICT,
  reviewed_at timestamptz,
  approved_by uuid REFERENCES admin_users(id) ON DELETE RESTRICT,
  approved_at timestamptz,
  published_by uuid REFERENCES admin_users(id) ON DELETE RESTRICT,
  published_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((created_by_admin_id IS NOT NULL)::int + (created_by_agent_client_id IS NOT NULL)::int = 1),
  CHECK ((module='product_content' AND kind='product_content_bundle' AND product_id IS NOT NULL)
    OR (module='marketing' AND kind='weekly_marketing_plan' AND product_id IS NULL)),
  CHECK ((status='draft' AND reviewed_by IS NULL AND reviewed_at IS NULL
      AND approved_by IS NULL AND approved_at IS NULL AND published_by IS NULL AND published_at IS NULL)
    OR (status='review' AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL
      AND approved_by IS NULL AND approved_at IS NULL AND published_by IS NULL AND published_at IS NULL)
    OR (status='approved' AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL
      AND approved_by IS NOT NULL AND approved_at IS NOT NULL AND published_by IS NULL AND published_at IS NULL)
    OR (status='published' AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL
      AND approved_by IS NOT NULL AND approved_at IS NOT NULL AND published_by IS NOT NULL AND published_at IS NOT NULL))
);
CREATE INDEX content_drafts_module_status_idx ON content_drafts(module,status,updated_at DESC);
CREATE INDEX content_drafts_product_idx ON content_drafts(product_id,updated_at DESC) WHERE product_id IS NOT NULL;

CREATE TABLE content_draft_events (
  id uuid PRIMARY KEY,
  draft_id uuid NOT NULL REFERENCES content_drafts(id) ON DELETE RESTRICT,
  actor_type text NOT NULL CHECK (actor_type IN ('admin','agent')),
  actor_admin_id uuid REFERENCES admin_users(id) ON DELETE RESTRICT,
  actor_agent_client_id uuid REFERENCES agent_clients(id) ON DELETE RESTRICT,
  action text NOT NULL CHECK (action IN ('created','generated','edited','submitted_for_review','returned_to_draft','approved','published')),
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((actor_type='admin' AND actor_admin_id IS NOT NULL AND actor_agent_client_id IS NULL)
    OR (actor_type='agent' AND actor_agent_client_id IS NOT NULL AND actor_admin_id IS NULL))
);
CREATE INDEX content_draft_events_draft_idx ON content_draft_events(draft_id,created_at DESC);
