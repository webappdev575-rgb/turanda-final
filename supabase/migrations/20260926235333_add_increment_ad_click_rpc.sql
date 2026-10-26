/*
# Add increment_ad_click RPC function

## Overview
Creates a SECURITY DEFINER function to safely increment the click counter on an ad placement.
This prevents clients from directly updating arbitrary columns.

## 1. New Functions
- `increment_ad_click(placement_id uuid)` — increments the clicks column by 1

## 2. Security
- SECURITY DEFINER so it runs with elevated privileges
- Only increments the clicks column, nothing else
*/

CREATE OR REPLACE FUNCTION increment_ad_click(placement_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE ad_placements
  SET clicks = COALESCE(clicks, 0) + 1
  WHERE id = placement_id;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_ad_click(uuid) TO anon, authenticated;
