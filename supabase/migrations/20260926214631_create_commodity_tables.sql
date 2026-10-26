/*
# Create commodity_exchanges and commodity_prices tables

## Overview
This migration creates the schema for tracking Turkish agricultural commodity prices
across regional commodity exchanges (Ticaret Borsaları).

## 1. New Tables

### commodity_exchanges
- `id` (uuid, primary key)
- `name` (text, not null) — exchange name
- `short_name` (text) — abbreviation
- `city` (text, not null) — city
- `region` (text, not null) — geographical region
- `specialties` (text[], default '{}') — key commodities tracked
- `latitude` (double precision)
- `longitude` (double precision)
- `created_at` (timestamptz, default now())

### commodity_prices
- `id` (uuid, primary key)
- `exchange_id` (uuid, FK to commodity_exchanges, on delete cascade)
- `commodity_name` (text, not null)
- `commodity_category` (text, not null)
- `unit` (text, not null)
- `price` (numeric, not null) — price in TRY
- `currency` (text, default 'TRY')
- `change_pct` (numeric, default 0)
- `recorded_date` (date, not null)
- `created_at` (timestamptz, default now())

## 2. Security (RLS)
- Both tables have RLS enabled, public read for anon + authenticated

## 3. Seed Data
- 20 Turkish commodity exchanges
- 6 months of monthly price data for key commodities

## Important Notes
1. Public market data — no ownership checks needed
2. Price data is mock/simulated for MVP demonstration
*/

CREATE TABLE IF NOT EXISTS commodity_exchanges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_name text,
  city text NOT NULL,
  region text NOT NULL,
  specialties text[] DEFAULT '{}',
  latitude double precision,
  longitude double precision,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS commodity_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_id uuid NOT NULL REFERENCES commodity_exchanges(id) ON DELETE CASCADE,
  commodity_name text NOT NULL,
  commodity_category text NOT NULL,
  unit text NOT NULL DEFAULT 'ton',
  price numeric NOT NULL,
  currency text NOT NULL DEFAULT 'TRY',
  change_pct numeric DEFAULT 0,
  recorded_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commodity_prices_exchange ON commodity_prices(exchange_id);
CREATE INDEX IF NOT EXISTS idx_commodity_prices_name ON commodity_prices(commodity_name);
CREATE INDEX IF NOT EXISTS idx_commodity_prices_date ON commodity_prices(recorded_date);
CREATE INDEX IF NOT EXISTS idx_commodity_exchanges_city ON commodity_exchanges(city);

ALTER TABLE commodity_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE commodity_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_exchanges" ON commodity_exchanges;
CREATE POLICY "anon_select_exchanges" ON commodity_exchanges
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_prices" ON commodity_prices;
CREATE POLICY "anon_select_prices" ON commodity_prices
  FOR SELECT TO anon, authenticated USING (true);

-- Seed commodity exchanges
INSERT INTO commodity_exchanges (name, short_name, city, region, specialties, latitude, longitude) VALUES
('Türkiye Ticaret Borsası (TMEX/TÜRİB)', 'TMEX', 'Ankara', 'İç Anadolu', ARRAY['Buğday','Arpa','Mısır','Ayçiçeği','Mercimek','Nohut'], 39.9334, 32.8597),
('İzmir Ticaret Borsası', 'İZTB', 'İzmir', 'Ege', ARRAY['Pamuk','Üzüm','İncir','Zeytinyağı','Tütün'], 38.4192, 27.1287),
('Ordu Ticaret Borsası', 'OTB', 'Ordu', 'Karadeniz', ARRAY['Fındık','Çay'], 40.9833, 37.8826),
('Antalya Ticaret Borsası', 'ATB', 'Antalya', 'Akdeniz', ARRAY['Narenciye','Muz','Zeytin'], 36.8969, 30.7133),
('Adana Ticaret Borsası', 'ATB-Adana', 'Adana', 'Akdeniz', ARRAY['Pamuk','Buğday','Mısır','Narenciye','Soya'], 37.0000, 35.3213),
('Konya Ticaret Borsası', 'KTB', 'Konya', 'İç Anadolu', ARRAY['Buğday','Arpa','Şeker Pancarı','Mısır'], 37.8746, 32.4932),
('Gaziantep Ticaret Borsası', 'GTB', 'Gaziantep', 'Güneydoğu Anadolu', ARRAY['Antep Fıstığı','Mercimek','Pamuk','Zeytin'], 37.0662, 37.3833),
('Bursa Ticaret Borsası', 'BTB', 'Bursa', 'Marmara', ARRAY['Şeftali','Çilek','Zeytin','Domates'], 40.1828, 29.0667),
('Mersin Ticaret Borsası', 'MTB', 'Mersin', 'Akdeniz', ARRAY['Narenciye','Muz','Buğday','Soya'], 36.8121, 34.6415),
('Tekirdağ Ticaret Borsası', 'TTB', 'Tekirdağ', 'Marmara', ARRAY['Buğday','Ayçiçeği','Üzüm','Pamuk'], 40.9833, 27.5119),
('Samsun Ticaret Borsası', 'STB', 'Samsun', 'Karadeniz', ARRAY['Fındık','Çay','Tütün','Buğday'], 41.2867, 36.3300),
('Trabzon Ticaret Borsası', 'TTB-Trabzon', 'Trabzon', 'Karadeniz', ARRAY['Fındık','Çay','Mısır'], 41.0050, 39.7170),
('Kayseri Ticaret Borsası', 'KTB-Kayseri', 'Kayseri', 'İç Anadolu', ARRAY['Buğday','Arpa','Şeker Pancarı','Mercimek'], 38.7312, 35.4787),
('Şanlıurfa Ticaret Borsası', 'ŞUTB', 'Şanlıurfa', 'Güneydoğu Anadolu', ARRAY['Buğday','Pamuk','Mercimek','Antep Fıstığı'], 37.1674, 38.7955),
('Diyarbakır Ticaret Borsası', 'DTB', 'Diyarbakır', 'Güneydoğu Anadolu', ARRAY['Buğday','Arpa','Mercimek','Nohut'], 37.9144, 40.2306),
('Balıkesir Ticaret Borsası', 'BTB-Balıkesir', 'Balıkesir', 'Ege', ARRAY['Zeytin','Ayçiçeği','Pamuk','Mısır'], 39.6484, 27.8826),
('Hatay Ticaret Borsası', 'HTB', 'Hatay', 'Akdeniz', ARRAY['Zeytin','Narenciye','Pamuk','Buğday'], 36.4018, 36.3518),
('Manisa Ticaret Borsası', 'MTB-Manisa', 'Manisa', 'Ege', ARRAY['Üzüm','Zeytin','Pamuk','Domates'], 38.6191, 27.4289),
('Çanakkale Ticaret Borsası', 'ÇTB', 'Çanakkale', 'Marmara', ARRAY['Zeytin','Domates','Şeftali','Ayçiçeği'], 40.1553, 26.4142),
('Muğla Ticaret Borsası', 'MTB-Muğla', 'Muğla', 'Ege', ARRAY['Zeytinyağı','Tütün','Çam Fıstığı','Narenciye'], 37.2155, 28.3636)
ON CONFLICT DO NOTHING;

