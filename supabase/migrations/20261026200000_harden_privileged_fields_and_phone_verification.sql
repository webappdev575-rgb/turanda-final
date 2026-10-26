-- Service-side verification owns privilege, payment, and verification fields.
BEGIN;

CREATE OR REPLACE FUNCTION public.guard_profile_privileges() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE email_confirmed boolean; phone_confirmed boolean;
BEGIN
  IF auth.role() = 'service_role' OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true AND is_banned = false
  ) THEN RETURN NEW; END IF;
  -- Preserve email/native-phone verification using Auth's authoritative records,
  -- never the browser's claim that a verification operation succeeded.
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.id AND email_confirmed_at IS NOT NULL),
         EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.id AND phone_confirmed_at IS NOT NULL
                 AND ltrim(phone, '+') = ltrim(NEW.phone, '+'))
  INTO email_confirmed, phone_confirmed;
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_admin OR NEW.is_moderator OR NEW.is_editor OR NEW.is_banned OR
       (NEW.phone_verified AND NOT phone_confirmed) OR
       (NEW.is_verified AND NOT (email_confirmed OR phone_confirmed)) THEN
      RAISE EXCEPTION 'Privileged profile fields are server-managed' USING ERRCODE = '42501';
    END IF;
    NEW.phone_verified := phone_confirmed;
    NEW.is_verified := email_confirmed OR phone_confirmed;
  ELSE
    IF (NEW.is_admin, NEW.is_moderator, NEW.is_editor, NEW.is_banned) IS DISTINCT FROM
       (OLD.is_admin, OLD.is_moderator, OLD.is_editor, OLD.is_banned) OR
       (NEW.phone_verified IS DISTINCT FROM OLD.phone_verified AND NOT (NEW.phone_verified AND phone_confirmed)) OR
       (NEW.is_verified IS DISTINCT FROM OLD.is_verified AND NOT (NEW.is_verified AND (email_confirmed OR phone_confirmed))) THEN
      RAISE EXCEPTION 'Privileged profile fields are server-managed' USING ERRCODE = '42501';
    END IF;
    IF NEW.phone IS DISTINCT FROM OLD.phone THEN
      NEW.phone_verified := phone_confirmed;
      NEW.is_verified := email_confirmed OR phone_confirmed;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_profile_privileges() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER guard_profile_privileges BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileges();

-- Restore only editable profile columns; verification remains server-managed.
GRANT UPDATE (full_name, user_type, city, region, latitude, longitude,
  preferred_language, notification_email, onboarded, farm_name, preferred_regions,
  preferred_jobs, experience_level, primary_crops, phone, weather_location,
  email_message_notifications, message_notification_email, employer_message, updated_at)
ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.sync_auth_profile_verification() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL OR (NEW.phone_confirmed_at IS NOT NULL AND NEW.phone <> '') THEN
    UPDATE public.profiles SET
      is_verified = true,
      phone = CASE WHEN NEW.phone_confirmed_at IS NOT NULL AND NEW.phone <> ''
        THEN '+' || ltrim(NEW.phone, '+') ELSE phone END,
      phone_verified = CASE WHEN NEW.phone_confirmed_at IS NOT NULL AND NEW.phone <> ''
        THEN true ELSE phone_verified END,
      updated_at = now()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_auth_profile_verification() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER sync_auth_profile_verification
AFTER INSERT OR UPDATE OF email_confirmed_at, phone_confirmed_at, phone ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.sync_auth_profile_verification();
-- Preserve already-confirmed accounts even when the former browser update failed.
UPDATE public.profiles p SET is_verified = true
FROM auth.users u WHERE u.id = p.id AND u.email_confirmed_at IS NOT NULL AND NOT p.is_verified;

CREATE OR REPLACE FUNCTION public.guard_job_payment_fields() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.role() = 'service_role' OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true AND is_banned = false
  ) THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_featured OR NEW.featured_tier <> 'standard' OR NEW.featured_until IS NOT NULL OR NEW.payment_status <> 'free' THEN
      RAISE EXCEPTION 'Paid listing fields are server-managed' USING ERRCODE = '42501';
    END IF;
  ELSIF (NEW.is_featured, NEW.featured_tier, NEW.featured_until, NEW.payment_status) IS DISTINCT FROM
        (OLD.is_featured, OLD.featured_tier, OLD.featured_until, OLD.payment_status) THEN
    RAISE EXCEPTION 'Paid listing fields are server-managed' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_job_payment_fields() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER guard_job_payment_fields BEFORE INSERT OR UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.guard_job_payment_fields();

CREATE OR REPLACE FUNCTION public.issue_phone_verification_code(p_phone text, p_code_hash text, p_user_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Serialize issuance by both caller and phone to enforce limits under concurrency.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  PERFORM pg_advisory_xact_lock(hashtextextended(p_phone, 1));
  IF EXISTS (SELECT 1 FROM public.phone_verification_codes
     WHERE (phone = p_phone OR user_id = p_user_id) AND created_at > now() - interval '60 seconds') THEN
    RETURN 'cooldown';
  END IF;
  IF (SELECT count(*) FROM public.phone_verification_codes
      WHERE (phone = p_phone OR user_id = p_user_id) AND created_at > now() - interval '1 hour') >= 5 THEN
    RETURN 'rate_limited';
  END IF;
  INSERT INTO public.phone_verification_codes(phone, code_hash, user_id, expires_at)
  VALUES (p_phone, p_code_hash, p_user_id, now() + interval '10 minutes');
  RETURN 'sent';
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_phone_verification_code(p_phone text, p_code_hash text, p_user_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE code public.phone_verification_codes%ROWTYPE;
BEGIN
  SELECT * INTO code FROM public.phone_verification_codes
  WHERE phone = p_phone AND user_id = p_user_id ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RETURN 'no_code'; END IF;
  IF code.consumed_at IS NOT NULL THEN RETURN 'already_used'; END IF;
  IF code.expires_at <= now() THEN RETURN 'expired'; END IF;
  IF code.attempts >= 5 THEN RETURN 'too_many_attempts'; END IF;
  IF code.code_hash <> p_code_hash THEN
    UPDATE public.phone_verification_codes SET attempts = attempts + 1 WHERE id = code.id;
    RETURN 'wrong_code';
  END IF;
  UPDATE public.phone_verification_codes SET consumed_at = now() WHERE id = code.id;
  UPDATE public.profiles SET phone = p_phone, phone_verified = true, is_verified = true, updated_at = now()
  WHERE id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile missing'; END IF;
  RETURN 'verified';
END;
$$;
REVOKE ALL ON FUNCTION public.issue_phone_verification_code(text, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.verify_phone_verification_code(text, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.issue_phone_verification_code(text, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_phone_verification_code(text, text, uuid) TO service_role;
CREATE INDEX IF NOT EXISTS idx_phone_codes_user_created ON public.phone_verification_codes(user_id, created_at DESC);
COMMIT;
