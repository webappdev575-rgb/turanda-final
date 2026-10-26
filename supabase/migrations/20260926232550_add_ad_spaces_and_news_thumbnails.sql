/*
# Add ad_spaces table and thumbnail_url column to news_articles

## Overview
This migration adds:
1. A `thumbnail_url` column to `news_articles` for AI-generated thumbnails
2. A new `ad_spaces` table for managing purchasable ad placements
3. A new `ad_placements` table for tracking active ad bookings

## 1. Modified Tables

### news_articles (modified)
- Added `thumbnail_url` (text, nullable) — URL of AI-generated or uploaded thumbnail image
- Added `thumbnail_prompt` (text, nullable) — the AI prompt used to generate the thumbnail (for re-generation)

## 2. New Tables

### ad_spaces
- `id` (uuid, primary key)
- `slot` (text, not null, unique) — unique slot identifier (e.g. 'sidebar-primary')
- `placement` (text, not null) — 'sidebar' | 'header' | 'footer' | 'inline' | 'between-sections'
- `label` (text, not null) — display label
- `width` (integer, default 0) — width in pixels (0 = responsive)
- `height` (integer, default 0) — height in pixels
- `available` (boolean, default true) — whether this slot is available for purchase
- `price_per_month` (numeric, default 0) — monthly price for this ad slot
- `created_at` (timestamptz, default now())

### ad_placements
- `id` (uuid, primary key)
- `ad_space_id` (uuid, FK to ad_spaces, on delete cascade)
- `business_name` (text, not null) — advertiser business name
- `image_url` (text) — ad creative image URL
- `target_url` (text) — URL the ad links to
- `start_date` (date, not null) — when the ad campaign starts
- `end_date` (date, not null) — when the ad campaign ends
- `is_active` (boolean, default true) — whether this placement is currently active
- `created_at` (timestamptz, default now())

## 3. Security (RLS)
- ad_spaces: public read (anon + authenticated), no public write (managed via service role)
- ad_placements: public read for active placements only (anon + authenticated)

## Important Notes
1. Ad spaces are managed via the app config file (lib/app-config.ts) and seeded here
2. Ad placements are created by admins using the service role key
3. Only active placements within their date range are visible to the public
*/

-- Add thumbnail columns to news_articles
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS thumbnail_prompt text;

-- Create ad_spaces table
CREATE TABLE IF NOT EXISTS ad_spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot text NOT NULL UNIQUE,
  placement text NOT NULL,
  label text NOT NULL,
  width integer DEFAULT 0,
  height integer DEFAULT 0,
  available boolean DEFAULT true,
  price_per_month numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create ad_placements table
CREATE TABLE IF NOT EXISTS ad_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_space_id uuid NOT NULL REFERENCES ad_spaces(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  image_url text,
  target_url text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ad_placements_space ON ad_placements(ad_space_id);
CREATE INDEX IF NOT EXISTS idx_ad_placements_active ON ad_placements(is_active) WHERE is_active = true;

ALTER TABLE ad_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_placements ENABLE ROW LEVEL SECURITY;

-- ad_spaces: public read
DROP POLICY IF EXISTS "anon_select_ad_spaces" ON ad_spaces;
CREATE POLICY "anon_select_ad_spaces" ON ad_spaces
  FOR SELECT TO anon, authenticated USING (true);

-- ad_placements: public read for active placements within date range
DROP POLICY IF EXISTS "anon_select_ad_placements" ON ad_placements;
CREATE POLICY "anon_select_ad_placements" ON ad_placements
  FOR SELECT TO anon, authenticated
  USING (is_active = true AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE);

-- Seed ad spaces from config
INSERT INTO ad_spaces (slot, placement, label, width, height, available, price_per_month) VALUES
  ('sidebar-primary', 'sidebar', 'Primary Sidebar Ad', 300, 250, true, 500),
  ('sidebar-secondary', 'sidebar', 'Secondary Sidebar Ad', 300, 600, true, 800),
  ('header-banner', 'header', 'Header Banner Ad', 728, 90, true, 1000),
  ('footer-banner', 'footer', 'Footer Banner Ad', 728, 90, true, 600),
  ('inline-feed', 'inline', 'Inline Feed Ad', 0, 120, true, 300),
  ('between-sections', 'between-sections', 'Between Sections Ad', 0, 150, true, 400)
ON CONFLICT (slot) DO NOTHING;
