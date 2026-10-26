/** Validate the JWT with Auth before using the service role for privileged work. */
export async function authorizeStaff(req: Request, roles = ['is_admin']): Promise<boolean> {
  const token = req.headers.get('Authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1];
  const base = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!token || !base || !key) return false;
  if (token === key) return true;
  try {
    const response = await fetch(`${base}/auth/v1/user`, {
      headers: { apikey: Deno.env.get('SUPABASE_ANON_KEY') || key, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return false;
    const user = await response.json();
    if (typeof user.id !== 'string') return false;
    const profileResponse = await fetch(`${base}/rest/v1/profiles?select=is_admin,is_moderator,is_editor,is_banned&id=eq.${encodeURIComponent(user.id)}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!profileResponse.ok) return false;
    const [profile] = await profileResponse.json();
    return !!profile && profile.is_banned !== true && roles.some(role => profile[role] === true);
  } catch {
    return false;
  }
}
