-- Applications become members-only: every application must belong to a signed-in user.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'applicant_id') THEN
    ALTER TABLE applications ADD COLUMN applicant_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Backfill existing applications that match a registered email
UPDATE applications a
SET applicant_id = u.id
FROM auth.users u
WHERE a.applicant_id IS NULL AND u.email = a.applicant_email;

-- Backfill profiles for logged applications that have no account? None — leave NULL allowed for legacy rows.

-- Replace the open insert policy with a members-only one
DROP POLICY IF EXISTS "public_insert_applications" ON applications;
CREATE POLICY "member_insert_applications" ON applications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = applicant_id);

REVOKE INSERT ON applications FROM anon;

-- Saved employer message on the profile
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employer_message text;