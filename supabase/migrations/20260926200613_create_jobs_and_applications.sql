/*
# Create jobs and applications tables for Turanda Tarım

## Overview
This migration creates the core database schema for the Turanda Tarım agricultural job marketplace.
It includes two tables: `jobs` (agricultural job listings) and `applications` (worker applications to jobs).
Since this is a public job board MVP with no sign-in flow, all policies use `TO anon, authenticated`
so the anon-key frontend can read and write data.

## 1. New Tables

### jobs
- `id` (uuid, primary key, auto-generated)
- `title` (text, not null) — job title
- `farm_name` (text, not null) — name of the farm/employer
- `job_type` (text, not null) — category: Harvesting, Driving, Animal Care, Planting, Irrigation, Equipment Operation, General Labor, Processing
- `description` (text, not null) — full job description
- `location` (text, not null) — city/region name
- `latitude` (double precision, not null) — map latitude
- `longitude` (double precision, not null) — map longitude
- `wage` (numeric, not null) — wage amount
- `wage_unit` (text, not null, default 'day') — wage period: day, week, month, hour
- `duration` (text, not null) — expected duration of work
- `requirements` (text[], default '{}') — list of requirements
- `openings` (integer, not null, default 1) — number of open positions
- `status` (text, not null, default 'active') — job status: active, closed
- `created_at` (timestamptz, default now()) — creation timestamp

### applications
- `id` (uuid, primary key, auto-generated)
- `job_id` (uuid, foreign key to jobs, on delete cascade) — which job this application is for
- `applicant_name` (text, not null) — full name of the applicant
- `applicant_phone` (text, not null) — phone number
- `applicant_email` (text, not null) — email address
- `message` (text, default '') — optional message to employer
- `status` (text, not null, default 'pending') — application status: pending, accepted, rejected
- `created_at` (timestamptz, default now()) — application timestamp

## 2. Indexes
- `idx_jobs_status` on jobs(status) — filter active jobs quickly
- `idx_jobs_job_type` on jobs(job_type) — filter by job type
- `idx_jobs_location` on jobs(location) — filter by location
- `idx_applications_job_id` on applications(job_id) — look up applications for a job

## 3. Security (RLS)
- Both tables have RLS enabled.
- All policies use `TO anon, authenticated` because this is a public job board MVP with no sign-in flow.
- Anyone can read, create, update, and delete jobs and applications (intentionally public/shared data for this MVP).

## 4. Seed Data
- Inserts 12 sample agricultural jobs across various Turkish cities and job types.

## Important Notes
1. This is a single-tenant MVP with no authentication — all data is intentionally public.
2. If authentication is added later, policies must be updated to use ownership checks with auth.uid().
3. The `USING (true)` policies are acceptable here because the data is intentionally public/shared.
*/

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  farm_name text NOT NULL,
  job_type text NOT NULL,
  description text NOT NULL,
  location text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  wage numeric NOT NULL,
  wage_unit text NOT NULL DEFAULT 'day',
  duration text NOT NULL,
  requirements text[] DEFAULT '{}',
  openings integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_name text NOT NULL,
  applicant_phone text NOT NULL,
  applicant_email text NOT NULL,
  message text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Jobs policies (public read/write for MVP)
DROP POLICY IF EXISTS "anon_select_jobs" ON jobs;
CREATE POLICY "anon_select_jobs" ON jobs
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_jobs" ON jobs;
CREATE POLICY "anon_insert_jobs" ON jobs
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_jobs" ON jobs;
CREATE POLICY "anon_update_jobs" ON jobs
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_jobs" ON jobs;
CREATE POLICY "anon_delete_jobs" ON jobs
  FOR DELETE TO anon, authenticated USING (true);

-- Applications policies (public read/write for MVP)
DROP POLICY IF EXISTS "anon_select_applications" ON applications;
CREATE POLICY "anon_select_applications" ON applications
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_applications" ON applications;
CREATE POLICY "anon_insert_applications" ON applications
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_applications" ON applications;
CREATE POLICY "anon_update_applications" ON applications
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_applications" ON applications;
CREATE POLICY "anon_delete_applications" ON applications
  FOR DELETE TO anon, authenticated USING (true);

