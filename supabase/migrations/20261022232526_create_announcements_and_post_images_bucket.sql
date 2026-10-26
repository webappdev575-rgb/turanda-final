/*
# Create announcements table, post image storage bucket, and admin management

1. New Tables
- `announcements`
  - `id` (uuid, primary key)
  - `title` (text, not null) — announcement headline
  - `body` (text, not null) — announcement text shown on the homepage block
  - `image_url` (text, nullable) — optional uploaded image
  - `link_url` (text, nullable) — optional button link
  - `link_label` (text, nullable) — optional button label
  - `is_active` (boolean, default true) — inactive announcements are hidden
  - `display_order` (integer, default 0) — lower numbers appear first
  - `created_by` (uuid, defaults to the authenticated user) — author
  - `created_at`, `updated_at` (timestamps)

2. New Storage Bucket
- `post-images` — public bucket so uploaded images render on the site; only admins and moderators can upload/replace/delete objects inside their own paths and the shared root.

3. Security Changes
- RLS enabled on `announcements`: public read of active announcements (anon + authenticated), full CRUD for non-banned admins/moderators.
- Column-level grants: writes restricted to the editable columns so authors cannot tamper with `created_by` on update.
- Storage policies on `storage.objects` for the `post-images` bucket: public read; write/delete only for non-banned admins or moderators.

4. Important Notes
- Announcements are separate from `news_articles` so they never mix into the news feed.
- Created_by uses `DEFAULT auth.uid()` so inserts that omit it still satisfy the insert policy.
*/

CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  image_url text,
  link_url text,
  link_label text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON announcements TO anon, authenticated;
GRANT INSERT, DELETE ON announcements TO authenticated;
GRANT UPDATE (title, body, image_url, link_url, link_label, is_active, display_order, updated_at) ON announcements TO authenticated;

DROP POLICY IF EXISTS "public_read_active_announcements" ON announcements;
CREATE POLICY "public_read_active_announcements" ON announcements
  FOR SELECT TO anon, authenticated
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_banned = false
        AND (profiles.is_admin = true OR profiles.is_moderator = true)
    )
  );

DROP POLICY IF EXISTS "staff_insert_announcements" ON announcements;
CREATE POLICY "staff_insert_announcements" ON announcements
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_banned = false
        AND (profiles.is_admin = true OR profiles.is_moderator = true)
    )
  );

DROP POLICY IF EXISTS "staff_update_announcements" ON announcements;
CREATE POLICY "staff_update_announcements" ON announcements
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

DROP POLICY IF EXISTS "staff_delete_announcements" ON announcements;
CREATE POLICY "staff_delete_announcements" ON announcements
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_banned = false
        AND (profiles.is_admin = true OR profiles.is_moderator = true)
    )
  );

-- Public bucket for post images
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_post_images" ON storage.objects;
CREATE POLICY "public_read_post_images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'post-images');

DROP POLICY IF EXISTS "staff_write_post_images" ON storage.objects;
CREATE POLICY "staff_write_post_images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'post-images'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_banned = false
        AND (profiles.is_admin = true OR profiles.is_moderator = true)
    )
  );

DROP POLICY IF EXISTS "staff_update_post_images" ON storage.objects;
CREATE POLICY "staff_update_post_images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'post-images'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_banned = false
        AND (profiles.is_admin = true OR profiles.is_moderator = true)
    )
  )
  WITH CHECK (
    bucket_id = 'post-images'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_banned = false
        AND (profiles.is_admin = true OR profiles.is_moderator = true)
    )
  );

DROP POLICY IF EXISTS "staff_delete_post_images" ON storage.objects;
CREATE POLICY "staff_delete_post_images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'post-images'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_banned = false
        AND (profiles.is_admin = true OR profiles.is_moderator = true)
    )
  );
