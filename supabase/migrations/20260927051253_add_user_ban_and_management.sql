-- Add is_banned column to profiles for admin ban control
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false;

-- SECURITY DEFINER function: admin can toggle ban status on any user
CREATE OR REPLACE FUNCTION set_user_ban_status(p_user_id uuid, p_is_banned boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE profiles SET is_banned = p_is_banned, updated_at = now() WHERE id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION set_user_ban_status FROM anon;
GRANT EXECUTE ON FUNCTION set_user_ban_status TO authenticated;

-- Allow authenticated users to read profiles (for admin user management)
-- Already covered by existing SELECT policy if present; ensure it
DROP POLICY IF EXISTS "authenticated_read_profiles" ON profiles;
CREATE POLICY "authenticated_read_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);

-- Admin can update any profile's is_admin and is_banned via the SECURITY DEFINER functions
-- Regular users can still update their own profile (non-privileged columns only)
