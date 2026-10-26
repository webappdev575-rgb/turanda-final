/*
# Add min_price / max_price columns to commodity_prices

## Overview
Adds nullable min_price and max_price columns to support daily price range data
(min/max/average) from TOBB and other exchange sources. Enables range bar charts
and range band charts.

## Modified Tables
### commodity_prices
- Added min_price (numeric, nullable) -- daily minimum price reported by exchange
- Added max_price (numeric, nullable) -- daily maximum price reported by exchange
- Existing `price` column remains the daily weighted average (settlement) price
- Both columns nullable so existing rows with only average data continue to work

## Indexes
- Partial index on (commodity_name, recorded_date) WHERE min/max IS NOT NULL
  for efficient range-band chart queries
*/