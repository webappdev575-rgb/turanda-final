/*
# Featured Job Tiers, Payment Tracking, Ad Requests & Farmer-Friendly Ad Pricing

## Overview
This migration adds monetization infrastructure to the Turanda Tarım platform:
1. Featured job tier columns on the `jobs` table (featured_tier, featured_until, payment_status)
2. A new `job_payments` table for tracking payment attempts and transaction records
3. A new `ad_requests` table for capturing advertising lead submissions from employers/companies
4. Updated ad space pricing to be farmer-friendly (reduced monthly rates)
5. New standard ad position seed entries for the AdSpaceRenderer component

## 1. Modified Tables

### jobs (modified)
- Added `featured_tier` (text, default 'standard') — 'standard', 'featured', or 'pinned'
- Added `featured_until` (timestamptz, nullable) — when the featured/pinned status expires
- Added `payment_status` (text, default 'free') — 'free', 'pending', 'paid', 'failed'

## 2. New Tables

### job_payments
- `id` (uuid, primary key)
- `job_id` (uuid, FK to jobs, on delete cascade) — which job this payment is for
- `amount` (numeric, not null) — payment amount in TL
- `tier` (text, not null) — which tier was purchased ('featured' or 'pinned')
- `provider` (text, not null, default 'test') — payment provider ('iyzico', 'stripe', 'test')
- `transaction_id` (text, nullable) — provider transaction reference
- `status` (text, not null, default 'pending') — 'pending', 'paid', 'failed'
- `created_at` (timestamptz, default now())

### ad_requests
- `id` (uuid, primary key)
- `company_name` (text, not null) — advertiser company name
- `contact_email` (text, not null) — contact email for the request
- `contact_phone` (text, not null) — contact phone number
- `target_placement` (text, not null) — desired ad position key
- `target_url` (text, nullable) — landing URL for the banner
- `banner_design_option` (text, not null, default 'self_provided') — 'self_provided' or 'custom_design'
- `banner_file_url` (text, nullable) — URL of uploaded banner artwork
- `design_notes` (text, nullable) — notes for custom banner design request
- `message` (text, nullable) — additional message from the advertiser
- `status` (text, not null, default 'pending') — 'pending', 'approved', 'rejected', 'converted'
- `created_at` (timestamptz, default now())

## 3. Security (RLS)
- job_payments: authenticated read/insert/update (financial data, no anon access)
- ad_requests: public insert (lead capture), authenticated read/update/delete (admin review)

## 4. Ad Space Price Updates
- All ad space prices reduced to farmer-friendly rates (₺175-450/month depending on position)

## Important Notes
1. is_featured remains for backward compatibility; set to true when tier is 'featured' or 'pinned'
2. featured_until is nullable — standard jobs have NULL; featured/pinned jobs have a 30-day expiry
3. ad_requests accepts public inserts so companies can submit without an account
*/

-- Add featured tier columns to jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS featured_tier text NOT NULL DEFAULT 'standard';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS featured_until timestamptz;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'free';

-- Create job_payments table
CREATE TABLE IF NOT EXISTS job_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  tier text NOT NULL,
  provider text NOT NULL DEFAULT 'test',
  transaction_id text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_payments_job_id ON job_payments(job_id);
CREATE INDEX IF NOT EXISTS idx_job_payments_status ON job_payments(status);

ALTER TABLE job_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_job_payments" ON job_payments;
CREATE POLICY "auth_select_job_payments" ON job_payments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_job_payments" ON job_payments;
CREATE POLICY "auth_insert_job_payments" ON job_payments
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_job_payments" ON job_payments;
CREATE POLICY "auth_update_job_payments" ON job_payments
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Create ad_requests table
CREATE TABLE IF NOT EXISTS ad_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  target_placement text NOT NULL,
  target_url text,
  banner_design_option text NOT NULL DEFAULT 'self_provided',
  banner_file_url text,
  design_notes text,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ad_requests_status ON ad_requests(status);

ALTER TABLE ad_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_ad_requests" ON ad_requests;
CREATE POLICY "anon_insert_ad_requests" ON ad_requests
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_select_ad_requests" ON ad_requests;
CREATE POLICY "auth_select_ad_requests" ON ad_requests
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_update_ad_requests" ON ad_requests;
CREATE POLICY "auth_update_ad_requests" ON ad_requests
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_ad_requests" ON ad_requests;
CREATE POLICY "auth_delete_ad_requests" ON ad_requests
  FOR DELETE TO authenticated USING (true);

-- Update ad space prices to farmer-friendly rates
UPDATE ad_spaces SET price_per_month = 350 WHERE slot = 'jobs-sidebar-all';
UPDATE ad_spaces SET price_per_month = 250 WHERE slot LIKE 'jobs-sidebar-%' AND slot != 'jobs-sidebar-all';
UPDATE ad_spaces SET price_per_month = 450 WHERE slot = 'home-sidebar-top';
UPDATE ad_spaces SET price_per_month = 350 WHERE slot = 'home-sidebar-bottom';
UPDATE ad_spaces SET price_per_month = 300 WHERE slot = 'news-sidebar-primary';
UPDATE ad_spaces SET price_per_month = 400 WHERE slot = 'news-sidebar-secondary';
UPDATE ad_spaces SET price_per_month = 200 WHERE slot = 'dashboard-sidebar';
UPDATE ad_spaces SET price_per_month = 200 WHERE slot IN ('jobs-inline-1', 'jobs-inline-2');
UPDATE ad_spaces SET price_per_month = 175 WHERE slot = 'news-inline-1';
UPDATE ad_spaces SET price_per_month = 500 WHERE slot = 'header-banner';
UPDATE ad_spaces SET price_per_month = 300 WHERE slot = 'footer-banner';
UPDATE ad_spaces SET price_per_month = 250 WHERE slot = 'between-sections';
UPDATE ad_spaces SET price_per_month = 175 WHERE slot = 'inline-feed';
UPDATE ad_spaces SET price_per_month = 300 WHERE slot = 'sidebar-primary';
UPDATE ad_spaces SET price_per_month = 400 WHERE slot = 'sidebar-secondary';

-- Seed new standard ad positions
INSERT INTO ad_spaces (slot, placement, label, description, page, width, height, available, price_per_month) VALUES
  ('commodity-sidebar', 'sidebar', 'Commodity Sidebar', 'Sidebar ad on the commodities page', 'commodities', 300, 250, true, 250),
  ('employer-sidebar', 'sidebar', 'Employer Sidebar', 'Sidebar ad on the employer portal', 'employer', 300, 250, true, 200)
ON CONFLICT (slot) DO NOTHING;
