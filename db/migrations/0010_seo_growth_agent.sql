-- SEO Growth Agent observations and proposals. Product, category, admin,
-- Agent and content approval identities remain owned by the existing schema.

ALTER TABLE content_drafts DROP CONSTRAINT content_drafts_module_check;
ALTER TABLE content_drafts DROP CONSTRAINT content_drafts_kind_check;
DO $$
DECLARE constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT conname FROM pg_constraint
    WHERE conrelid='content_drafts'::regclass AND contype='c'
      AND pg_get_constraintdef(oid) LIKE '%module%'
      AND pg_get_constraintdef(oid) LIKE '%kind%'
  LOOP EXECUTE format('ALTER TABLE content_drafts DROP CONSTRAINT %I',constraint_name); END LOOP;
END $$;
ALTER TABLE content_drafts ADD CONSTRAINT content_drafts_module_check
  CHECK (module IN ('product_content','marketing','seo_growth'));
ALTER TABLE content_drafts ADD CONSTRAINT content_drafts_kind_check
  CHECK (kind IN ('product_content_bundle','weekly_marketing_plan','seo_optimization_proposal'));
ALTER TABLE content_drafts ADD CONSTRAINT content_drafts_module_kind_check CHECK (
  (module='product_content' AND kind='product_content_bundle' AND product_id IS NOT NULL)
  OR (module='marketing' AND kind='weekly_marketing_plan' AND product_id IS NULL)
  OR (module='seo_growth' AND kind='seo_optimization_proposal')
);

CREATE TABLE seo_crawl_runs (
  id uuid PRIMARY KEY,
  base_url text NOT NULL,
  trigger_type text NOT NULL CHECK (trigger_type IN ('manual','scheduled')),
  schedule_scope text CHECK (schedule_scope IS NULL OR schedule_scope IN ('daily','weekly','monthly')),
  status text NOT NULL CHECK (status IN ('running','completed','failed')),
  pages_discovered integer NOT NULL DEFAULT 0 CHECK (pages_discovered>=0),
  pages_audited integer NOT NULL DEFAULT 0 CHECK (pages_audited>=0),
  issues_found integer NOT NULL DEFAULT 0 CHECK (issues_found>=0),
  error_summary text,
  created_by_admin_id uuid REFERENCES admin_users(id) ON DELETE RESTRICT,
  created_by_agent_client_id uuid REFERENCES agent_clients(id) ON DELETE RESTRICT,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  CHECK ((created_by_admin_id IS NOT NULL)::int + (created_by_agent_client_id IS NOT NULL)::int=1),
  CHECK (base_url ~ '^https?://')
);
CREATE INDEX seo_crawl_runs_started_idx ON seo_crawl_runs(started_at DESC);

CREATE TABLE seo_crawl_pages (
  id uuid PRIMARY KEY,
  run_id uuid NOT NULL REFERENCES seo_crawl_runs(id) ON DELETE CASCADE,
  url text NOT NULL,
  normalized_url text NOT NULL,
  status_code integer NOT NULL CHECK (status_code BETWEEN 100 AND 599),
  redirect_chain jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(redirect_chain)='array'),
  canonical_url text,
  locale text,
  title text,
  meta_description text,
  headings jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(headings)='object'),
  hreflang jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(hreflang)='object'),
  internal_links jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(internal_links)='array'),
  images jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(images)='array'),
  schema_types jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(schema_types)='array'),
  mobile_metrics jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(mobile_metrics)='object'),
  response_ms integer CHECK (response_ms IS NULL OR response_ms>=0),
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(run_id,normalized_url)
);
CREATE INDEX seo_crawl_pages_run_idx ON seo_crawl_pages(run_id,status_code);

CREATE TABLE seo_issues (
  id uuid PRIMARY KEY,
  run_id uuid NOT NULL REFERENCES seo_crawl_runs(id) ON DELETE CASCADE,
  page_id uuid REFERENCES seo_crawl_pages(id) ON DELETE CASCADE,
  fingerprint text NOT NULL,
  issue_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('critical','high','medium','low','info')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','ignored')),
  page_url text,
  summary text NOT NULL,
  evidence jsonb NOT NULL CHECK (jsonb_typeof(evidence)='object'),
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  UNIQUE(run_id,fingerprint)
);
CREATE INDEX seo_issues_status_idx ON seo_issues(status,severity,last_seen_at DESC);

CREATE TABLE seo_keywords (
  id uuid PRIMARY KEY,
  keyword text NOT NULL,
  locale text NOT NULL,
  intent text NOT NULL CHECK (intent IN ('informational','commercial','transactional','navigational','unknown')),
  cluster_name text NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('catalog','search_console','bing','verified_provider','manual')),
  source_reference text NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metrics)='object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX seo_keywords_cluster_idx ON seo_keywords(locale,cluster_name);
CREATE UNIQUE INDEX seo_keywords_source_unique ON seo_keywords(lower(keyword),locale,source_type,source_reference);

CREATE TABLE seo_keyword_mappings (
  keyword_id uuid NOT NULL REFERENCES seo_keywords(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  category_id uuid REFERENCES product_categories(id) ON DELETE CASCADE,
  page_url text,
  relevance numeric(5,4) NOT NULL CHECK (relevance BETWEEN 0 AND 1),
  evidence jsonb NOT NULL CHECK (jsonb_typeof(evidence)='object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((product_id IS NOT NULL)::int+(category_id IS NOT NULL)::int+(page_url IS NOT NULL)::int=1)
);
CREATE UNIQUE INDEX seo_keyword_mappings_target_unique ON seo_keyword_mappings(keyword_id,product_id,category_id,page_url) NULLS NOT DISTINCT;

CREATE TABLE seo_performance_snapshots (
  id uuid PRIMARY KEY,
  provider text NOT NULL CHECK (provider IN ('google_search_console','bing_webmaster','ga4')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  dimensions jsonb NOT NULL CHECK (jsonb_typeof(dimensions)='object'),
  metrics jsonb NOT NULL CHECK (jsonb_typeof(metrics)='object'),
  evidence_reference text NOT NULL,
  collected_at timestamptz NOT NULL DEFAULT now(),
  CHECK (period_end>=period_start),
  UNIQUE(provider,period_start,period_end,dimensions)
);
CREATE INDEX seo_performance_period_idx ON seo_performance_snapshots(period_end DESC,provider);

CREATE TABLE seo_optimization_results (
  id uuid PRIMARY KEY,
  draft_id uuid NOT NULL REFERENCES content_drafts(id) ON DELETE RESTRICT,
  page_url text NOT NULL,
  baseline_evidence jsonb NOT NULL CHECK (jsonb_typeof(baseline_evidence)='object'),
  followup_evidence jsonb CHECK (followup_evidence IS NULL OR jsonb_typeof(followup_evidence)='object'),
  evaluated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(draft_id,page_url)
);
