/*
# Create crop-media storage bucket

## Overview
Adds a public storage bucket for crop card cover images and hover videos
uploaded from the admin dashboard. Admins can upload files directly;
all visitors can read them.

## New Storage Bucket
- `crop-media` (public) — holds images (png/jpg/webp) and videos (mp4/webm)

## Security
- Public read access for anon + authenticated
- Upload / update / delete restricted to admins (profiles.is_admin = true)
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('crop-media', 'crop-media', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
DROP POLICY IF EXISTS "anon_read_crop_media" ON storage.objects;
CREATE POLICY "anon_read_crop_media"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'crop-media');

-- Admin upload
DROP POLICY IF EXISTS "admin_insert_crop_media" ON storage.objects;
CREATE POLICY "admin_insert_crop_media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'crop-media'
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

-- Admin update
DROP POLICY IF EXISTS "admin_update_crop_media" ON storage.objects;
CREATE POLICY "admin_update_crop_media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'crop-media'
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  )
  WITH CHECK (
    bucket_id = 'crop-media'
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

-- Admin delete
DROP POLICY IF EXISTS "admin_delete_crop_media" ON storage.objects;
CREATE POLICY "admin_delete_crop_media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'crop-media'
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );
