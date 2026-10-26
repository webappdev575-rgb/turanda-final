/*
# Language-Aware Jobs, Akademi Content Module, and Email Notifications

## Overview
This migration adds three major platform features:
1. Language tagging for job postings so Arabic/English speakers see same-language listings ranked first
2. Full Akademi course library with lessons, enrollments, and progress tracking
3. Email notification system with a notifications outbox table for Resend integration

## Changes to Existing Tables

### jobs table
- ADD COLUMN `language` text NOT NULL DEFAULT 'tr' — stores which language the posting was written in ('tr', 'en', 'ar')
- Add index on language for filtering

### profiles table
- ADD COLUMN `preferred_language` text NOT NULL DEFAULT 'tr' — controls which language notification emails are sent in
- ADD COLUMN `notification_email` text — optional override email for notifications (falls back to auth email if null)

## New Tables

### academy_courses
- `id` (uuid, pk)
- `title` (text, not null)
- `description` (text, not null)
- `category` (text, not null) — e.g. 'Crop Management', 'Livestock', 'Machinery', 'Irrigation', 'General'
- `difficulty` (text, not null, default 'beginner') — 'beginner', 'intermediate', 'advanced'
- `thumbnail_url` (text) — course card image
- `estimated_minutes` (int, default 0) — total estimated duration across all lessons
- `instructor_name` (text) — name of the instructor/creator
- `is_published` (boolean, default false) — only published courses show on the public site
- `sort_order` (int, default 0) — for admin-controlled ordering
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### academy_lessons
- `id` (uuid, pk)
- `course_id` (uuid, fk to academy_courses ON DELETE CASCADE)
- `title` (text, not null)
- `description` (text)
- `video_url` (text) — for video lessons (YouTube, Vimeo, or direct URL)
- `content` (text) — for article lessons (formatted text content)
- `lesson_type` (text, not null, default 'video') — 'video' or 'article'
- `duration_minutes` (int, default 0)
- `sort_order` (int, default 0) — lesson order within a course
- `is_published` (boolean, default false)
- `created_at` (timestamptz, default now())

### academy_enrollments
- `id` (uuid, pk)
- `user_id` (uuid, fk to auth.users ON DELETE CASCADE)
- `course_id` (uuid, fk to academy_courses ON DELETE CASCADE)
- `progress` (int, default 0) — 0-100 percentage
- `completed_lessons` (int[], default '{}') — array of lesson IDs completed
- `enrolled_at` (timestamptz, default now())
- `last_accessed_at` (timestamptz, default now())
- UNIQUE(user_id, course_id) — one enrollment per user per course

### notifications
- `id` (uuid, pk)
- `recipient_email` (text, not null)
- `recipient_name` (text)
- `notification_type` (text, not null) — 'job_application', 'application_status'
- `subject` (text, not null)
- `body` (text, not null)
- `related_job_id` (uuid, fk to jobs ON DELETE SET NULL)
- `related_application_id` (uuid, fk to applications ON DELETE SET NULL)
- `status` (text, not null, default 'pending') — 'pending', 'sent', 'failed'
- `sent_at` (timestamptz)
- `error_message` (text)
- `created_at` (timestamptz, default now())

## Security (RLS)
- academy_courses: public read (anon + authenticated), admin-only write
- academy_lessons: public read (anon + authenticated), admin-only write
- academy_enrollments: owner-only CRUD (user_id = auth.uid())
- notifications: admin-only read (contains recipient emails and notification content)
- jobs.language: no new policies needed (existing policies cover the new column)
- profiles: existing policies cover the new columns

## Indexes
- idx_academy_lessons_course_id on academy_lessons(course_id)
- idx_academy_enrollments_user_course on academy_enrollments(user_id, course_id)
- idx_notifications_status on notifications(status, notification_type)
- idx_jobs_language on jobs(language)

## Notes
1. The notifications table serves as an outbox/audit log. The send-notification edge function reads pending records, sends via Resend, and updates status.
2. Academy courses default to is_published=false so admins can prepare content before going live.
3. The UNIQUE constraint on academy_enrollments prevents duplicate enrollments.
4. Admin authorization for academy tables uses profiles.is_admin, matching the existing pattern from academy_tiles.
*/
-- ============================================================
-- 1. Add columns to existing tables
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'language') THEN
    ALTER TABLE jobs ADD COLUMN language text NOT NULL DEFAULT 'tr';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferred_language') THEN
    ALTER TABLE profiles ADD COLUMN preferred_language text NOT NULL DEFAULT 'tr';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'notification_email') THEN
    ALTER TABLE profiles ADD COLUMN notification_email text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_jobs_language ON jobs(language);