-- Seed data
INSERT INTO jobs (title, farm_name, job_type, description, location, latitude, longitude, wage, wage_unit, duration, requirements, openings, status) VALUES
('Tomato Harvest Workers', 'Akdeniz Tarım', 'Harvesting', 'We need experienced workers for our annual tomato harvest. Work involves picking, sorting, and loading tomatoes. Training provided for first-time workers.', 'Antalya', 36.8969, 30.7133, 850, 'day', '3 weeks', ARRAY['Physical fitness', 'Early morning availability', 'Own transportation'], 8, 'active'),
('Tractor Driver - Seasonal', 'Anadolu Çiftliği', 'Driving', 'Experienced tractor driver needed for plowing and planting season. Must have valid tractor license and at least 2 years experience operating farm machinery.', 'Konya', 37.8746, 32.4932, 1200, 'day', '6 weeks', ARRAY['Tractor license', '2+ years experience', 'References required'], 2, 'active'),
('Shepherd & Livestock Care', 'Toros Dağ Çiftliği', 'Animal Care', 'Looking for a dedicated shepherd to care for our flock of 200 sheep. Includes feeding, health monitoring, and pasture rotation. Housing provided on-site.', 'Bursa', 40.1828, 29.0667, 1500, 'week', '3 months', ARRAY['Experience with livestock', 'Comfortable with rural living', 'Available for early shifts'], 1, 'active'),
('Olive Harvest Team', 'Ege Zeytin İşletmesi', 'Harvesting', 'Seasonal olive harvest workers needed. Tasks include hand-picking olives, operating shaking machines, and transporting harvest to processing facility.', 'İzmir', 38.4192, 27.1287, 750, 'day', '4 weeks', ARRAY['Physical stamina', 'Team player', 'Experience with olive harvest preferred'], 6, 'active'),
('Irrigation System Operator', 'Çukurova Sulama', 'Irrigation', 'Operate and maintain drip irrigation systems across 500 hectares. Monitor water distribution, repair lines, and report system issues to farm manager.', 'Adana', 37.0000, 35.3213, 950, 'week', '2 months', ARRAY['Technical aptitude', 'Previous irrigation experience', 'Problem-solving skills'], 2, 'active'),
('Citrus Orchard Workers', 'Akdeniz Narenciye', 'Planting', 'Help plant new citrus trees and maintain existing orchard. Includes digging, planting, staking, and initial watering of young trees.', 'Mersin', 36.8121, 34.6415, 800, 'day', '5 weeks', ARRAY['Physical fitness', 'Outdoor work comfort', 'No experience needed'], 10, 'active'),
('Combine Harvester Operator', 'İç Anadolu Tarım', 'Equipment Operation', 'Skilled combine harvester operator needed for wheat harvest. Must be able to calibrate, operate, and perform basic maintenance on large harvesting equipment.', 'Tekirdağ', 40.9833, 27.5119, 1400, 'day', '4 weeks', ARRAY['Combine harvester certification', '3+ years experience', 'Mechanical knowledge'], 2, 'active'),
('Dairy Farm Assistant', 'Marmara Süt İşletmesi', 'Animal Care', 'Assist with daily dairy operations including milking, feeding, barn cleaning, and health monitoring of 150 dairy cows. Training provided.', 'Balıkesir', 39.6484, 27.8826, 900, 'week', 'Ongoing', ARRAY['Reliable and punctual', 'Comfortable around animals', 'Willingness to learn'], 3, 'active'),
('Greenhouse Vegetable Picker', 'Antalya Seracılık', 'Harvesting', 'Pick and pack greenhouse tomatoes, cucumbers, and peppers. Climate-controlled environment. Piece-rate bonus available for high productivity.', 'Antalya', 36.8969, 30.7133, 700, 'day', '8 weeks', ARRAY['Attention to detail', 'Gentle handling of produce', 'Stamina for repetitive work'], 12, 'active'),
('Cotton Field Laborers', 'Şanlıurfa Tarım', 'General Labor', 'General labor needed for cotton fields — weeding, thinning, and assisting with irrigation. Long days in the sun, water and shade provided.', 'Şanlıurfa', 37.1674, 38.7955, 650, 'day', '6 weeks', ARRAY['Heat tolerance', 'Physical endurance', 'Team worker'], 15, 'active'),
('Wheat Harvest Drivers', 'Konya Ovası Çiftliği', 'Driving', 'Drive grain trucks between fields and silos during wheat harvest. Must have valid truck license and clean driving record.', 'Konya', 37.8746, 32.4932, 1100, 'day', '3 weeks', ARRAY['Truck license (C class)', 'Clean driving record', 'Available 7 days a week'], 4, 'active'),
('Fruit Processing Workers', 'Ege Meşe İşletmesi', 'Processing', 'Work in our fruit packing facility — sorting, grading, packing, and loading dried fruit products. Indoor work with climate control.', 'Manisa', 38.6191, 27.4289, 750, 'week', '4 months', ARRAY['Food safety awareness', 'Attention to quality', 'Reliable attendance'], 8, 'active')
ON CONFLICT DO NOTHING;
