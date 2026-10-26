-- Revoke EXECUTE from PUBLIC on trigger functions (should never be called directly)
REVOKE EXECUTE ON FUNCTION public.update_ad_spaces_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_ad_placements_updated_at() FROM PUBLIC;

-- Also revoke from anon and authenticated for good measure
REVOKE EXECUTE ON FUNCTION public.update_ad_spaces_updated_at() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_ad_spaces_updated_at() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_ad_placements_updated_at() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_ad_placements_updated_at() FROM authenticated;
