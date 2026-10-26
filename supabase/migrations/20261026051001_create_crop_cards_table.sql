/*
# Create Crop Development section table + heading/subtitle settings

## Overview
Makes the "Next-Generation Crop Development" homepage section fully editable from the admin panel.
Card content (title, description, image, video) is stored per-language (Turkish, English, Arabic).
The section heading and subtitle are stored as per-language columns on site_settings.

## New Table: crop_cards
- id (uuid, primary key)
- title_tr, title_en, title_ar (text) — card title in each language
- description_tr, description_en, description_ar (text) — card description in each language
- image_url (text) — cover image URL
- video_url (text) — hover video URL
- sort_order (int, default 0) — display order
- is_visible (boolean, default true) — show/hide toggle
- updated_at (timestamptz)

## Modified Table: site_settings
- crop_heading_tr, crop_heading_en, crop_heading_ar (text) — section heading per language
- crop_subtitle_tr, crop_subtitle_en, crop_subtitle_ar (text) — section subtitle per language

## Seed Data
- Three crop cards seeded with current hardcoded content (Precision Farming, Crop Monitoring, Automated Farming)
- Heading and subtitle seeded with current translation values

## Security
- RLS enabled on crop_cards
- anon + authenticated can SELECT (public homepage)
- Only admins (profiles.is_admin) can INSERT/UPDATE/DELETE
- Grants match the academy_tiles pattern
*/

-- 1. Create crop_cards table
CREATE TABLE IF NOT EXISTS crop_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_tr text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  title_ar text NOT NULL DEFAULT '',
  description_tr text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  description_ar text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  video_url text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE crop_cards ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON crop_cards TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON crop_cards TO authenticated;

DROP POLICY IF EXISTS "anon_read_crop_cards" ON crop_cards;
CREATE POLICY "anon_read_crop_cards" ON crop_cards FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_crop_cards" ON crop_cards;
CREATE POLICY "admin_insert_crop_cards" ON crop_cards FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_update_crop_cards" ON crop_cards;
CREATE POLICY "admin_update_crop_cards" ON crop_cards FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_delete_crop_cards" ON crop_cards;
CREATE POLICY "admin_delete_crop_cards" ON crop_cards FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

-- 2. Add heading/subtitle columns to site_settings
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS crop_heading_tr text DEFAULT 'Yeni Nesil Ürün Geliştirme',
  ADD COLUMN IF NOT EXISTS crop_heading_en text DEFAULT 'Next-Generation Crop Development',
  ADD COLUMN IF NOT EXISTS crop_heading_ar text DEFAULT 'تطوير المحاصيل من الجيل الجديد',
  ADD COLUMN IF NOT EXISTS crop_subtitle_tr text DEFAULT 'Çiftçilerin ürün verimini en üst düzeye çıkarmasına yardımcı olan yenilikçi hizmetler sunuyoruz. Hassas tarım, ürün izleme ve otomasyon çözümlerimiz tarımı dönüştürüyor.',
  ADD COLUMN IF NOT EXISTS crop_subtitle_en text DEFAULT 'We offer innovative services that help farmers maximize their yield. Precision farming, crop monitoring, and automation solutions are transforming agriculture.',
  ADD COLUMN IF NOT EXISTS crop_subtitle_ar text DEFAULT 'نقدم خدمات مبتكرة تساعد المزارعين على تعظيم إنتاجهم. الزراعة الدقيقة ومراقبة المحاصيل وحلول الأتمتة تُحوّل الزراعة.';

-- 3. Seed three crop cards (only if table is empty)
INSERT INTO crop_cards (title_tr, title_en, title_ar, description_tr, description_en, description_ar, image_url, video_url, sort_order, is_visible)
SELECT
  'Hassas Tarım', 'Precision Farming', 'الزراعة الدقيقة',
  'En son teknolojilerle tarlanızın her yönünü en yüksek hassasiyetle optimize edin.',
  'Optimize every aspect of your field with the latest technologies at the highest precision.',
  'حسّن كل جانب من جوانب حقلك بأحدث التقنيات وبأعلى دقة.',
  'https://images.pexels.com/photos/2933243/pexels-photo-2933243.jpeg?auto=compress&cs=tinysrgb&w=900',
  'https://videos.pexels.com/video-files/3129671/3129671-hd_1920_1080_30fps.mp4',
  0, true
WHERE NOT EXISTS (SELECT 1 FROM crop_cards LIMIT 1);

INSERT INTO crop_cards (title_tr, title_en, title_ar, description_tr, description_en, description_ar, image_url, video_url, sort_order, is_visible)
SELECT
  'Ürün İzleme', 'Crop Monitoring', 'مراقبة المحاصيل',
  'Yenilikçi çözümlerimizle ürün sağlığını ve büyümesini gerçek zamanlı takip edin.',
  'Track crop health and growth in real time with our innovative solutions.',
  'تابع صحة المحصول ونموه في الوقت الفعلي بحلولنا المبتكرة.',
  'https://images.pexels.com/photos/2589457/pexels-photo-2589457.jpeg?auto=compress&cs=tinysrgb&w=900',
  'https://videos.pexels.com/video-files/7233782/7233782-hd_1920_1080_25fps.mp4',
  1, true
WHERE NOT EXISTS (SELECT 1 FROM crop_cards LIMIT 1);

INSERT INTO crop_cards (title_tr, title_en, title_ar, description_tr, description_en, description_ar, image_url, video_url, sort_order, is_visible)
SELECT
  'Otomasyonlu Tarım', 'Automated Farming', 'الزراعة المؤتمتة',
  'En yeni otomasyon çözümleriyle çiftlik verimliliğini ve üretkenliği artırın.',
  'Increase farm efficiency and productivity with the newest automation solutions.',
  'ارفع كفاءة المزرعة وإنتاجيتها بأحدث حلول الأتمتة.',
  'https://images.pexels.com/photos/2252584/pexels-photo-2252584.jpeg?auto=compress&cs=tinysrgb&w=900',
  'https://videos.pexels.com/video-files/3195650/3195650-hd_1920_1080_25fps.mp4',
  2, true
WHERE NOT EXISTS (SELECT 1 FROM crop_cards LIMIT 1);
