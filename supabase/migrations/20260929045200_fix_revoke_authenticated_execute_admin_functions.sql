/*
# Revoke EXECUTE from authenticated on admin SECURITY DEFINER functions

## Problem
The functions `set_admin_status` and `set_user_ban_status` are SECURITY DEFINER
functions that were callable by any signed-in user via /rest/v1/rpc/. Although
the function bodies contain internal admin checks (RAISE EXCEPTION if caller
is not admin), the functions were still *executable* by the authenticated role,
which is flagged as a security risk.

## Changes
1. Revoke EXECUTE on `set_admin_status(uuid, boolean)` from `authenticated` and `PUBLIC`
2. Revoke EXECUTE on `set_user_ban_status(uuid, boolean)` from `authenticated` and `PUBLIC`
3. Grant EXECUTE to `service_role` only (used by the edge function proxy)
4. Functions remain SECURITY DEFINER with internal admin checks as defense-in-depth

## Impact
Admin users can no longer call these functions directly from the browser.
The admin dashboard now calls the `admin-user-action` edge function, which
verifies admin status and invokes the RPC with the service role key.
*/

REVOKE EXECUTE ON FUNCTION public.set_admin_status(uuid, boolean) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.set_admin_status(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_admin_status(uuid, boolean) TO service_role;

REVOKE EXECUTE ON FUNCTION public.set_user_ban_status(uuid, boolean) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.set_user_ban_status(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_user_ban_status(uuid, boolean) TO service_role;
