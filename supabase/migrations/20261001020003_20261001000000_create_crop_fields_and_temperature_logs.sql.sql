/*
# Create crop_fields and temperature_logs tables

## Purpose
Enables users to manage their crop fields/plots and log temperature readings for each field.
This supports the crop & temperature management feature (tablet-optimized page + dashboard widget).

## New Tables

### 1. crop_fields
Stores information about a user's crop fields/plots:
- id (uuid, primary key)
- user_id (uuid, not null, defaults to auth.uid(), references auth.users ON DELETE CASCADE)
- name (text, not null) — field/plot name
- crop_type (text, not null) — what crop is grown
- field_size (numeric, default 0) — area of the field
- size_unit (text, default 'dönüm') — unit of measurement (dönüm, hektar, m², etc.)
- city (text, not null) — which city the field is in
- latitude (double precision, nullable) — geo coordinate
- longitude (double precision, nullable) — geo coordinate
- planting_date (date, nullable) — when the crop was planted
- expected_harvest_date (date, nullable) — expected harvest date
- status (text, default 'planning') — one of: planning, planted, growing, ready, harvested
- notes (text, nullable) — free-form notes
- temp_min_threshold (numeric, default 0) — minimum acceptable temperature (°C)
- temp_max_threshold (numeric, default 40) — maximum acceptable temperature (°C)
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())

### 2. temperature_logs
Stores temperature readings for each field:
- id (uuid, primary key)
- field_id (uuid, not null, references crop_fields ON DELETE CASCADE)
- user_id (uuid, not null, defaults to auth.uid(), references auth.users ON DELETE CASCADE)
- temperature (numeric, not null) — temperature reading in °C
- recorded_at (timestamptz, not null, default now()) — when the reading was taken
- notes (text, nullable) — optional notes about the reading
- created_at (timestamptz, default now())

## Security
- RLS enabled on both tables.
- Only the owning user (auth.uid() = user_id) can SELECT, INSERT, UPDATE, DELETE.
- user_id defaults to auth.uid() so inserts that omit it still work.
- temperature_logs are scoped through their own user_id column (not just through field_id) for direct ownership checks.
- 4 separate policies per table (SELECT, INSERT, UPDATE, DELETE) — no FOR ALL.

## Indexes
- crop_fields(user_id) — for fetching a user's fields
- temperature_logs(field_id) — for fetching logs per field
- temperature_logs(field_id, recorded_at desc) — for latest-temperature queries
*/

CREATE TABLE IF NOT EXISTS crop_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  crop_type text NOT NULL,
  field_size numeric DEFAULT 0,
  size_unit text NOT NULL DEFAULT 'dönüm',
  city text NOT NULL,
  latitude double precision,
  longitude double precision,
  planting_date date,
  expected_harvest_date date,
  status text NOT NULL DEFAULT 'planning',
  notes text,
  temp_min_threshold numeric NOT NULL DEFAULT 0,
  temp_max_threshold numeric NOT NULL DEFAULT 40,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crop_fields_user_id ON crop_fields(user_id);

ALTER TABLE crop_fields ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_crop_fields" ON crop_fields;
CREATE POLICY "select_own_crop_fields"
  ON crop_fields FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_crop_fields" ON crop_fields;
CREATE POLICY "insert_own_crop_fields"
  ON crop_fields FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_crop_fields" ON crop_fields;
CREATE POLICY "update_own_crop_fields"
  ON crop_fields FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_crop_fields" ON crop_fields;
CREATE POLICY "delete_own_crop_fields"
  ON crop_fields FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS temperature_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id uuid NOT NULL REFERENCES crop_fields(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  temperature numeric NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_temperature_logs_field_id ON temperature_logs(field_id);
CREATE INDEX IF NOT EXISTS idx_temperature_logs_field_recorded ON temperature_logs(field_id, recorded_at DESC);

ALTER TABLE temperature_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_temperature_logs" ON temperature_logs;
CREATE POLICY "select_own_temperature_logs"
  ON temperature_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_temperature_logs" ON temperature_logs;
CREATE POLICY "insert_own_temperature_logs"
  ON temperature_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_temperature_logs" ON temperature_logs;
CREATE POLICY "update_own_temperature_logs"
  ON temperature_logs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_temperature_logs" ON temperature_logs;
CREATE POLICY "delete_own_temperature_logs"
  ON temperature_logs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
