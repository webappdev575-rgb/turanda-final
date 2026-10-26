/*
# Add preferred job types to profiles

1. New columns
- `profiles.preferred_jobs` (text[]) stores the job categories a worker selects during onboarding.

2. Modified tables
- `profiles` receives one additive nullable column. Existing profile data is unchanged.

3. Security
- No RLS policy changes are required because the existing profiles policies govern access to the row and already cover additive profile fields.

4. Important notes
- The column is nullable so existing accounts remain valid.
- No data is deleted, renamed, or retyped.
*/

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferred_jobs text[];