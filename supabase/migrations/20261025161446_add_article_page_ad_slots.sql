/*
# Add article page ad slots

1. New Rows (ad_spaces)
- `article-sidebar-primary` — sidebar, page=article, 300x250, ₺300/mo (matches news sidebar primary pricing).
- `article-sidebar-secondary` — sidebar, page=article, 300x600, ₺400/mo (matches news sidebar secondary pricing).
- `article-inline-1` — inline banner inserted ~1/3 through the article body, 970x120, ₺200/mo (matches jobs inline pricing).
- `article-inline-2` — inline banner inserted ~2/3 through the article body, 970x120, ₺200/mo.

2. Security
- No policy changes: ad_spaces already has public read policies; rows are plain inserts.

3. Notes
- Idempotent: uses WHERE NOT EXISTS so re-running does not duplicate rows.
*/

INSERT INTO ad_spaces (slot, placement, label, width, height, available, price_per_month, page, category)
SELECT v.slot, v.placement, v.label, v.width, v.height, true, v.price, v.page, NULL
FROM (VALUES
  ('article-sidebar-primary', 'sidebar', 'Haber Sayfası Yan Reklam 1', 300, 250, 300, 'article'),
  ('article-sidebar-secondary', 'sidebar', 'Haber Sayfası Yan Reklam 2', 300, 600, 400, 'article'),
  ('article-inline-1', 'inline', 'Haber İçi Yatay Reklam 1', 970, 120, 200, 'article'),
  ('article-inline-2', 'inline', 'Haber İçi Yatay Reklam 2', 970, 120, 200, 'article')
) AS v(slot, placement, label, width, height, price, page)
WHERE NOT EXISTS (SELECT 1 FROM ad_spaces WHERE ad_spaces.slot = v.slot);