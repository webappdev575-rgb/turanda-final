-- Daily price rows for the last 14 days for the two new staple commodities,
-- spread across the same exchanges as the wheat series.
WITH exchanges AS (
  SELECT exchange_id AS id, row_number() OVER (ORDER BY exchange_id) AS rn
  FROM (SELECT DISTINCT exchange_id FROM commodity_prices WHERE commodity_name = 'Buğday') d
),
days AS (
  SELECT
    gs::date AS day,
    13 - (row_number() OVER (ORDER BY gs) - 1) AS offset_days
  FROM generate_series(
    (current_date - interval '13 days')::date,
    current_date::date,
    interval '1 day'
  ) gs
),
base AS (
  SELECT
    e.id AS exchange_id,
    d.day,
    e.rn,
    (CASE WHEN e.rn = 1 THEN 19.75 WHEN e.rn = 2 THEN 19.40 ELSE 20.10 END
      + sin(extract(epoch from d.day) / 86400.0) * 0.35
      + d.offset_days::numeric * 0.012)::numeric AS milk_price,
    (CASE WHEN e.rn = 1 THEN 28.50 WHEN e.rn = 2 THEN 27.90 ELSE 29.20 END
      + cos(extract(epoch from d.day) / 86400.0) * 0.60
      + d.offset_days::numeric * 0.02)::numeric AS tomato_price
  FROM exchanges e CROSS JOIN days d
),
seeded AS (
  SELECT
    exchange_id,
    day AS recorded_date,
    'İnek Sütü'::text AS commodity_name,
    'dairy'::text AS commodity_category,
    'litre'::text AS unit,
    round(milk_price, 2) AS price,
    ((milk_price / 19.0) - 1) * 100 AS change_pct,
    round(milk_price - 0.45, 2) AS min_price,
    round(milk_price + 0.45, 2) AS max_price
  FROM base
  UNION ALL
  SELECT
    exchange_id,
    day,
    'Domates',
    'vegetable',
    'kg',
    round(tomato_price, 2),
    ((tomato_price / 27.5) - 1) * 100,
    round(tomato_price - 1.20, 2),
    round(tomato_price + 1.20, 2)
  FROM base
)
INSERT INTO commodity_prices (exchange_id, commodity_name, commodity_category, unit, price, currency, change_pct, recorded_date, min_price, max_price)
SELECT exchange_id, commodity_name, commodity_category, unit, price, 'TRY', greatest(least(change_pct, 9), -9), recorded_date, min_price, max_price
FROM seeded
WHERE NOT EXISTS (
  SELECT 1 FROM commodity_prices p
  WHERE p.commodity_name = seeded.commodity_name
    AND p.exchange_id = seeded.exchange_id
    AND p.recorded_date = seeded.recorded_date
);
