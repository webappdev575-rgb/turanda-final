-- Revoke EXECUTE from PUBLIC on admin-only functions
-- (anon inherits from PUBLIC, so revoking from anon alone isn't enough)
REVOKE EXECUTE ON FUNCTION public.set_admin_status(uuid, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_user_ban_status(uuid, boolean) FROM PUBLIC;

-- increment_ad_click is intentionally public (tracks ad clicks from any site visitor)
-- Keep PUBLIC grant on that one.
