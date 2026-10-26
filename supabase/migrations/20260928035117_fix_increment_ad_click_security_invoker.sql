-- Switch increment_ad_click to SECURITY INVOKER (only updates a counter, no elevated privileges needed)
-- This removes it from the SECURITY DEFINER advisor warnings entirely.
DROP FUNCTION IF EXISTS public.increment_ad_click(p_placement_id uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.increment_ad_click(p_placement_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER SET search_path = public
AS $$
BEGIN
  UPDATE public.ad_placements
  SET clicks = clicks + 1
  WHERE id = p_placement_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_ad_click(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_ad_click(uuid) TO authenticated;

-- For SECURITY INVOKER to work, anon needs UPDATE permission on ad_placements for the click column only.
-- Revoke broad UPDATE, grant column-specific UPDATE on just the clicks column.
REVOKE UPDATE ON public.ad_placements FROM anon;
GRANT UPDATE (clicks) ON public.ad_placements TO anon;
