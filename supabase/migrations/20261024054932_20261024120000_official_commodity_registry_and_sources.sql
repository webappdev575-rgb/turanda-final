/*
# Official commodity baselines: registry entries + official price sources

1. Purpose
   Register the commodities from the user's official price list that were missing
   from the market system, and register TMO / ESK / TUIK as official price sources
   so the price-sync background job has something to run.

2. New registry rows (commodity_registry, upsert on commodity_name)
   - "Pirinç (Çeltik)" (paddy rice) — ton, TMO release tariffs
   - "Dana Karkas Et" (beef carcass) — kg, ESK baseline
   - "Dana Kıyma" (minced beef) — kg, ESK retail index
   - "Dana Kuşbaşı" (diced beef) — kg, ESK retail index
   - "Yumurta" (table eggs) — kg, producer cooperative pricing
   - "Patates" (potatoes) — kg, regional wholesale benchmark
   - "Soğan" (dry onions) — kg, regional wholesale benchmark
   Each row gets tr/en/ar translations, a lucide icon default, sensible display
   order, and is_visible = true. Admin icon manager reads the same registry, so
   icons remain admin-controllable like every other commodity.

3. New source rows (commodity_sources, upsert on name)
   - TMO — official grain purchase tariffs (weekly)
   - ESK — meat & dairy baseline (weekly)
   - TÜİK — statistics-backed indices (weekly)
   All active, exchange-less (institution-wide), no API key required.

4. Security
   No RLS/policy/grant changes; tables already exposed with existing policies.
*/

INSERT INTO public.commodity_registry
  (commodity_name, category, unit, translation_tr, translation_en, translation_ar, icon_name, icon_type, display_order, is_visible, is_featured)
VALUES
  ('Pirinç (Çeltik)', 'Grain & Field Crops', 'ton', 'Pirinç (Çeltik)', 'Rice (Paddy)', 'أرز (شعير)', 'Wheat', 'lucide', 7, true, false),
  ('Dana Karkas Et', 'Livestock & Meat', 'kg', 'Dana Karkas Et', 'Beef Carcass', 'لحم بقري (ذبيحة)', 'Beef', 'lucide', 20, true, true),
  ('Dana Kıyma', 'Livestock & Meat', 'kg', 'Dana Kıyma', 'Minced Beef', 'لحم مفروم', 'Beef', 'lucide', 21, true, false),
  ('Dana Kuşbaşı', 'Livestock & Meat', 'kg', 'Dana Kuşbaşı', 'Diced Beef', 'لحم مكعبات', 'Beef', 'lucide', 22, true, false),
  ('Yumurta', 'Livestock & Meat', 'kg', 'Yumurta', 'Table Eggs', 'بيض', 'Egg', 'lucide', 23, true, true),
  ('Patates', 'Vegetable', 'kg', 'Patates', 'Potatoes', 'بطاطس', 'Carrot', 'lucide', 24, true, false),
  ('Soğan', 'Vegetable', 'kg', 'Soğan', 'Dry Onions', 'بصل', 'Carrot', 'lucide', 25, true, false)
ON CONFLICT (commodity_name) DO UPDATE SET
  updated_at = now();

INSERT INTO public.commodity_sources (name, source_type, url, api_key_env, exchange_id, fetch_interval, is_active, field_mapping)
SELECT v.name, v.source_type, v.url, NULL, NULL, v.fetch_interval, true, v.field_mapping
FROM (VALUES
  ('TMO - Toprak Mahsulleri Ofisi', 'manual_json', 'https://www.tmo.gov.tr', 'weekly',
   jsonb_build_object('commodity_name', 'commodity_name', 'price', 'price', 'unit', 'unit', 'recorded_date', 'recorded_date')),
  ('ESK - Et ve Süt Kurumu', 'manual_json', 'https://esk.gov.tr', 'weekly',
   jsonb_build_object('commodity_name', 'commodity_name', 'price', 'price', 'unit', 'unit', 'recorded_date', 'recorded_date')),
  ('TÜİK - Türkiye İstatistik Kurumu', 'manual_json', 'https://data.tuik.gov.tr', 'weekly',
   jsonb_build_object('commodity_name', 'commodity_name', 'price', 'price', 'unit', 'unit', 'recorded_date', 'recorded_date'))
) AS v(name, source_type, url, fetch_interval, field_mapping)
WHERE NOT EXISTS (SELECT 1 FROM public.commodity_sources s WHERE s.name = v.name);