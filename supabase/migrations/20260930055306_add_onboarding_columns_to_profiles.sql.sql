/*
# Add onboarding columns to profiles

## Overview
Adds columns to the profiles table to support the role-based onboarding questionnaire:
- onboarding completion flag
- employer farm/company name
- candidate preferred work regions
- candidate experience level
- employer primary crops/livestock

## 1. Modified Tables

### profiles
- `onboarded` (boolean, default false) — whether the user completed the onboarding questionnaire
- `farm_name` (text, nullable) — employer's farm or company name (separate from per-job farm_name)
- `preferred_regions` (text[], nullable) — candidate's preferred work regions
- `experience_level` (text, nullable) — candidate's experience level: 'beginner' | 'intermediate' | 'experienced'
- `primary_crops` (text[], nullable) — employer's main crops or livestock

## 2. Security
- No RLS policy changes needed — existing policies already allow users to read/update only their own profile row.

## 3. Important Notes
1. All new columns are nullable or have safe defaults so existing profiles are unaffected.
2. The `onboarded` column defaults to false; the frontend sets it to true after the questionnaire is submitted or skipped.
3. No data is lost — this is purely additive.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'onboarded') THEN
    ALTER TABLE profiles ADD COLUMN onboarded boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'farm_name') THEN
    ALTER TABLE profiles ADD COLUMN farm_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferred_regions') THEN
    ALTER TABLE profiles ADD COLUMN preferred_regions text[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'experience_level') THEN
    ALTER TABLE profiles ADD COLUMN experience_level text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'primary_crops') THEN
    ALTER TABLE profiles ADD COLUMN primary_crops text[];
  END IF;
END $$;
