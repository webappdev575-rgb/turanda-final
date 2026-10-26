/*
# Allow users to view their own email notification history

1. Purpose
- The dashboard now shows each signed-in user a "My Alerts" card listing the
  notification emails the platform created for them (new job applications on
  their jobs, application status updates, new message alerts).
- Until now the `notifications` table was readable only by admins.

2. Modified Tables
- `notifications` (no schema change — policy change only)

3. Security changes
- Enable RLS on `notifications` (already enabled, kept idempotent).
- Add a SELECT policy allowing each authenticated user to read only rows whose
  `recipient_email` matches their own auth email.
- The existing admin SELECT policy is kept unchanged so admins still see the
  full log in the admin dashboard.
- No INSERT/UPDATE/DELETE policies are added: users still cannot create,
  modify, or delete notification rows. The existing service-side insert paths
  continue to work (the edge function uses the service role, and the existing
  anon/authenticated insert policy remains untouched).

4. Important notes
- Email comparison is case-insensitive (`lower()` on both sides) because auth
  emails are stored lowercase but display emails may vary in case.
- This policy intentionally exposes delivery status metadata (subject, status,
  timestamps) of the user's own notifications only.
*/

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_notifications" ON notifications;

CREATE POLICY "users_read_own_notifications"
ON notifications FOR SELECT
TO authenticated
USING (
  lower(recipient_email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
);
