-- Fix 1: Set immutable search_path on all flagged functions
-- and recreate them with the fixed signature.

-- update_ad_spaces_updated_at
DROP FUNCTION IF EXISTS public.update_ad_spaces_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.update_ad_spaces_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- update_ad_placements_updated_at
DROP FUNCTION IF EXISTS public.update_ad_placements_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.update_ad_placements_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- increment_ad_click — public function, intentional anyone-can-call
DROP FUNCTION IF EXISTS public.increment_ad_click(p_placement_id uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.increment_ad_click(p_placement_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.ad_placements
  SET clicks = clicks + 1
  WHERE id = p_placement_id;
END;
$$;

-- Fix 2: Revoke EXECUTE from anon on admin-only SECURITY DEFINER functions
-- These functions have internal admin checks, but anon should never be able to call them.
REVOKE EXECUTE ON FUNCTION public.set_admin_status(uuid, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_user_ban_status(uuid, boolean) FROM anon;

-- increment_ad_click is intentionally public (tracks ad clicks from any visitor)
-- Keep EXECUTE on anon and authenticated

-- Fix 3: Re-grant EXECUTE to authenticated on functions that need it
-- (ensures the grants are explicit after the CASCADE drops above)
GRANT EXECUTE ON FUNCTION public.increment_ad_click(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_ad_click(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_admin_status(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_ban_status(uuid, boolean) TO authenticated;

-- Re-attach triggers that were dropped by CASCADE
DROP TRIGGER IF EXISTS ad_spaces_updated_at ON public.ad_spaces;
CREATE TRIGGER ad_spaces_updated_at
  BEFORE UPDATE ON public.ad_spaces
  FOR EACH ROW EXECUTE FUNCTION public.update_ad_spaces_updated_at();

DROP TRIGGER IF EXISTS ad_placements_updated_at ON public.ad_placements;
CREATE TRIGGER ad_placements_updated_at
  BEFORE UPDATE ON public.ad_placements
  FOR EACH ROW EXECUTE FUNCTION public.update_ad_placements_updated_at();