-- ============================================================
-- 2. academy_courses table
-- ============================================================

CREATE TABLE IF NOT EXISTS academy_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  difficulty text NOT NULL DEFAULT 'beginner',
  thumbnail_url text,
  estimated_minutes integer NOT NULL DEFAULT 0,
  instructor_name text,
  is_published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE academy_courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_academy_courses" ON academy_courses;
CREATE POLICY "anon_read_academy_courses" ON academy_courses FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_academy_courses" ON academy_courses;
CREATE POLICY "admin_insert_academy_courses" ON academy_courses FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "admin_update_academy_courses" ON academy_courses;
CREATE POLICY "admin_update_academy_courses" ON academy_courses FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "admin_delete_academy_courses" ON academy_courses;
CREATE POLICY "admin_delete_academy_courses" ON academy_courses FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- ============================================================
-- 3. academy_lessons table
-- ============================================================

CREATE TABLE IF NOT EXISTS academy_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  video_url text,
  content text,
  lesson_type text NOT NULL DEFAULT 'video',
  duration_minutes integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE academy_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_academy_lessons" ON academy_lessons;
CREATE POLICY "anon_read_academy_lessons" ON academy_lessons FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_academy_lessons" ON academy_lessons;
CREATE POLICY "admin_insert_academy_lessons" ON academy_lessons FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "admin_update_academy_lessons" ON academy_lessons;
CREATE POLICY "admin_update_academy_lessons" ON academy_lessons FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "admin_delete_academy_lessons" ON academy_lessons;
CREATE POLICY "admin_delete_academy_lessons" ON academy_lessons FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE INDEX IF NOT EXISTS idx_academy_lessons_course_id ON academy_lessons(course_id);

-- ============================================================
-- 4. academy_enrollments table
-- ============================================================

CREATE TABLE IF NOT EXISTS academy_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
  progress integer NOT NULL DEFAULT 0,
  completed_lessons integer[] NOT NULL DEFAULT '{}',
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE academy_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_enrollments" ON academy_enrollments;
CREATE POLICY "select_own_enrollments" ON academy_enrollments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_enrollments" ON academy_enrollments;
CREATE POLICY "insert_own_enrollments" ON academy_enrollments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_enrollments" ON academy_enrollments;
CREATE POLICY "update_own_enrollments" ON academy_enrollments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_enrollments" ON academy_enrollments;
CREATE POLICY "delete_own_enrollments" ON academy_enrollments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_academy_enrollments_user_course ON academy_enrollments(user_id, course_id);

-- ============================================================
-- 5. notifications table
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  recipient_name text,
  notification_type text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  related_job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  related_application_id uuid REFERENCES applications(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_notifications" ON notifications;
CREATE POLICY "admin_read_notifications" ON notifications FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "admin_insert_notifications" ON notifications;
CREATE POLICY "admin_insert_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "anon_insert_notifications" ON notifications;
CREATE POLICY "anon_insert_notifications" ON notifications FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_notifications" ON notifications;
CREATE POLICY "admin_update_notifications" ON notifications FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "edge_fn_update_notifications" ON notifications;
CREATE POLICY "edge_fn_update_notifications" ON notifications FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status, notification_type);

-- ============================================================
-- 6. Seed a few sample courses (unpublished so admin can review)
-- ============================================================

INSERT INTO academy_courses (title, description, category, difficulty, estimated_minutes, instructor_name, is_published, sort_order)
VALUES
  ('Modern Sulama Teknikleri', 'Damla sulama, yağmurlama ve sensörlü sulama sistemleri hakkında kapsamlı eğitim.', 'Irrigation', 'beginner', 120, 'Turanda Akademi', false, 1),
  ('Tarım Makineleri Güvenliği', 'Traktör, biçerdöver ve diğer tarım makinelerinin güvenli kullanımı.', 'Machinery', 'intermediate', 90, 'Turanda Akademi', false, 2),
  ('Hayvancılıkta Besleme Yönetimi', 'Büyükbaş ve küçükbaş hayvanlarda besleme, mera yönetimi ve sağlıklı sürü uygulamaları.', 'Livestock', 'intermediate', 150, 'Turanda Akademi', false, 3)
ON CONFLICT DO NOTHING;
