/*
# Add moderator role and post management permissions

1. Modified Tables
- `profiles`: adds `is_moderator` (boolean, default false) — flags trusted team members who can manage news posts and announcements without full admin rights.

2. New Functions
- `set_moderator_status(p_user_id uuid, p_is_moderator boolean)` — SECURITY DEFINER; only callable by admins (checked against profiles.is_admin). Sets or clears another user's moderator flag.

3. Security Changes
- Enable RLS policies on `news_articles` for INSERT, UPDATE, DELETE restricted to authenticated users who are admins or moderators and not banned. Existing public read access is unchanged.
- Grant the new function EXECUTE to `authenticated` only; revoked from PUBLIC and anon.
- Grant INSERT/UPDATE/DELETE on `news_articles` to `authenticated` so moderators and admins can write through the Data API (RLS still restricts rows).

4. Important Notes
- Admins and moderators who are banned lose write access immediately (checked in every policy).
- Regular users remain read-only on news articles.
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_moderator boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION set_moderator_status(p_user_id uuid, p_is_moderator boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE profiles SET is_moderator = p_is_moderator, updated_at = now() WHERE id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION set_moderator_status(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION set_moderator_status(uuid, boolean) TO authenticated;

GRANT INSERT, UPDATE, DELETE ON news_articles TO authenticated;

DROP POLICY IF EXISTS "staff_insert_news" ON news_articles;
CREATE POLICY "staff_insert_news" ON news_articles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_banned = false
        AND (profiles.is_admin = true OR profiles.is_moderator = true)
    )
  );

DROP POLICY IF EXISTS "staff_update_news" ON news_articles;
CREATE POLICY "staff_update_news" ON news_articles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_banned = false
        AND (profiles.is_admin = true OR profiles.is_moderator = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_banned = false
        AND (profiles.is_admin = true OR profiles.is_moderator = true)
    )
  );

DROP POLICY IF EXISTS "staff_delete_news" ON news_articles;
CREATE POLICY "staff_delete_news" ON news_articles
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_banned = false
        AND (profiles.is_admin = true OR profiles.is_moderator = true)
    )
  );
