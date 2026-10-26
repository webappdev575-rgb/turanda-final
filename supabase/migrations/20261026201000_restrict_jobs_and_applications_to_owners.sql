-- Intentional access-model change: jobs remain publicly readable; writes and
-- applicant data are scoped to the employer. Legacy jobs stay unowned until an
-- administrator assigns them using a verified ownership mapping.
BEGIN;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS employer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.jobs ALTER COLUMN employer_id SET DEFAULT auth.uid();
CREATE INDEX IF NOT EXISTS idx_jobs_employer_id ON public.jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON public.applications(applicant_id);

CREATE OR REPLACE FUNCTION public.is_active_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true AND is_banned = false);
$$;
REVOKE ALL ON FUNCTION public.is_active_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_admin() TO authenticated, service_role;

DROP POLICY IF EXISTS auth_insert_jobs ON public.jobs;
DROP POLICY IF EXISTS auth_update_jobs ON public.jobs;
DROP POLICY IF EXISTS auth_delete_jobs ON public.jobs;
CREATE POLICY auth_insert_jobs ON public.jobs FOR INSERT TO authenticated WITH CHECK (
  public.is_active_admin() OR (employer_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type IN ('farmer', 'business') AND is_banned = false
  ))
);
CREATE POLICY auth_update_jobs ON public.jobs FOR UPDATE TO authenticated
USING (public.is_active_admin() OR (employer_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_banned = false)))
WITH CHECK (public.is_active_admin() OR employer_id = auth.uid());
CREATE POLICY auth_delete_jobs ON public.jobs FOR DELETE TO authenticated
USING (public.is_active_admin() OR (employer_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_banned = false)));

DROP POLICY IF EXISTS employer_read_applications ON public.applications;
DROP POLICY IF EXISTS employer_update_applications ON public.applications;
DROP POLICY IF EXISTS member_insert_applications ON public.applications;
DROP POLICY IF EXISTS admin_delete_applications ON public.applications;
CREATE POLICY employer_read_applications ON public.applications FOR SELECT TO authenticated USING (
  public.is_active_admin() OR (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_banned = false) AND
    (applicant_id = auth.uid() OR EXISTS (SELECT 1 FROM public.jobs WHERE id = job_id AND employer_id = auth.uid())))
);
CREATE POLICY member_insert_applications ON public.applications FOR INSERT TO authenticated WITH CHECK (
  applicant_id = auth.uid() AND status = 'pending' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_banned = false) AND
  EXISTS (SELECT 1 FROM public.jobs WHERE id = job_id AND status = 'active') AND
  (cv_document_id IS NULL OR EXISTS (SELECT 1 FROM public.user_documents WHERE id = cv_document_id AND user_id = auth.uid())) AND
  (cover_letter_document_id IS NULL OR EXISTS (SELECT 1 FROM public.user_documents WHERE id = cover_letter_document_id AND user_id = auth.uid()))
);
CREATE POLICY employer_update_applications ON public.applications FOR UPDATE TO authenticated
USING (public.is_active_admin() OR (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_banned = false) AND
  EXISTS (SELECT 1 FROM public.jobs WHERE id = job_id AND employer_id = auth.uid())))
WITH CHECK (public.is_active_admin() OR EXISTS (SELECT 1 FROM public.jobs WHERE id = job_id AND employer_id = auth.uid()));
CREATE POLICY admin_delete_applications ON public.applications FOR DELETE TO authenticated USING (public.is_active_admin());

CREATE OR REPLACE FUNCTION public.guard_application_fields() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' AND NOT public.is_active_admin() AND
     (to_jsonb(NEW) - 'status') IS DISTINCT FROM (to_jsonb(OLD) - 'status') THEN
    RAISE EXCEPTION 'Only the application status may be changed' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_application_fields() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER guard_application_fields BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.guard_application_fields();

-- New conversations must refer to the actual job owner and applicant.
DROP POLICY IF EXISTS insert_own_conversations ON public.conversations;
CREATE POLICY insert_own_conversations ON public.conversations FOR INSERT TO authenticated WITH CHECK (
  (employer_id = auth.uid() OR applicant_id = auth.uid()) AND
  EXISTS (SELECT 1 FROM public.applications a JOIN public.jobs j ON j.id = a.job_id
    WHERE a.id = application_id AND j.id = conversations.job_id AND j.employer_id = conversations.employer_id
      AND a.applicant_id = conversations.applicant_id)
);
CREATE OR REPLACE FUNCTION public.guard_conversation_participants() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.role() = 'service_role' OR public.is_active_admin() THEN RETURN NEW; END IF;
  IF (NEW.job_id, NEW.employer_id, NEW.applicant_id, NEW.application_id) IS DISTINCT FROM
     (OLD.job_id, OLD.employer_id, OLD.applicant_id, OLD.application_id) THEN
    RAISE EXCEPTION 'Conversation participants cannot be changed' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_conversation_participants() FROM PUBLIC, anon, authenticated;
-- Repair missing participants only when the application and verified job owner match.
UPDATE public.conversations AS c
SET applicant_id = a.applicant_id
FROM public.applications AS a
WHERE a.id = c.application_id AND c.applicant_id IS NULL AND a.applicant_id IS NOT NULL
  AND a.job_id = c.job_id
  AND EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = c.job_id AND j.employer_id = c.employer_id);
CREATE TRIGGER guard_conversation_participants BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.guard_conversation_participants();
-- The original message contract permits recipients to mark messages as read;
-- participant membership must not allow rewriting another sender's content.
CREATE OR REPLACE FUNCTION public.guard_message_integrity() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.role() = 'service_role' OR public.is_active_admin() THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.sender_id IS DISTINCT FROM auth.uid() OR NOT EXISTS (
      SELECT 1 FROM public.conversations c WHERE c.id = NEW.conversation_id AND
      ((NEW.sender_role = 'employer' AND c.employer_id = auth.uid()) OR
       (NEW.sender_role = 'applicant' AND c.applicant_id = auth.uid()))
    ) THEN RAISE EXCEPTION 'Invalid message sender' USING ERRCODE = '42501'; END IF;
  ELSIF (to_jsonb(NEW) - 'is_read') IS DISTINCT FROM (to_jsonb(OLD) - 'is_read') OR NEW.sender_id = auth.uid() THEN
    RAISE EXCEPTION 'Recipients may only update the read receipt' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_message_integrity() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER guard_message_integrity BEFORE INSERT OR UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.guard_message_integrity();
COMMIT;
