-- Preserve the admin-only role contract on INSERT as well as UPDATE. Extend
-- editable profile fields to include onboarding/settings added after the first grant.
REVOKE INSERT, UPDATE ON public.profiles FROM anon, authenticated;
GRANT INSERT (
  id, full_name, user_type, city, region, latitude, longitude, preferred_language,
  notification_email, onboarded, farm_name, preferred_regions, preferred_jobs,
  experience_level, primary_crops, phone, weather_location,
  email_message_notifications, message_notification_email, employer_message, updated_at
) ON public.profiles TO authenticated;
GRANT UPDATE (
  full_name, user_type, city, region, latitude, longitude, preferred_language,
  notification_email, onboarded, farm_name, preferred_regions, preferred_jobs,
  experience_level, primary_crops, phone, weather_location,
  email_message_notifications, message_notification_email, employer_message, updated_at
) ON public.profiles TO authenticated;

-- Derive email verification from Auth and invalidate phone verification on edits.
CREATE OR REPLACE FUNCTION public.sync_profile_verification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.role() IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.phone_verified := false;
    ELSIF NEW.phone IS DISTINCT FROM OLD.phone THEN
      NEW.phone_verified := false;
    END IF;
    NEW.is_verified := NEW.phone_verified OR EXISTS (
      SELECT 1 FROM auth.users WHERE id = NEW.id AND email_confirmed_at IS NOT NULL
    );
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_profile_verification() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS sync_profile_verification ON public.profiles;
CREATE TRIGGER sync_profile_verification BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_verification();

-- The audit migration removed the internal admin check, so enforce the
-- documented service-role-only boundary explicitly for all client roles.
REVOKE ALL ON FUNCTION public.set_moderator_status(uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_moderator_status(uuid, boolean) TO service_role;

-- Serialize sends per phone so simultaneous requests cannot bypass limits.
CREATE OR REPLACE FUNCTION public.set_phone_verification_code(
  p_phone text, p_code_hash text, p_user_id uuid, p_expires_at timestamptz
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_phone));
  IF EXISTS (SELECT 1 FROM public.phone_verification_codes
    WHERE phone = p_phone AND created_at > now() - interval '60 seconds') THEN
    RAISE EXCEPTION 'cooldown';
  END IF;
  IF (SELECT count(*) FROM public.phone_verification_codes
    WHERE phone = p_phone AND created_at > now() - interval '1 hour') >= 5 THEN
    RAISE EXCEPTION 'rate_limited';
  END IF;
  INSERT INTO public.phone_verification_codes (phone, code_hash, user_id, expires_at)
  VALUES (p_phone, p_code_hash, p_user_id, p_expires_at);
END;
$$;
REVOKE ALL ON FUNCTION public.set_phone_verification_code(text, text, uuid, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_phone_verification_code(text, text, uuid, timestamptz) TO service_role;

-- A row lock makes attempt counting, single use, and the profile update atomic.
CREATE OR REPLACE FUNCTION public.verify_phone_verification_code(
  p_user_id uuid, p_phone text, p_code_hash text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  code public.phone_verification_codes%ROWTYPE;
BEGIN
  SELECT * INTO code FROM public.phone_verification_codes
  WHERE phone = p_phone ORDER BY created_at DESC, id DESC LIMIT 1 FOR UPDATE;
  IF NOT FOUND OR (code.user_id IS NOT NULL AND code.user_id <> p_user_id) THEN
    RETURN jsonb_build_object('error', 'no_code');
  END IF;
  IF code.consumed_at IS NOT NULL THEN RETURN jsonb_build_object('error', 'already_used'); END IF;
  IF code.expires_at <= now() THEN RETURN jsonb_build_object('error', 'expired'); END IF;
  IF code.attempts >= 5 THEN RETURN jsonb_build_object('error', 'too_many_attempts'); END IF;
  IF code.code_hash <> p_code_hash THEN
    UPDATE public.phone_verification_codes SET attempts = attempts + 1 WHERE id = code.id;
    RETURN jsonb_build_object('error', 'wrong_code', 'attempts_left', 4 - code.attempts);
  END IF;
  UPDATE public.profiles SET phone = p_phone, phone_verified = true, is_verified = true, updated_at = now()
  WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'profile_not_found'); END IF;
  UPDATE public.phone_verification_codes SET consumed_at = now() WHERE id = code.id;
  RETURN jsonb_build_object('verified', true);
END;
$$;
REVOKE ALL ON FUNCTION public.verify_phone_verification_code(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_phone_verification_code(uuid, text, text) TO service_role;
