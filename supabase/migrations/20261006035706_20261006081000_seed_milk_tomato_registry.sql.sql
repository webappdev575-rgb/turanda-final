INSERT INTO commodity_registry (commodity_name, category, unit, translation_tr, translation_en, translation_ar, icon_name, icon_type, display_order, is_visible, is_featured)
VALUES
  ('İnek Sütü', 'dairy', 'litre', 'İnek Sütü', 'Cow Milk', 'حليب البقر', 'Milk', 'lucide', 18, true, true),
  ('Domates', 'vegetable', 'kg', 'Domates', 'Tomato', 'طماطم', 'Apple', 'lucide', 19, true, true)
ON CONFLICT (commodity_name) DO NOTHING;
