/*
# Create user_documents table and add CV/cover letter columns to applications

## Overview
This migration creates a `user_documents` table so users can upload PDF or manually type
CV and cover letter documents linked to their account. It also adds columns to the
`applications` table to reference the CV and cover letter used when applying to a job.
A private storage bucket `user-documents` is created for PDF file uploads.

## 1. New Tables

### user_documents
- `id` (uuid, primary key, auto-generated)
- `user_id` (uuid, not null, defaults to auth.uid(), references auth.users ON DELETE CASCADE)
- `document_type` (text, not null) — 'cv' or 'cover_letter'
- `title` (text, not null) — user-editable file name / label
- `content_method` (text, not null, default 'pdf') — 'pdf' or 'manual'
- `file_path` (text, nullable) — storage path for PDF uploads (e.g. 'user-id/uuid-cv.pdf')
- `manual_text` (text, nullable) — typed-in content for manual documents
- `is_default` (boolean, not null, default false) — marks the user's preferred CV/cover letter
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

## 2. Modified Tables

### applications
- `cv_document_id` (uuid, nullable) — references user_documents(id), the CV used for this application
- `cover_letter_document_id` (uuid, nullable) — references user_documents(id), optional cover letter
- `cv_method` (text, nullable) — 'pdf' or 'manual', which version of CV was used
- `cv_text` (text, nullable) — snapshot of manual CV text at time of application
- `cover_letter_text` (text, nullable) — snapshot of manual cover letter text at time of application

## 3. Storage
- Creates private bucket `user-documents` (public = false) for PDF uploads.
- Storage policies: users can CRUD only their own files (path starts with their user_id).

## 4. Security
- RLS enabled on `user_documents`.
- Owner-scoped CRUD: authenticated users can only select/insert/update/delete their own rows.
- `user_id` defaults to `auth.uid()` so inserts omitting it still work.

## 5. Important Notes
1. All new columns on `applications` are nullable so existing applications are unaffected.
2. The `user_documents` table uses `DEFAULT auth.uid()` on `user_id` for safe client-side inserts.
3. Storage paths use the pattern `{user_id}/{document_id}.pdf` for per-user isolation.
*/

-- 1. Create user_documents table
CREATE TABLE IF NOT EXISTS user_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('cv', 'cover_letter')),
  title text NOT NULL,
  content_method text NOT NULL DEFAULT 'pdf' CHECK (content_method IN ('pdf', 'manual')),
  file_path text,
  manual_text text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for querying a user's documents
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_type ON user_documents(document_type);

-- Enable RLS
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;

-- Owner-scoped CRUD policies
DROP POLICY IF EXISTS "select_own_documents" ON user_documents;
CREATE POLICY "select_own_documents" ON user_documents FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_documents" ON user_documents;
CREATE POLICY "insert_own_documents" ON user_documents FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_documents" ON user_documents;
CREATE POLICY "update_own_documents" ON user_documents FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_documents" ON user_documents;
CREATE POLICY "delete_own_documents" ON user_documents FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 2. Add columns to applications table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'cv_document_id') THEN
    ALTER TABLE applications ADD COLUMN cv_document_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'cover_letter_document_id') THEN
    ALTER TABLE applications ADD COLUMN cover_letter_document_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'cv_method') THEN
    ALTER TABLE applications ADD COLUMN cv_method text CHECK (cv_method IN ('pdf', 'manual'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'cv_text') THEN
    ALTER TABLE applications ADD COLUMN cv_text text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'cover_letter_text') THEN
    ALTER TABLE applications ADD COLUMN cover_letter_text text;
  END IF;
END $$;

-- 3. Create private storage bucket for user documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-documents', 'user-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: users can only access their own files (path starts with their user_id)
DROP POLICY IF EXISTS "users_read_own_documents" ON storage.objects;
CREATE POLICY "users_read_own_documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "users_insert_own_documents" ON storage.objects;
CREATE POLICY "users_insert_own_documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "users_update_own_documents" ON storage.objects;
CREATE POLICY "users_update_own_documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "users_delete_own_documents" ON storage.objects;
CREATE POLICY "users_delete_own_documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);