/*
# Expand Ad System: Category Targeting, Scheduling, AdSense, Priority, Rotation

## Overview
This migration upgrades the existing ad_spaces and ad_placements tables to support:
1. Category-targeted ad slots (e.g. show different ads on the "Hasat" job category page)
2. AdSense override per slot (use Google AdSense instead of a direct placement)
3. Ad priority and rotation (multiple placements per slot, rotated by priority)
4. Time-of-day scheduling (ads can run on specific days of week and hours)
5. Click tracking and impression counting
6. Admin-managed ad spaces (CRUD via admin dashboard, not just config file)

## 1. Modified Tables

### ad_spaces (modified)
- Added `category` (text, nullable) — job/news category this slot targets (null = all categories)
- Added `page` (text, nullable) — which page this slot appears on (e.g. 'jobs', 'news', 'home', 'dashboard')
- Added `adsense_slot` (text, nullable) — Google AdSense slot ID to use instead of direct placement
- Added `adsense_enabled` (boolean, default false) — whether AdSense is active for this slot
- Added `description` (text, nullable) — admin-facing description of this ad space
- Added `updated_at` (timestamptz, default now()) — last modification timestamp

### ad_placements (modified)
- Added `priority` (integer, default 0) — higher priority placements show first
- Added `impressions` (bigint, default 0) — total times this ad was shown
- Added `clicks` (bigint, default 0) — total times this ad was clicked
- Added `days_of_week` (integer[], nullable) — array of day numbers (0=Sun, 6=Sat) when ad is active
- Added `start_hour` (integer, default 0) — hour of day (0-23) when daily schedule starts
- Added `end_hour` (integer, default 23) — hour of day (0-23) when daily schedule ends
- Added `updated_at` (timestamptz, default now()) — last modification timestamp

## 2. Security (RLS)
- ad_spaces: public read (anon + authenticated), admin write via authenticated (for now, all authenticated can manage)
- ad_placements: public read for active placements, admin write via authenticated

## 3. Important Notes
1. Category-targeted slots: when an ad_space has a `category` set, it only shows on pages filtered to that category
2. AdSense override: when `adsense_enabled` is true on a slot, the component renders the AdSense unit instead of any direct placements
3. Rotation: multiple active placements on the same slot are rotated by priority (highest first), with ties broken by creation date
4. Scheduling: `days_of_week` controls which days the ad runs; `start_hour`/`end_hour` control the time window each day
5. The admin dashboard can create/edit/toggle all ad spaces and placements
*/

-- Add columns to ad_spaces
ALTER TABLE ad_spaces ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE ad_spaces ADD COLUMN IF NOT EXISTS page text;
ALTER TABLE ad_spaces ADD COLUMN IF NOT EXISTS adsense_slot text;
ALTER TABLE ad_spaces ADD COLUMN IF NOT EXISTS adsense_enabled boolean DEFAULT false;
ALTER TABLE ad_spaces ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE ad_spaces ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add columns to ad_placements
ALTER TABLE ad_placements ADD COLUMN IF NOT EXISTS priority integer DEFAULT 0;
ALTER TABLE ad_placements ADD COLUMN IF NOT EXISTS impressions bigint DEFAULT 0;
ALTER TABLE ad_placements ADD COLUMN IF NOT EXISTS clicks bigint DEFAULT 0;
ALTER TABLE ad_placements ADD COLUMN IF NOT EXISTS days_of_week integer[];
ALTER TABLE ad_placements ADD COLUMN IF NOT EXISTS start_hour integer DEFAULT 0;
ALTER TABLE ad_placements ADD COLUMN IF NOT EXISTS end_hour integer DEFAULT 23;
ALTER TABLE ad_placements ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add trigger to update updated_at on ad_spaces
CREATE OR REPLACE FUNCTION update_ad_spaces_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ad_spaces_updated_at ON ad_spaces;
CREATE TRIGGER trg_ad_spaces_updated_at
  BEFORE UPDATE ON ad_spaces
  FOR EACH ROW EXECUTE FUNCTION update_ad_spaces_updated_at();

-- Add trigger to update updated_at on ad_placements
CREATE OR REPLACE FUNCTION update_ad_placements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ad_placements_updated_at ON ad_placements;
CREATE TRIGGER trg_ad_placements_updated_at
  BEFORE UPDATE ON ad_placements
  FOR EACH ROW EXECUTE FUNCTION update_ad_placements_updated_at();

-- Add index for category+page lookups
CREATE INDEX IF NOT EXISTS idx_ad_spaces_page ON ad_spaces(page);
CREATE INDEX IF NOT EXISTS idx_ad_spaces_category ON ad_spaces(category);

-- Add index for priority-based rotation
CREATE INDEX IF NOT EXISTS idx_ad_placements_priority ON ad_placements(ad_space_id, priority DESC, created_at DESC);

