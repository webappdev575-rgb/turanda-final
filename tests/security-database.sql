-- DESTRUCTIVE TEST FIXTURE: run ONLY in an empty disposable PostgreSQL database.
-- This models the affected pre-change Supabase tables and JWT helpers.
\set ON_ERROR_STOP on
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role BYPASSRLS; END IF;
END $$;
CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY, email_confirmed_at timestamptz, phone text, phone_confirmed_at timestamptz);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
  $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS
  $$ SELECT current_setting('request.jwt.claim.role', true) $$;
GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY, full_name text, phone text, updated_at timestamptz,
  user_type text DEFAULT 'farmer', city text, region text, latitude float, longitude float,
  preferred_language text, notification_email text, onboarded boolean, farm_name text,
  preferred_regions text[], preferred_jobs text[], experience_level text, primary_crops text[],
  weather_location text, email_message_notifications boolean, message_notification_email text, employer_message text,
  is_admin boolean NOT NULL DEFAULT false, is_moderator boolean NOT NULL DEFAULT false,
  is_editor boolean NOT NULL DEFAULT false, is_banned boolean NOT NULL DEFAULT false,
  is_verified boolean NOT NULL DEFAULT false, phone_verified boolean NOT NULL DEFAULT false
);
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text,
  is_featured boolean NOT NULL DEFAULT false, featured_tier text NOT NULL DEFAULT 'standard',
  featured_until timestamptz, payment_status text NOT NULL DEFAULT 'free'
);
CREATE TABLE public.phone_verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), phone text NOT NULL, user_id uuid,
  code_hash text NOT NULL, expires_at timestamptz NOT NULL, consumed_at timestamptz,
  attempts integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.profiles TO authenticated;
GRANT UPDATE(full_name, user_type, city, region, latitude, longitude) ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.jobs TO authenticated;
GRANT ALL ON public.profiles, public.jobs, public.phone_verification_codes TO service_role;
\ir ../supabase/migrations/20261026200000_harden_privileged_fields_and_phone_verification.sql

SET request.jwt.claim.role = 'service_role';
INSERT INTO auth.users(id) VALUES ('00000000-0000-0000-0000-000000000001'), ('00000000-0000-0000-0000-000000000002'), ('00000000-0000-0000-0000-000000000003');
INSERT INTO public.profiles(id, is_admin) VALUES ('00000000-0000-0000-0000-000000000001', true);
INSERT INTO public.profiles(id) VALUES ('00000000-0000-0000-0000-000000000002'), ('00000000-0000-0000-0000-000000000003');
SET ROLE authenticated;
SET request.jwt.claim.role = 'authenticated';
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
UPDATE public.profiles SET full_name = 'Ordinary update', preferred_language = 'tr', updated_at = now() WHERE id = auth.uid();
INSERT INTO public.jobs(title) VALUES ('Free listing');
DO $$ BEGIN
  BEGIN UPDATE public.profiles SET is_admin = true WHERE id = auth.uid(); RAISE EXCEPTION 'admin escalation allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN UPDATE public.profiles SET phone_verified = true WHERE id = auth.uid(); RAISE EXCEPTION 'verification escalation allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN INSERT INTO public.profiles(id, is_editor) VALUES ('00000000-0000-0000-0000-000000000004', true); RAISE EXCEPTION 'insert escalation allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN INSERT INTO public.jobs(title, payment_status) VALUES ('Fake paid', 'paid'); RAISE EXCEPTION 'paid insert allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN UPDATE public.jobs SET is_featured = true; RAISE EXCEPTION 'featured escalation allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.issue_phone_verification_code('+905550000001', 'hash', auth.uid()); RAISE EXCEPTION 'client RPC allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
