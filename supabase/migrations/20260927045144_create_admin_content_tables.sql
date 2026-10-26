/*
# Admin content management tables

1. New Tables
- `site_settings` — single-row table holding homepage hero background config, news section config, and other site-wide content
  - `id` (int, pk, always 1)
  - `hero_background_type` (text: 'image' | 'video' | 'gradient' | 'color')
  - `hero_background_value` (text: URL, video URL, gradient CSS, or color hex)
  - `hero_background_opacity` (real: 0-1 transparency overlay)
  - `news_section_categories` (text[]: which news categories to show on homepage)
  - `news_section_post_ids` (uuid[]: specific posts to display, empty = auto)
  - `news_section_count` (int: how many posts to display)
  - `updated_at` (timestamptz)
- `academy_tiles` — editable content for the 6 Turanda Akademi feature cards
  - `id` (uuid, pk)
  - `tile_key` (text, unique: 'courses' | 'handson' | 'certificates' | 'mentorship' | 'tracks' | 'verified')
  - `icon_name` (text: lucide icon name)
  - `image1_url` (text: first animation image URL)
  - `image2_url` (text: second animation image URL)
  - `video_url` (text: optional video revealed on click)
  - `description` (text: explanatory text for the reveal container)
  - `animation_direction` (text: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'left' | 'right')
  - `updated_at` (timestamptz)
- `commodity_exchange_meta` — editable metadata for each regional exchange
  - `id` (uuid, pk)
  - `exchange_id` (uuid, fk to commodity_exchanges)
  - `icon_name` (text: lucide icon name for the exchange)
  - `display_title` (text: custom title override)
  - `specialties_override` (text[]: override the specialties list)
  - `updated_at` (timestamptz)
2. Modified Tables
- `profiles` — add `is_admin` boolean column (default false) for admin access control
- `jobs` — add `is_featured` boolean (default false) and `skills` text[] column (max 4 skills)
3. Security
- Enable RLS on all new tables
- site_settings: readable by anon (public site config), writable by authenticated admins
- academy_tiles: readable by anon, writable by authenticated admins
- commodity_exchange_meta: readable by anon, writable by authenticated admins
- jobs: add is_featured and skills to existing policies (already has RLS)
- profiles: is_admin column protected via column-level privileges (only admin can set)
4. Notes
- Admin authorization uses profiles.is_admin checked via RLS policies
- The site_settings table is constrained to a single row via id=1
- Academy tiles are seeded with default values matching current hardcoded content
*/

-- Add is_admin to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Add is_featured and skills to jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS skills text[] NOT NULL DEFAULT '{}';

-- Protect is_admin column: only admins can update it
REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (full_name, user_type, city, region, latitude, longitude) ON profiles TO authenticated;

-- Create SECURITY DEFINER function to set admin status (admin-only)
CREATE OR REPLACE FUNCTION set_admin_status(p_user_id uuid, p_is_admin boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE profiles SET is_admin = p_is_admin WHERE id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION set_admin_status FROM anon;
GRANT EXECUTE ON FUNCTION set_admin_status TO authenticated;

-- site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id int PRIMARY KEY DEFAULT 1,
  hero_background_type text NOT NULL DEFAULT 'gradient',
  hero_background_value text NOT NULL DEFAULT 'from-primary to-primary-light',
  hero_background_opacity real NOT NULL DEFAULT 0.2,
  news_section_categories text[] NOT NULL DEFAULT '{}',
  news_section_post_ids uuid[] NOT NULL DEFAULT '{}',
  news_section_count int NOT NULL DEFAULT 6,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_single_row CHECK (id = 1)
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_site_settings" ON site_settings;
CREATE POLICY "anon_read_site_settings" ON site_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_site_settings" ON site_settings;
CREATE POLICY "admin_update_site_settings" ON site_settings FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "admin_insert_site_settings" ON site_settings;
CREATE POLICY "admin_insert_site_settings" ON site_settings FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Seed default row
INSERT INTO site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- academy_tiles table
CREATE TABLE IF NOT EXISTS academy_tiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tile_key text UNIQUE NOT NULL,
  icon_name text NOT NULL DEFAULT 'BookOpen',
  image1_url text,
  image2_url text,
  video_url text,
  description text,
  animation_direction text NOT NULL DEFAULT 'top-right',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE academy_tiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_academy_tiles" ON academy_tiles;
CREATE POLICY "anon_read_academy_tiles" ON academy_tiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_academy_tiles" ON academy_tiles;
CREATE POLICY "admin_update_academy_tiles" ON academy_tiles FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "admin_insert_academy_tiles" ON academy_tiles;
CREATE POLICY "admin_insert_academy_tiles" ON academy_tiles FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "admin_delete_academy_tiles" ON academy_tiles;
CREATE POLICY "admin_delete_academy_tiles" ON academy_tiles FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Seed default academy tiles
INSERT INTO academy_tiles (tile_key, icon_name, animation_direction) VALUES
  ('courses', 'BookOpen', 'top-right'),
  ('handson', 'Tractor', 'top-left'),
  ('certificates', 'Sprout', 'bottom-right'),
  ('mentorship', 'Users', 'bottom-left'),
  ('tracks', 'GraduationCap', 'right'),
  ('verified', 'CheckCircle2', 'left')
ON CONFLICT (tile_key) DO NOTHING;

-- commodity_exchange_meta table
CREATE TABLE IF NOT EXISTS commodity_exchange_meta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_id uuid UNIQUE REFERENCES commodity_exchanges(id) ON DELETE CASCADE,
  icon_name text NOT NULL DEFAULT 'Building2',
  display_title text,
  specialties_override text[],
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE commodity_exchange_meta ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_exchange_meta" ON commodity_exchange_meta;
CREATE POLICY "anon_read_exchange_meta" ON commodity_exchange_meta FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_exchange_meta" ON commodity_exchange_meta;
CREATE POLICY "admin_update_exchange_meta" ON commodity_exchange_meta FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "admin_insert_exchange_meta" ON commodity_exchange_meta;
CREATE POLICY "admin_insert_exchange_meta" ON commodity_exchange_meta FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "admin_delete_exchange_meta" ON commodity_exchange_meta;
CREATE POLICY "admin_delete_exchange_meta" ON commodity_exchange_meta FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Grant anon read on profiles.is_admin so RLS policies can check it
-- (already covered by existing profiles SELECT policy)
