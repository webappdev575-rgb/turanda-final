/*
# Phone verification OTP system

1. New Tables
- `phone_verification_codes`: one row per SMS code sent.
  - `id` (uuid, primary key)
  - `phone` (text, not null) — E.164 international number, e.g. +905321234567
  - `user_id` (uuid, null when unauthenticated)
  - `code_hash` (text, not null) — SHA-256 of the 6-digit code, never the code itself
  - `expires_at` (timestamptz, not null) — 10 minutes after send
  - `consumed_at` (timestamptz, null until verified)
  - `attempts` (integer) — failed verification attempts, max 5
  - `created_at` (timestamptz)
2. Indexes
- `idx_phone_codes_phone` on `phone (created_at desc)` for rate limiting / latest-code lookup.
3. Security
- Enable RLS. NO client-facing policies: the browser never reads or writes codes directly.
  The `send-phone-otp` edge function uses the service role, which bypasses RLS.
- The client-side "verified" state is guarded by `profiles.phone_verified`, which only the
  edge function and the user's own profile policy can update.
- Functions `set_phone_verification_code` and `mark_phone_verified` are SECURITY DEFINER but
  callable only by `service_role` (EXECUTE revoked from PUBLIC, anon, authenticated) so the
  edge function can insert codes and flip `profiles.phone_verified` atomically.
4. Notes
- Delivery is pluggable: the edge function writes the code and calls a provider hook
  (Twilio if `TWILIO_*` secrets exist, otherwise dev mode logs/returns it only in preview).
*/

CREATE TABLE IF NOT EXISTS phone_verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_phone_codes_phone ON phone_verification_codes (phone, created_at DESC);

ALTER TABLE phone_verification_codes ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON phone_verification_codes TO service_role;

CREATE OR REPLACE FUNCTION set_phone_verification_code(
  p_phone text,
  p_code_hash text,
  p_user_id uuid,
  p_expires_at timestamptz
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO phone_verification_codes (phone, code_hash, user_id, expires_at)
  VALUES (p_phone, p_code_hash, p_user_id, p_expires_at);
END;
$$;

CREATE OR REPLACE FUNCTION mark_phone_verified(
  p_user_id uuid,
  p_phone text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET phone = p_phone,
      phone_verified = true,
      is_verified = true,
      updated_at = now()
  WHERE id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION set_phone_verification_code(text, text, uuid, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION mark_phone_verified(uuid, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION set_phone_verification_code(text, text, uuid, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION mark_phone_verified(uuid, text) TO service_role;