-- Admin can still manage entitlements, preserving the existing admin workflow.
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
UPDATE public.jobs SET is_featured = true, payment_status = 'paid';
RESET ROLE;
SET ROLE service_role;
SET request.jwt.claim.role = 'service_role';
DO $$ DECLARE result text; BEGIN
  result := public.issue_phone_verification_code('+905550000001', 'good-hash', '00000000-0000-0000-0000-000000000002');
  IF result <> 'sent' THEN RAISE EXCEPTION 'issuance failed: %', result; END IF;
  result := public.issue_phone_verification_code('+905550000002', 'hash', '00000000-0000-0000-0000-000000000002');
  IF result <> 'cooldown' THEN RAISE EXCEPTION 'per-user cooldown missing'; END IF;
  result := public.verify_phone_verification_code('+905550000001', 'good-hash', '00000000-0000-0000-0000-000000000003');
  IF result <> 'no_code' THEN RAISE EXCEPTION 'code was not bound to caller'; END IF;
  result := public.verify_phone_verification_code('+905550000001', 'wrong-hash', '00000000-0000-0000-0000-000000000002');
  IF result <> 'wrong_code' THEN RAISE EXCEPTION 'incorrect code accepted'; END IF;
  result := public.verify_phone_verification_code('+905550000001', 'good-hash', '00000000-0000-0000-0000-000000000002');
  IF result <> 'verified' THEN RAISE EXCEPTION 'valid code failed'; END IF;
  result := public.verify_phone_verification_code('+905550000001', 'good-hash', '00000000-0000-0000-0000-000000000002');
  IF result <> 'already_used' THEN RAISE EXCEPTION 'code replay allowed'; END IF;
  IF NOT (SELECT phone_verified FROM public.profiles WHERE id = '00000000-0000-0000-0000-000000000002') THEN
    RAISE EXCEPTION 'profile verification not committed';
  END IF;
  INSERT INTO public.phone_verification_codes(phone, user_id, code_hash, expires_at, attempts)
  VALUES ('+905550000003', '00000000-0000-0000-0000-000000000003', 'hash', now() + interval '10 minutes', 5);
  result := public.verify_phone_verification_code('+905550000003', 'hash', '00000000-0000-0000-0000-000000000003');
  IF result <> 'too_many_attempts' THEN RAISE EXCEPTION 'attempt limit missing'; END IF;
END $$;
RESET ROLE;
SET ROLE authenticated;
SET request.jwt.claim.role = 'authenticated';
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
UPDATE public.profiles SET phone = '+905550000009' WHERE id = auth.uid();
DO $$ BEGIN
  IF (SELECT phone_verified OR is_verified FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'changing phone retained verification';
  END IF;
END $$;
RESET ROLE;
-- Existing email/native SMS verification paths must remain usable with server proof.
RESET ROLE;
UPDATE auth.users SET email_confirmed_at = now() WHERE id = '00000000-0000-0000-0000-000000000002';
UPDATE auth.users SET phone = '905550000003', phone_confirmed_at = now() WHERE id = '00000000-0000-0000-0000-000000000003';
SET ROLE authenticated;
DO $$ BEGIN IF NOT (SELECT is_verified FROM public.profiles WHERE id = auth.uid()) THEN RAISE EXCEPTION 'Confirmed email verification regressed'; END IF; END $$;
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000003';
DO $$ BEGIN IF NOT (SELECT phone_verified FROM public.profiles WHERE id = auth.uid()) THEN RAISE EXCEPTION 'Native phone verification regressed'; END IF; END $$;
RESET ROLE;
\echo 'Database security regression checks passed.'

-- Model the pre-change ownerless shared-access policies before applying the ownership migration.
INSERT INTO auth.users(id) SELECT id FROM public.profiles ON CONFLICT DO NOTHING;
ALTER TABLE public.jobs ADD COLUMN status text DEFAULT 'active';
CREATE TABLE public.user_documents(id uuid PRIMARY KEY, user_id uuid);
CREATE TABLE public.applications(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), job_id uuid REFERENCES public.jobs(id),
  applicant_id uuid, status text DEFAULT 'pending', applicant_name text,
  cv_document_id uuid, cover_letter_document_id uuid
);
CREATE TABLE public.conversations(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), job_id uuid, employer_id uuid,
  applicant_id uuid, application_id uuid, last_message_at timestamptz
);
CREATE TABLE public.messages(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), conversation_id uuid REFERENCES public.conversations(id),
  sender_id uuid, sender_role text, body text, is_read boolean DEFAULT false
);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs, public.applications, public.conversations TO authenticated;
GRANT SELECT ON public.jobs TO anon;
GRANT SELECT ON public.user_documents TO authenticated;
GRANT ALL ON public.jobs, public.applications, public.conversations TO service_role;
CREATE POLICY anon_select_jobs ON public.jobs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY auth_insert_jobs ON public.jobs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY auth_update_jobs ON public.jobs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY auth_delete_jobs ON public.jobs FOR DELETE TO authenticated USING (true);
CREATE POLICY employer_read_applications ON public.applications FOR SELECT TO authenticated USING (true);
CREATE POLICY employer_update_applications ON public.applications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY member_insert_applications ON public.applications FOR INSERT TO authenticated WITH CHECK (applicant_id = auth.uid());
CREATE POLICY insert_own_conversations ON public.conversations FOR INSERT TO authenticated WITH CHECK (employer_id = auth.uid() OR applicant_id = auth.uid());
CREATE POLICY select_own_conversations ON public.conversations FOR SELECT TO authenticated USING (employer_id = auth.uid() OR applicant_id = auth.uid());
CREATE POLICY update_own_conversations ON public.conversations FOR UPDATE TO authenticated USING (employer_id = auth.uid() OR applicant_id = auth.uid()) WITH CHECK (employer_id = auth.uid() OR applicant_id = auth.uid());
\ir ../supabase/migrations/20261026201000_restrict_jobs_and_applications_to_owners.sql

