/*
# Min/Max Price Columns — Schema Changes

Adds min_price and max_price to commodity_prices with a partial index
for range chart queries.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'commodity_prices' AND column_name = 'min_price'
  ) THEN
    ALTER TABLE commodity_prices ADD COLUMN min_price numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'commodity_prices' AND column_name = 'max_price'
  ) THEN
    ALTER TABLE commodity_prices ADD COLUMN max_price numeric;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_commodity_prices_range_data
  ON commodity_prices (commodity_name, recorded_date)
  WHERE min_price IS NOT NULL AND max_price IS NOT NULL;