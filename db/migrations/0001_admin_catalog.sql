CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE admin_users (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  display_name text NOT NULL,
  password_hash text NOT NULL,
  password_salt text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'inventory', 'fulfillment', 'support', 'viewer')),
  active boolean NOT NULL DEFAULT true,
  failed_login_count integer NOT NULL DEFAULT 0 CHECK (failed_login_count >= 0),
  locked_until timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX admin_users_email_unique ON admin_users (lower(email));

CREATE TABLE admin_sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  ip_hash text,
  user_agent text
);
CREATE INDEX admin_sessions_user_id_idx ON admin_sessions(user_id);
CREATE INDEX admin_sessions_active_idx ON admin_sessions(expires_at) WHERE revoked_at IS NULL;

CREATE TABLE product_categories (
  id uuid PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id uuid PRIMARY KEY,
  legacy_key text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  original_handle text NOT NULL,
  category_id uuid NOT NULL REFERENCES product_categories(id),
  status text NOT NULL CHECK (status IN ('draft', 'published', 'unpublished', 'archived')),
  base_price_cents integer NOT NULL CHECK (base_price_cents >= 0),
  currency text NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
  sold_out_override boolean NOT NULL DEFAULT false,
  badge text,
  details jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(details) = 'array'),
  buy_links jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(buy_links) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);
CREATE INDEX products_category_id_idx ON products(category_id);
CREATE INDEX products_status_idx ON products(status);

CREATE TABLE product_localizations (
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  locale text NOT NULL CHECK (locale IN ('en', 'zh-CN', 'ja-JP', 'ko-KR', 'it-IT')),
  title text NOT NULL,
  description text NOT NULL,
  seo_title text,
  seo_description text,
  image_alt text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, locale),
  CHECK (length(trim(title)) > 0),
  CHECK (length(trim(description)) > 0)
);

CREATE TABLE product_variants (
  id uuid PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  legacy_key text NOT NULL,
  sku text,
  title text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(options) = 'array'),
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  currency text NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
  image_url text,
  position integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, legacy_key),
  CHECK (sku IS NULL OR length(trim(sku)) > 0)
);
CREATE UNIQUE INDEX product_variants_sku_unique ON product_variants (upper(sku)) WHERE sku IS NOT NULL;
CREATE INDEX product_variants_product_id_idx ON product_variants(product_id);

CREATE TABLE product_images (
  id uuid PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL,
  url text NOT NULL,
  alt_text text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, url)
);
CREATE INDEX product_images_product_id_idx ON product_images(product_id);

CREATE TABLE inventory_levels (
  variant_id uuid PRIMARY KEY REFERENCES product_variants(id) ON DELETE RESTRICT,
  on_hand integer NOT NULL DEFAULT 0 CHECK (on_hand >= 0),
  reserved integer NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  available integer GENERATED ALWAYS AS (on_hand - reserved) STORED,
  low_stock_threshold integer NOT NULL DEFAULT 3 CHECK (low_stock_threshold >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (on_hand >= reserved)
);
CREATE INDEX inventory_levels_low_stock_idx ON inventory_levels(available, low_stock_threshold);

CREATE TABLE inventory_movements (
  id uuid PRIMARY KEY,
  variant_id uuid NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  movement_type text NOT NULL CHECK (movement_type IN ('seed', 'adjustment', 'reservation', 'release', 'sale', 'return', 'correction')),
  delta_on_hand integer NOT NULL DEFAULT 0,
  delta_reserved integer NOT NULL DEFAULT 0,
  on_hand_after integer NOT NULL CHECK (on_hand_after >= 0),
  reserved_after integer NOT NULL CHECK (reserved_after >= 0),
  reference_type text,
  reference_id text,
  reason text NOT NULL,
  actor_user_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (on_hand_after >= reserved_after),
  CHECK (delta_on_hand <> 0 OR delta_reserved <> 0 OR movement_type = 'seed')
);
CREATE INDEX inventory_movements_variant_created_idx ON inventory_movements(variant_id, created_at DESC);
CREATE UNIQUE INDEX inventory_movements_reference_unique ON inventory_movements(variant_id, reference_type, reference_id, movement_type) WHERE reference_id IS NOT NULL;

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY,
  actor_user_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  before_data jsonb,
  after_data jsonb,
  request_id text,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_entity_idx ON audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX audit_logs_actor_idx ON audit_logs(actor_user_id, created_at DESC);

CREATE TABLE admin_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION adjust_inventory(
  p_movement_id uuid,
  p_variant_id uuid,
  p_delta_on_hand integer,
  p_delta_reserved integer,
  p_movement_type text,
  p_reason text,
  p_reference_type text,
  p_reference_id text,
  p_actor_user_id uuid
) RETURNS inventory_levels
LANGUAGE plpgsql
AS $$
DECLARE
  level inventory_levels;
BEGIN
  IF p_movement_type NOT IN ('seed', 'adjustment', 'reservation', 'release', 'sale', 'return', 'correction') THEN
    RAISE EXCEPTION 'invalid inventory movement type';
  END IF;
  IF length(trim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'inventory adjustment reason is required';
  END IF;

  UPDATE inventory_levels
  SET on_hand = on_hand + p_delta_on_hand,
      reserved = reserved + p_delta_reserved,
      updated_at = now()
  WHERE variant_id = p_variant_id
    AND on_hand + p_delta_on_hand >= 0
    AND reserved + p_delta_reserved >= 0
    AND on_hand + p_delta_on_hand >= reserved + p_delta_reserved
  RETURNING * INTO level;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'inventory adjustment would make stock negative or unavailable stock invalid';
  END IF;

  INSERT INTO inventory_movements (
    id, variant_id, movement_type, delta_on_hand, delta_reserved,
    on_hand_after, reserved_after, reference_type, reference_id, reason, actor_user_id
  ) VALUES (
    p_movement_id, p_variant_id, p_movement_type, p_delta_on_hand, p_delta_reserved,
    level.on_hand, level.reserved, p_reference_type, p_reference_id, p_reason, p_actor_user_id
  );

  RETURN level;
END;
$$;
