-- DESTRUCTIVE: use only a new disposable PostgreSQL database.
-- Scope: the ownership migration's legacy participant repair and message access.
\set ON_ERROR_STOP on
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role BYPASSRLS; END IF;
END $$;
CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
  $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS
  $$ SELECT current_setting('request.jwt.claim.role', true) $$;
GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;
CREATE TABLE public.profiles(id uuid PRIMARY KEY, user_type text, is_admin boolean DEFAULT false, is_banned boolean DEFAULT false);
-- Model both verified ownership mappings and ownerless historical jobs.
CREATE TABLE public.jobs(id uuid PRIMARY KEY, status text DEFAULT 'active', employer_id uuid REFERENCES auth.users(id));
CREATE TABLE public.user_documents(id uuid PRIMARY KEY, user_id uuid);
CREATE TABLE public.applications(id uuid PRIMARY KEY, job_id uuid, applicant_id uuid,
  status text DEFAULT 'pending', cv_document_id uuid, cover_letter_document_id uuid);
CREATE TABLE public.conversations(id uuid PRIMARY KEY, job_id uuid, employer_id uuid, applicant_id uuid, application_id uuid);
CREATE TABLE public.messages(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), conversation_id uuid,
  sender_id uuid, sender_role text, body text, is_read boolean DEFAULT false);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.profiles, public.jobs, public.applications, public.user_documents TO authenticated;
GRANT SELECT, UPDATE ON public.conversations TO authenticated;
GRANT INSERT ON public.messages TO authenticated;
CREATE POLICY select_own_conversations ON public.conversations FOR SELECT TO authenticated
  USING (employer_id = auth.uid() OR applicant_id = auth.uid());
CREATE POLICY update_own_conversations ON public.conversations FOR UPDATE TO authenticated
  USING (employer_id = auth.uid() OR applicant_id = auth.uid())
  WITH CHECK (employer_id = auth.uid() OR applicant_id = auth.uid());
CREATE POLICY insert_own_messages ON public.messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND (c.employer_id = auth.uid() OR c.applicant_id = auth.uid())));
INSERT INTO auth.users VALUES ('00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002'), ('00000000-0000-0000-0000-000000000003');
INSERT INTO public.profiles(id, user_type) SELECT id, 'worker' FROM auth.users;
INSERT INTO public.jobs(id, employer_id) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003'),
  ('10000000-0000-0000-0000-000000000003', NULL);
INSERT INTO public.applications(id, job_id, applicant_id) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', NULL),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002'),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002');
INSERT INTO public.conversations(id, job_id, employer_id, application_id, applicant_id) VALUES
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', NULL),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003'),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', NULL),
  ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', NULL, NULL),
  ('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', NULL),
  ('30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', NULL),
  ('30000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', NULL);
\ir ../supabase/migrations/20261026201000_restrict_jobs_and_applications_to_owners.sql
DO $$ BEGIN
  IF (SELECT applicant_id FROM public.conversations WHERE id = '30000000-0000-0000-0000-000000000001') IS DISTINCT FROM '00000000-0000-0000-0000-000000000002'::uuid THEN
    RAISE EXCEPTION 'Linked applicant was not backfilled'; END IF;
  IF (SELECT applicant_id FROM public.conversations WHERE id = '30000000-0000-0000-0000-000000000002') IS DISTINCT FROM '00000000-0000-0000-0000-000000000003'::uuid THEN
    RAISE EXCEPTION 'Existing participant was overwritten'; END IF;
  IF EXISTS (SELECT 1 FROM public.conversations WHERE id NOT IN ('30000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002') AND applicant_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Unverified application/job/employer link was backfilled'; END IF;
END $$;
SET ROLE authenticated;
SET request.jwt.claim.role = 'authenticated';
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.conversations WHERE id = '30000000-0000-0000-0000-000000000001') THEN
    RAISE EXCEPTION 'Backfilled applicant cannot read conversation'; END IF;
  BEGIN
    UPDATE public.conversations SET applicant_id = '00000000-0000-0000-0000-000000000003'
      WHERE id = '30000000-0000-0000-0000-000000000001';
    RAISE EXCEPTION 'Participant reassignment was allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
INSERT INTO public.messages(conversation_id, sender_id, sender_role, body) VALUES
  ('30000000-0000-0000-0000-000000000001', auth.uid(), 'applicant', 'Backfilled applicant reply');
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000003';
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.conversations WHERE id = '30000000-0000-0000-0000-000000000001') THEN
    RAISE EXCEPTION 'Unrelated user can read restored conversation'; END IF;
END $$;
RESET ROLE;
\echo 'Conversation backfill and participant access checks passed.'
