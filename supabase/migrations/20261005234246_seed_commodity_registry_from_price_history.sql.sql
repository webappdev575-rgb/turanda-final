/*
# Seed commodity registry with the 17 commodities in the price history

1. Purpose
- The homepage "market pulse" card shows a chart and a strip of top commodities,
  but it only displays prices for commodities listed in `commodity_registry`.
- That registry table was empty, so the card stayed on "Loading market data..."
  even though `commodity_prices` holds 384 price rows for 17 commodities.
- This migration fills the registry with exactly those 17 commodities, using the
  same spellings as the price rows so every price has a matching registry entry.

2. Tables modified
- `commodity_registry` (data insert only, no schema change):
  - `commodity_name` — matches `commodity_prices.commodity_name` exactly.
  - `category` — one of the 4 keys already in `commodity_categories`:
    "Grain & Field Crops", "Oilseeds", "Pulses", "Specialty Crops".
  - `unit` — kg or ton, matching what each commodity's price rows use.
  - `translation_tr` / `translation_en` / `translation_ar` — wording reused from
    the app's existing translation map so the UI shows consistent names.
  - `icon_name` / `icon_type` — Lucide icon names from the app's icon map
    (`lib/translations.ts` commodityIcons).
  - `display_order` — controls ordering on the markets page (1 = first).
  - `is_visible` — all true, so every seeded commodity appears.
  - `is_featured` — Buğday, Fındık and Zeytinyağı are featured; the homepage
    chart panel highlights them.

3. Security
- No changes. Existing RLS policies on `commodity_registry` already allow
  anonymous and authenticated reads; only admins can write.

4. Important notes
- The insert is idempotent: rows that already exist (matched on commodity_name)
  are skipped, so re-running this migration never creates duplicates.
- No rows are updated or deleted — admin customizations are preserved.
*/

INSERT INTO commodity_registry
  (commodity_name, category, unit, translation_tr, translation_en, translation_ar, icon_name, icon_type, icon_svg_path, display_order, is_visible, is_featured)
VALUES
  ('Buğday',       'Grain & Field Crops', 'ton', 'Buğday',        'Wheat',        'القمح',       'Wheat',       'lucide', NULL, 1,  true, true),
  ('Mısır',        'Grain & Field Crops', 'ton', 'Mısır',         'Corn',         'الذرة',       'Sprout',      'lucide', NULL, 2,  true, false),
  ('Arpa',         'Grain & Field Crops', 'ton', 'Arpa',          'Barley',       'الشعير',      'Wheat',       'lucide', NULL, 3,  true, false),
  ('Ayçiçeği',     'Oilseeds',            'ton', 'Ayçiçeği',      'Sunflower',    'عباد الشمس',  'Sun',         'lucide', NULL, 4,  true, false),
  ('Pamuk',        'Grain & Field Crops', 'ton', 'Pamuk',         'Cotton',       'القطن',       'Cloud',       'lucide', NULL, 5,  true, false),
  ('Mercimek',     'Pulses',              'ton', 'Mercimek',      'Lentils',      'العدس',       'LeafyGreen',  'lucide', NULL, 6,  true, false),
  ('Nohut',        'Pulses',              'ton', 'Nohut',         'Chickpeas',    'الحمص',       'LeafyGreen',  'lucide', NULL, 7,  true, false),
  ('Soya',         'Oilseeds',            'ton', 'Soya',          'Soybeans',     'فول الصويا',  'LeafyGreen',  'lucide', NULL, 8,  true, false),
  ('Zeytinyağı',   'Specialty Crops',     'ton', 'Zeytinyağı',    'Olive Oil',    'زيت الزيتون', 'FlaskRound',  'lucide', NULL, 9,  true, true),
  ('Fındık',       'Specialty Crops',     'kg',  'Fındık',        'Hazelnut',     'البندق',      'Nut',         'lucide', NULL, 10, true, true),
  ('Antep Fıstığı','Specialty Crops',     'kg',  'Antep Fıstığı', 'Pistachio',    'الفستق',      'Nut',         'lucide', NULL, 11, true, false),
  ('Çay',          'Specialty Crops',     'kg',  'Çay',           'Tea',          'الشاي',       'Leaf',        'lucide', NULL, 12, true, false),
  ('Tütün',        'Specialty Crops',     'kg',  'Tütün',         'Tobacco',      'التبغ',       'Leaf',        'lucide', NULL, 13, true, false),
  ('Üzüm',         'Specialty Crops',     'ton', 'Üzüm',          'Grapes',       'العنب',       'Grape',       'lucide', NULL, 14, true, false),
  ('İncir',        'Specialty Crops',     'ton', 'İncir',         'Figs',         'التين',       'Flower',      'lucide', NULL, 15, true, false),
  ('Narenciye',    'Specialty Crops',     'ton', 'Narenciye',     'Citrus',       'الحمضيات',    'Citrus',      'lucide', NULL, 16, true, false),
  ('Şeker Pancarı','Grain & Field Crops', 'ton', 'Şeker Pancarı', 'Sugar Beet',   'البنجر السكري', 'Carrot',    'lucide', NULL, 17, true, false)
ON CONFLICT (commodity_name) DO NOTHING;
