/*
# Add verification and weather columns to profiles

1. New Columns
- `phone` (text, nullable) — stores the user's phone number for SMS verification
- `phone_verified` (boolean, default false) — whether the phone has been verified via SMS OTP
- `is_verified` (boolean, default false) — master verified flag: true when a Google user verifies their phone OR a non-Google user confirms their email
- `weather_location` (text, nullable) — optional custom city name for the navbar weather widget; falls back to profile city coordinates if blank

2. Security
- No RLS policy changes needed; existing profile policies already cover SELECT/INSERT/UPDATE for the owning user.
- The `is_verified` column is user-settable only through the verification flow (phone OTP success or email confirmation detection). There is no database-level enforcement that prevents direct update, but the application code controls when it gets set to true.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE public.profiles ADD COLUMN phone text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone_verified') THEN
    ALTER TABLE public.profiles ADD COLUMN phone_verified boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_verified') THEN
    ALTER TABLE public.profiles ADD COLUMN is_verified boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'weather_location') THEN
    ALTER TABLE public.profiles ADD COLUMN weather_location text;
  END IF;
END $$;