
-- ============================================================
-- 1. job_categories table
-- ============================================================
CREATE TABLE IF NOT EXISTS job_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT 'bg-muted text-muted-foreground border-border',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  icon_type text NOT NULL DEFAULT 'lucide',
  icon_name text NOT NULL DEFAULT 'Briefcase',
  icon_svg_path text,
  translation_tr text NOT NULL,
  translation_en text NOT NULL,
  translation_ar text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE job_categories ENABLE ROW LEVEL SECURITY;

-- Public can read active categories
CREATE POLICY "anon_read_job_categories"
  ON job_categories FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin-only writes
CREATE POLICY "admin_insert_job_categories"
  ON job_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

CREATE POLICY "admin_update_job_categories"
  ON job_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

CREATE POLICY "admin_delete_job_categories"
  ON job_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

-- Seed existing categories
INSERT INTO job_categories (name, color, sort_order, is_active, icon_type, icon_name, translation_tr, translation_en, translation_ar)
VALUES
  ('Hasat',              'bg-accent/15 text-accent-foreground border-accent/30', 1, true, 'lucide', 'Wheat',  'Hasat',              'Harvest',           'الحصاد'),
  ('Sürüş',              'bg-primary/10 text-primary border-primary/20',          2, true, 'lucide', 'Tractor','Sürüş',              'Driving',           'القيادة'),
  ('Hayvan Bakımı',      'bg-secondary/15 text-secondary border-secondary/30',    3, true, 'lucide', 'Milk',   'Hayvan Bakımı',      'Livestock Care',    'رعاية الحيوان'),
  ('Ekim',               'bg-success/10 text-success border-success/20',          4, true, 'lucide', 'Sprout', 'Ekim',               'Planting',          'الزراعة'),
  ('Sulama',             'bg-blue-50 text-blue-700 border-blue-200',              5, true, 'lucide', 'Droplets','Sulama',            'Irrigation',        'الري'),
  ('Ekipman Kullanımı',  'bg-orange-50 text-orange-700 border-orange-200',        6, true, 'lucide', 'Cog',    'Ekipman Kullanımı',  'Equipment Operation','تشغيل المعدات'),
  ('Genel İşçilik',      'bg-muted text-muted-foreground border-border',          7, true, 'lucide', 'Shovel', 'Genel İşçilik',      'General Labor',     'عمالة عامة'),
  ('İşleme',             'bg-purple-50 text-purple-700 border-purple-200',        8, true, 'lucide', 'Package','İşleme',             'Processing',        'المعالجة')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. commodity_categories table
-- ============================================================
CREATE TABLE IF NOT EXISTS commodity_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  translation_tr text NOT NULL,
  translation_en text NOT NULL,
  translation_ar text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE commodity_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_commodity_categories"
  ON commodity_categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "admin_insert_commodity_categories"
  ON commodity_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

CREATE POLICY "admin_update_commodity_categories"
  ON commodity_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

CREATE POLICY "admin_delete_commodity_categories"
  ON commodity_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

-- Seed existing categories
INSERT INTO commodity_categories (key, sort_order, translation_tr, translation_en, translation_ar)
VALUES
  ('Grain & Field Crops', 1, 'Tahıl & Tarla',   'Grain & Field', 'الحبوب'),
  ('Specialty Crops',     2, 'Özel Ürünler',     'Specialty',     'خاصة'),
  ('Pulses',              3, 'Baklagiller',      'Pulses',        'بقوليات'),
  ('Oilseeds',            4, 'Yağlı Tohum',      'Oilseeds',      'زيتية')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 3. Alter commodity_registry: add display_order, is_visible, is_featured, icon_type, icon_svg_path
-- ============================================================
ALTER TABLE commodity_registry
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS icon_type text NOT NULL DEFAULT 'lucide',
  ADD COLUMN IF NOT EXISTS icon_svg_path text;

-- ============================================================
-- 4. Alter commodity_icon_overrides: add icon_type, icon_svg_path
-- ============================================================
ALTER TABLE commodity_icon_overrides
  ADD COLUMN IF NOT EXISTS icon_type text NOT NULL DEFAULT 'lucide',
  ADD COLUMN IF NOT EXISTS icon_svg_path text;

-- ============================================================
-- 5. Alter commodity_exchanges: add thumbnail columns
-- ============================================================
ALTER TABLE commodity_exchanges
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS thumbnail_path text;

-- ============================================================
-- 6. Alter commodity_exchange_meta: add thumbnail + icon columns
-- ============================================================
ALTER TABLE commodity_exchange_meta
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS thumbnail_path text,
  ADD COLUMN IF NOT EXISTS icon_type text NOT NULL DEFAULT 'lucide',
  ADD COLUMN IF NOT EXISTS icon_svg_path text;

-- ============================================================
-- 7. Storage buckets for SVG icons and exchange thumbnails
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('icons', 'icons', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('exchange-thumbnails', 'exchange-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read, admin write
CREATE POLICY "anon_read_icons_bucket"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'icons');

CREATE POLICY "admin_write_icons_bucket"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'icons'
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

CREATE POLICY "admin_update_icons_bucket"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'icons'
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  )
  WITH CHECK (
    bucket_id = 'icons'
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

CREATE POLICY "admin_delete_icons_bucket"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'icons'
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

CREATE POLICY "anon_read_exchange_thumbnails"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'exchange-thumbnails');

CREATE POLICY "admin_write_exchange_thumbnails"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'exchange-thumbnails'
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

CREATE POLICY "admin_update_exchange_thumbnails"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'exchange-thumbnails'
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  )
  WITH CHECK (
    bucket_id = 'exchange-thumbnails'
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

CREATE POLICY "admin_delete_exchange_thumbnails"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'exchange-thumbnails'
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );
