/*
# Add is_editor flag to profiles (idempotent re-apply)

1. Modified Tables
- `profiles`: adds `is_editor` (boolean, NOT NULL, default false) — used with `is_admin` / `is_moderator`
  to grant editorial access to the news review queue. Admins toggle this flag per user.

2. Security
- No RLS or policy changes: the column rides on the existing profiles policies.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'is_editor'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_editor boolean NOT NULL DEFAULT false;
  END IF;
END
$$;