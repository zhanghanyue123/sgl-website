CREATE TABLE fries_commerce_tool_activity (
  id uuid PRIMARY KEY,
  tool_name text NOT NULL CHECK (tool_name IN (
    'commerce_search_products','commerce_get_product','commerce_get_variant_stock','commerce_get_shipping_options',
    'commerce_get_order_status','commerce_get_tracking','commerce_get_customer_addresses','commerce_recommend_products'
  )),
  audience text NOT NULL CHECK (audience IN ('public','customer','staff')),
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES support_conversations(id) ON DELETE SET NULL,
  outcome text NOT NULL CHECK (outcome IN ('success','denied','failed')),
  entity_type text,
  entity_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata)='object'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX fries_commerce_tool_activity_created_idx ON fries_commerce_tool_activity(created_at DESC);
CREATE INDEX fries_commerce_tool_activity_customer_idx ON fries_commerce_tool_activity(customer_id,created_at DESC) WHERE customer_id IS NOT NULL;
