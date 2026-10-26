/*
# Add auto-translation columns to jobs table

1. Purpose
   When a job is posted in one language (e.g. Turkish), viewers browsing in
   another language (English or Arabic) should see the title, description,
   location, and requirements translated into their language — with a
   disclosure note showing the original posting language.

2. Changes
   - Add nullable columns: title_tr, title_en, title_ar,
     description_tr, description_en, description_ar,
     location_tr, location_en, location_ar,
     requirements_tr (text[]), requirements_en (text[]), requirements_ar (text[])
   - Backfill the column matching the poster's `language` field from the
     existing `title`/`description`/`location`/`requirements` values so no
     data is lost.
   - No RLS or grant changes needed — these are on an existing table with
     existing policies.

3. Notes
   - All new columns are nullable so existing rows and inserts work fine.
   - The backfill uses the `language` column (values 'tr', 'en', 'ar') to
     populate the matching translation column from the base column.
*/

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS title_tr text,
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS title_ar text,
  ADD COLUMN IF NOT EXISTS description_tr text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS description_ar text,
  ADD COLUMN IF NOT EXISTS location_tr text,
  ADD COLUMN IF NOT EXISTS location_en text,
  ADD COLUMN IF NOT EXISTS location_ar text,
  ADD COLUMN IF NOT EXISTS requirements_tr text[],
  ADD COLUMN IF NOT EXISTS requirements_en text[],
  ADD COLUMN IF NOT EXISTS requirements_ar text[];

-- Backfill: copy base fields into the column matching the job's language
UPDATE jobs SET title_tr = title WHERE language = 'tr' AND title_tr IS NULL;
UPDATE jobs SET title_en = title WHERE language = 'en' AND title_en IS NULL;
UPDATE jobs SET title_ar = title WHERE language = 'ar' AND title_ar IS NULL;

UPDATE jobs SET description_tr = description WHERE language = 'tr' AND description_tr IS NULL;
UPDATE jobs SET description_en = description WHERE language = 'en' AND description_en IS NULL;
UPDATE jobs SET description_ar = description WHERE language = 'ar' AND description_ar IS NULL;

UPDATE jobs SET location_tr = location WHERE language = 'tr' AND location_tr IS NULL;
UPDATE jobs SET location_en = location WHERE language = 'en' AND location_en IS NULL;
UPDATE jobs SET location_ar = location WHERE language = 'ar' AND location_ar IS NULL;

UPDATE jobs SET requirements_tr = requirements WHERE language = 'tr' AND requirements_tr IS NULL;
UPDATE jobs SET requirements_en = requirements WHERE language = 'en' AND requirements_en IS NULL;
UPDATE jobs SET requirements_ar = requirements WHERE language = 'ar' AND requirements_ar IS NULL;
