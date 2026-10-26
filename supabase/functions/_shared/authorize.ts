import { createClient } from "npm:@supabase/supabase-js@2.58.0";

/** Verify caller identity before using a client that bypasses RLS. */
export async function isAuthorizedStaff(req: Request, allowEditorial = false): Promise<boolean> {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceKey && token === serviceKey) return true;

  try {
    const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error } = await client.auth.getUser(token);
    if (error || !user) return false;
    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("is_admin, is_moderator, is_editor, is_banned")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError || !profile || profile.is_banned) return false;
    return profile.is_admin === true || (allowEditorial &&
      (profile.is_moderator === true || profile.is_editor === true));
  } catch {
    return false;
  }
}