SET ROLE authenticated;
SET request.jwt.claim.role = 'authenticated';
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
INSERT INTO public.jobs(id, title) VALUES ('10000000-0000-0000-0000-000000000001', 'Owner listing');
UPDATE public.jobs SET title = 'Owner edit' WHERE id = '10000000-0000-0000-0000-000000000001';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.jobs WHERE employer_id = auth.uid() AND title = 'Owner edit') THEN RAISE EXCEPTION 'Owner default/edit failed'; END IF;
  BEGIN INSERT INTO public.jobs(title, employer_id) VALUES ('Forged owner', '00000000-0000-0000-0000-000000000003'); RAISE EXCEPTION 'Forged owner allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000003';
DO $$ DECLARE affected integer; BEGIN
  UPDATE public.jobs SET title = 'Unauthorized edit' WHERE id = '10000000-0000-0000-0000-000000000001';
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN RAISE EXCEPTION 'Unrelated employer edited listing'; END IF;
  DELETE FROM public.jobs WHERE id = '10000000-0000-0000-0000-000000000001';
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN RAISE EXCEPTION 'Unrelated employer deleted listing'; END IF;
END $$;
INSERT INTO public.applications(id, job_id, applicant_id, applicant_name)
VALUES ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', auth.uid(), 'Applicant');
DO $$ DECLARE affected integer; BEGIN
  IF (SELECT count(*) FROM public.applications) <> 1 THEN RAISE EXCEPTION 'Applicant cannot read own application'; END IF;
  UPDATE public.applications SET status = 'accepted'; GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN RAISE EXCEPTION 'Applicant changed decision'; END IF;
END $$;
-- A fourth, unrelated user cannot read this applicant's personal details.
RESET ROLE;
SET request.jwt.claim.role = 'service_role';
INSERT INTO auth.users(id) VALUES ('00000000-0000-0000-0000-000000000004');
INSERT INTO public.profiles(id) VALUES ('00000000-0000-0000-0000-000000000004');
SET ROLE authenticated;
SET request.jwt.claim.role = 'authenticated';
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000004';
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.applications) THEN RAISE EXCEPTION 'Unrelated user read application'; END IF;
END $$;
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
UPDATE public.applications SET status = 'accepted';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.applications WHERE status = 'accepted') THEN RAISE EXCEPTION 'Employer decision failed'; END IF;
  BEGIN UPDATE public.applications SET applicant_name = 'Forged'; RAISE EXCEPTION 'Employer rewrote applicant details'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
INSERT INTO public.conversations(id, job_id, employer_id, applicant_id, application_id)
VALUES ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', auth.uid(), '00000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001');
DO $$ BEGIN
  BEGIN UPDATE public.conversations SET applicant_id = '00000000-0000-0000-0000-000000000004'; RAISE EXCEPTION 'Conversation hijack allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
INSERT INTO public.messages(id, conversation_id, sender_id, sender_role, body)
VALUES ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', auth.uid(), 'employer', 'Original message');
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000003';
DO $$ BEGIN
  BEGIN UPDATE public.messages SET body = 'Forged'; RAISE EXCEPTION 'Recipient rewrote message'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN INSERT INTO public.messages(conversation_id, sender_id, sender_role, body)
    VALUES ('30000000-0000-0000-0000-000000000001', auth.uid(), 'employer', 'Role spoof');
    RAISE EXCEPTION 'Message role spoof allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
UPDATE public.messages SET is_read = true;
DO $$ BEGIN IF NOT (SELECT is_read FROM public.messages LIMIT 1) THEN RAISE EXCEPTION 'Read receipt failed'; END IF; END $$;
RESET ROLE;
SET ROLE anon;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.jobs WHERE title = 'Owner edit') THEN RAISE EXCEPTION 'Public job browsing regressed'; END IF;
END $$;
RESET ROLE;
\echo 'Owner access regression checks passed.'