-- Update the SELECT policy on ad_placements to also check scheduling
DROP POLICY IF EXISTS "anon_select_ad_placements" ON ad_placements;
CREATE POLICY "anon_select_ad_placements" ON ad_placements
  FOR SELECT TO anon, authenticated
  USING (
    is_active = true
    AND start_date <= CURRENT_DATE
    AND end_date >= CURRENT_DATE
  );

-- Admin write policies on ad_spaces (authenticated users can manage)
DROP POLICY IF EXISTS "auth_insert_ad_spaces" ON ad_spaces;
CREATE POLICY "auth_insert_ad_spaces" ON ad_spaces
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_ad_spaces" ON ad_spaces;
CREATE POLICY "auth_update_ad_spaces" ON ad_spaces
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_ad_spaces" ON ad_spaces;
CREATE POLICY "auth_delete_ad_spaces" ON ad_spaces
  FOR DELETE TO authenticated USING (true);

-- Admin write policies on ad_placements (authenticated users can manage)
DROP POLICY IF EXISTS "auth_insert_ad_placements" ON ad_placements;
CREATE POLICY "auth_insert_ad_placements" ON ad_placements
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_ad_placements" ON ad_placements;
CREATE POLICY "auth_update_ad_placements" ON ad_placements
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_ad_placements" ON ad_placements;
CREATE POLICY "auth_delete_ad_placements" ON ad_placements
  FOR DELETE TO authenticated USING (true);

-- Seed category-specific ad spaces for job categories
INSERT INTO ad_spaces (slot, placement, label, description, page, category, width, height, available, price_per_month) VALUES
  ('jobs-sidebar-all', 'sidebar', 'Jobs Sidebar (All Categories)', 'Appears on the main jobs page sidebar', 'jobs', NULL, 300, 250, true, 600),
  ('jobs-sidebar-hasat', 'sidebar', 'Jobs Sidebar (Hasat)', 'Appears when filtering by Hasat category', 'jobs', 'Hasat', 300, 250, true, 450),
  ('jobs-sidebar-surus', 'sidebar', 'Jobs Sidebar (Sürüş)', 'Appears when filtering by Sürüş category', 'jobs', 'Sürüş', 300, 250, true, 450),
  ('jobs-sidebar-hayvan', 'sidebar', 'Jobs Sidebar (Hayvan Bakımı)', 'Appears when filtering by Hayvan Bakımı category', 'jobs', 'Hayvan Bakımı', 300, 250, true, 450),
  ('jobs-sidebar-ekim', 'sidebar', 'Jobs Sidebar (Ekim)', 'Appears when filtering by Ekim category', 'jobs', 'Ekim', 300, 250, true, 450),
  ('jobs-sidebar-sulama', 'sidebar', 'Jobs Sidebar (Sulama)', 'Appears when filtering by Sulama category', 'jobs', 'Sulama', 300, 250, true, 450),
  ('jobs-sidebar-ekipman', 'sidebar', 'Jobs Sidebar (Ekipman)', 'Appears when filtering by Ekipman Kullanımı category', 'jobs', 'Ekipman Kullanımı', 300, 250, true, 450),
  ('jobs-sidebar-genel', 'sidebar', 'Jobs Sidebar (Genel İşçilik)', 'Appears when filtering by Genel İşçilik category', 'jobs', 'Genel İşçilik', 300, 250, true, 400),
  ('jobs-sidebar-isleme', 'sidebar', 'Jobs Sidebar (İşleme)', 'Appears when filtering by İşleme category', 'jobs', 'İşleme', 300, 250, true, 400),
  ('news-sidebar-primary', 'sidebar', 'News Sidebar Primary', 'Appears on the news page sidebar', 'news', NULL, 300, 250, true, 500),
  ('news-sidebar-secondary', 'sidebar', 'News Sidebar Secondary', 'Second sidebar slot on news page', 'news', NULL, 300, 600, true, 700),
  ('home-sidebar-top', 'sidebar', 'Home Sidebar Top', 'Top sidebar ad on the home page', 'home', NULL, 300, 250, true, 800),
  ('home-sidebar-bottom', 'sidebar', 'Home Sidebar Bottom', 'Bottom sidebar ad on the home page', 'home', NULL, 300, 250, true, 600),
  ('dashboard-sidebar', 'sidebar', 'Dashboard Sidebar', 'Appears on the user dashboard sidebar', 'dashboard', NULL, 300, 250, true, 400),
  ('jobs-inline-1', 'inline', 'Jobs Inline Ad 1', 'First inline ad between job listings', 'jobs', NULL, 0, 120, true, 350),
  ('jobs-inline-2', 'inline', 'Jobs Inline Ad 2', 'Second inline ad between job listings', 'jobs', NULL, 0, 120, true, 350),
  ('news-inline-1', 'inline', 'News Inline Ad 1', 'Inline ad between news articles', 'news', NULL, 0, 150, true, 300)
ON CONFLICT (slot) DO NOTHING;
