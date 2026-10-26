/*
# Commodity Exchange Admin CRUD + Performance Indexes

## Overview
Adds admin CRUD policies to commodity_exchanges, a latest_price_date column
for freshness tracking, and performance indexes on commodity_prices.

## 1. Modified Tables

### commodity_exchanges
- Added latest_price_date (date, nullable) column
- Added admin-only INSERT/UPDATE/DELETE RLS policies

### commodity_prices
- Added unique composite index on (exchange_id, commodity_name, recorded_date)
  for deduplication during data ingestion
- Added composite index on (commodity_name, recorded_date DESC) for chart queries

## 2. Security
- commodity_exchanges: admin-only INSERT/UPDATE/DELETE using profiles.is_admin check
- Existing anon SELECT policy is preserved

## 3. Important Notes
1. The unique index enables ON CONFLICT (exchange_id, commodity_name, recorded_date)
   DO NOTHING in the edge function for deduplication
2. latest_price_date is nullable so existing exchanges don't break
3. The (commodity_name, recorded_date DESC) index speeds up the most common
   chart query: filtering by commodity and sorting by date
*/

-- Add latest_price_date column to commodity_exchanges
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'commodity_exchanges' AND column_name = 'latest_price_date'
  ) THEN
    ALTER TABLE commodity_exchanges ADD COLUMN latest_price_date date;
  END IF;
END $$;

-- Admin CRUD policies on commodity_exchanges
DROP POLICY IF EXISTS "admin_insert_commodity_exchanges" ON commodity_exchanges;
CREATE POLICY "admin_insert_commodity_exchanges" ON commodity_exchanges
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

DROP POLICY IF EXISTS "admin_update_commodity_exchanges" ON commodity_exchanges;
CREATE POLICY "admin_update_commodity_exchanges" ON commodity_exchanges
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

DROP POLICY IF EXISTS "admin_delete_commodity_exchanges" ON commodity_exchanges;
CREATE POLICY "admin_delete_commodity_exchanges" ON commodity_exchanges
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- Performance indexes on commodity_prices
CREATE UNIQUE INDEX IF NOT EXISTS idx_commodity_prices_unique_dedup
  ON commodity_prices (exchange_id, commodity_name, recorded_date);

CREATE INDEX IF NOT EXISTS idx_commodity_prices_name_date_desc
  ON commodity_prices (commodity_name, recorded_date DESC);

CREATE INDEX IF NOT EXISTS idx_commodity_exchanges_latest_price_date
  ON commodity_exchanges (latest_price_date DESC NULLS LAST);