-- Seed commodity price data (6 months of monthly data)
DO $$
DECLARE
  ex RECORD;
  base_price numeric;
  month_idx int;
  price_val numeric;
  change_val numeric;
  d date;
  cdef jsonb;
  commodity_defs jsonb[] := ARRAY[
    '{"name":"Buğday","category":"Grain & Field Crops","unit":"ton","base":8250}'::jsonb,
    '{"name":"Arpa","category":"Grain & Field Crops","unit":"ton","base":7100}'::jsonb,
    '{"name":"Mısır","category":"Grain & Field Crops","unit":"ton","base":6800}'::jsonb,
    '{"name":"Pamuk","category":"Grain & Field Crops","unit":"ton","base":42500}'::jsonb,
    '{"name":"Ayçiçeği","category":"Oilseeds","unit":"ton","base":18500}'::jsonb,
    '{"name":"Fındık","category":"Specialty Crops","unit":"kg","base":95}'::jsonb,
    '{"name":"Antep Fıstığı","category":"Specialty Crops","unit":"kg","base":320}'::jsonb,
    '{"name":"Üzüm","category":"Specialty Crops","unit":"ton","base":35000}'::jsonb,
    '{"name":"İncir","category":"Specialty Crops","unit":"ton","base":68000}'::jsonb,
    '{"name":"Zeytinyağı","category":"Specialty Crops","unit":"ton","base":295000}'::jsonb,
    '{"name":"Mercimek","category":"Pulses","unit":"ton","base":22500}'::jsonb,
    '{"name":"Nohut","category":"Pulses","unit":"ton","base":19500}'::jsonb,
    '{"name":"Çay","category":"Specialty Crops","unit":"kg","base":85}'::jsonb,
    '{"name":"Narenciye","category":"Specialty Crops","unit":"ton","base":12000}'::jsonb,
    '{"name":"Şeker Pancarı","category":"Grain & Field Crops","unit":"ton","base":3200}'::jsonb,
    '{"name":"Tütün","category":"Specialty Crops","unit":"kg","base":110}'::jsonb,
    '{"name":"Soya","category":"Oilseeds","unit":"ton","base":16500}'::jsonb
  ]::jsonb[];
BEGIN
  FOR ex IN SELECT id, specialties FROM commodity_exchanges LOOP
    FOREACH cdef IN ARRAY commodity_defs LOOP
      IF (cdef->>'name') = ANY(ex.specialties) THEN
        base_price := (cdef->>'base')::numeric;
        FOR month_idx IN 0..5 LOOP
          d := DATE_TRUNC('month', (CURRENT_DATE - INTERVAL '5 months' + (month_idx || ' months')::interval))::date;
          price_val := base_price * (1 + (random() - 0.45) * 0.16 + month_idx * 0.008);
          price_val := ROUND(price_val::numeric, 2);
          IF month_idx = 0 THEN
            change_val := 0;
          ELSE
            change_val := ROUND(((random() - 0.4) * 12)::numeric, 2);
          END IF;
          INSERT INTO commodity_prices (exchange_id, commodity_name, commodity_category, unit, price, change_pct, recorded_date)
          VALUES (ex.id, cdef->>'name', cdef->>'category', cdef->>'unit', price_val, change_val, d)
          ON CONFLICT DO NOTHING;
        END LOOP;
      END IF;
    END LOOP;
  END LOOP;
END $$;
