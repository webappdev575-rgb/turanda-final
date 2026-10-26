/*
# Add wage_min / wage_max salary range to jobs

1. Modified Tables
- `jobs`
  - Add `wage_min` (numeric, nullable) — optional minimum salary
  - Add `wage_max` (numeric, nullable) — optional maximum salary
  - Alter `wage` to be nullable (was NOT NULL) so jobs without a wage are valid
  - Backfill `wage_min` / `wage_max` from existing `wage` values so no data is lost

2. Important Notes
- The `wage` column is kept for backwards compatibility but is now nullable.
- Existing rows with a non-zero `wage` get both `wage_min` and `wage_max` set to that value.
- Rows with `wage = 0` get both set to NULL (treated as "no wage provided").
- The frontend will write to `wage_min` / `wage_max` and stop writing `wage`.
- No policy or grant changes needed — columns inherit existing table-level grants.
*/

-- Add the new range columns
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS wage_min numeric;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS wage_max numeric;

-- Make the legacy wage column nullable
ALTER TABLE jobs ALTER COLUMN wage DROP NOT NULL;

-- Backfill from existing wage data: non-zero wages become a single-point range
UPDATE jobs SET wage_min = wage, wage_max = wage WHERE wage IS NOT NULL AND wage > 0 AND wage_min IS NULL;

-- Zero wages are treated as "no wage provided"
UPDATE jobs SET wage_min = NULL, wage_max = NULL WHERE wage IS NOT NULL AND wage = 0;
