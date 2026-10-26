/*
# Dynamic Commodity System — Schema Tables

Creates commodity_sources, commodity_source_logs, commodity_icon_overrides,
and commodity_registry tables with RLS policies.
*/

-- ============================================================================
-- commodity_sources: dynamic data source configurations
-- ============================================================================
CREATE TABLE IF NOT EXISTS commodity_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  source_type text NOT NULL DEFAULT 'json_api',
  url text NOT NULL DEFAULT '',
  api_key_env text,
  exchange_id uuid REFERENCES commodity_exchanges(id) ON DELETE SET NULL,
  fetch_interval text NOT NULL DEFAULT 'daily',
  is_active boolean NOT NULL DEFAULT true,
  field_mapping jsonb NOT NULL DEFAULT '{"commodity_name":"commodity_name","price":"price","unit":"unit","recorded_date":"recorded_date","change_pct":"change_pct"}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE commodity_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_commodity_sources" ON commodity_sources;
CREATE POLICY "anon_select_commodity_sources" ON commodity_sources
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_commodity_sources" ON commodity_sources;
CREATE POLICY "admin_insert_commodity_sources" ON commodity_sources
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

DROP POLICY IF EXISTS "admin_update_commodity_sources" ON commodity_sources;
CREATE POLICY "admin_update_commodity_sources" ON commodity_sources
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

DROP POLICY IF EXISTS "admin_delete_commodity_sources" ON commodity_sources;
CREATE POLICY "admin_delete_commodity_sources" ON commodity_sources
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE INDEX IF NOT EXISTS idx_commodity_sources_active ON commodity_sources(is_active);
CREATE INDEX IF NOT EXISTS idx_commodity_sources_exchange ON commodity_sources(exchange_id);

-- ============================================================================
-- commodity_source_logs: fetch attempt history
-- ============================================================================
CREATE TABLE IF NOT EXISTS commodity_source_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES commodity_sources(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'success',
  records_ingested integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE commodity_source_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_commodity_source_logs" ON commodity_source_logs;
CREATE POLICY "anon_select_commodity_source_logs" ON commodity_source_logs
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_commodity_source_logs" ON commodity_source_logs;
CREATE POLICY "admin_insert_commodity_source_logs" ON commodity_source_logs
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

DROP POLICY IF EXISTS "admin_update_commodity_source_logs" ON commodity_source_logs;
CREATE POLICY "admin_update_commodity_source_logs" ON commodity_source_logs
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

DROP POLICY IF EXISTS "admin_delete_commodity_source_logs" ON commodity_source_logs;
CREATE POLICY "admin_delete_commodity_source_logs" ON commodity_source_logs
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE INDEX IF NOT EXISTS idx_commodity_source_logs_source_created ON commodity_source_logs(source_id, created_at DESC);

-- ============================================================================
-- commodity_icon_overrides: admin-configurable commodity icons
-- ============================================================================
CREATE TABLE IF NOT EXISTS commodity_icon_overrides (
  commodity_name text PRIMARY KEY,
  icon_name text NOT NULL DEFAULT 'Wheat',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE commodity_icon_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_commodity_icon_overrides" ON commodity_icon_overrides;
CREATE POLICY "anon_select_commodity_icon_overrides" ON commodity_icon_overrides
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_commodity_icon_overrides" ON commodity_icon_overrides;
CREATE POLICY "admin_insert_commodity_icon_overrides" ON commodity_icon_overrides
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

DROP POLICY IF EXISTS "admin_update_commodity_icon_overrides" ON commodity_icon_overrides;
CREATE POLICY "admin_update_commodity_icon_overrides" ON commodity_icon_overrides
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

DROP POLICY IF EXISTS "admin_delete_commodity_icon_overrides" ON commodity_icon_overrides;
CREATE POLICY "admin_delete_commodity_icon_overrides" ON commodity_icon_overrides
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- ============================================================================
-- commodity_registry: admin-managed commodity definitions and translations
-- ============================================================================
CREATE TABLE IF NOT EXISTS commodity_registry (
  commodity_name text PRIMARY KEY,
  category text NOT NULL DEFAULT 'Grain & Field Crops',
  unit text NOT NULL DEFAULT 'ton',
  translation_tr text NOT NULL,
  translation_en text NOT NULL,
  translation_ar text NOT NULL,
  icon_name text NOT NULL DEFAULT 'Wheat',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE commodity_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_commodity_registry" ON commodity_registry;
CREATE POLICY "anon_select_commodity_registry" ON commodity_registry
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_commodity_registry" ON commodity_registry;
CREATE POLICY "admin_insert_commodity_registry" ON commodity_registry
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

DROP POLICY IF EXISTS "admin_update_commodity_registry" ON commodity_registry;
CREATE POLICY "admin_update_commodity_registry" ON commodity_registry
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

DROP POLICY IF EXISTS "admin_delete_commodity_registry" ON commodity_registry;
CREATE POLICY "admin_delete_commodity_registry" ON commodity_registry
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));