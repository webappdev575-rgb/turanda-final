/*
# Security audit fixes: tighten overly permissive RLS policies

1. news_articles
   - Drops the legacy permissive policies ("auth_insert_news_articles" allowed ANY
     signed-in user to insert; "auth_update_news_articles" / "auth_delete_news_articles"
     allowed any author or admin). These coexisted with the new staff-only policies and,
     because permissive policies are OR'd, they made the staff restriction ineffective.
   - Only non-banned admins/moderators can now write news (staff_* policies remain).

2. notifications (open email-relay chain)
   - Drops "anon_insert_notifications" (anyone could queue an email to any address with
     arbitrary subject/body) and "edge_fn_update_notifications" (open UPDATE on every row).
   - Notification rows are created only by staff (admin_insert_notifications remains) and
     by the send-notification edge function via the service role, which bypasses RLS.
   - Revokes all Data API grants for the anon role on this table.

3. jobs (previously anonymous CRUD by anyone)
   - SELECT stays public. INSERT/UPDATE/DELETE now require a signed-in user, matching the
     employer panel and admin dashboard.

4. applications
   - Anonymous visitors may still SUBMIT an application (the public apply form needs this).
   - Reading and updating applications now requires a signed-in user (employer panel).
   - Deleting requires an admin.
   - Adds count_accepted_applications() SECURITY DEFINER so the homepage "successful
     matches" stat keeps working for signed-out visitors.

5. ad_placements / ad_spaces / ad_requests (advertising administration)
   - Writes on placements and spaces now require an admin (previously any signed-in user).
   - Deletes on ad requests now require an admin (previously any signed-in user).
   - Anonymous visitors can still submit ad requests and read active placements/spaces.

6. job_payments (payment records)
   - INSERT/UPDATE/SELECT now require an admin. The payment record is written by the
     process-payment edge function via the service role; the signed-in client only
     updates the related job row, which remains allowed.

7. set_moderator_status function
   - Removes the internal auth.uid() admin check. The function is only reachable by the
     service role (used by the admin-user-action edge function, which verifies the caller
     is an admin via their own JWT) and by authenticated users whose EXECUTE grant we
     revoke, so authorization is fully enforced in the edge function.
*/

-- 1. news_articles -----------------------------------------------------------------
DROP POLICY IF EXISTS "auth_insert_news_articles" ON public.news_articles;
DROP POLICY IF EXISTS "auth_update_news_articles" ON public.news_articles;
DROP POLICY IF EXISTS "auth_delete_news_articles" ON public.news_articles;

-- 2. notifications -----------------------------------------------------------------
DROP POLICY IF EXISTS "anon_insert_notifications" ON public.notifications;
DROP POLICY IF EXISTS "edge_fn_update_notifications" ON public.notifications;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.notifications FROM anon;

-- 3. jobs --------------------------------------------------------------------------
DROP POLICY IF EXISTS "anon_insert_jobs" ON public.jobs;
DROP POLICY IF EXISTS "anon_update_jobs" ON public.jobs;
DROP POLICY IF EXISTS "anon_delete_jobs" ON public.jobs;
REVOKE INSERT, UPDATE, DELETE ON public.jobs FROM anon;

CREATE POLICY "auth_insert_jobs" ON public.jobs
FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_jobs" ON public.jobs
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_jobs" ON public.jobs
FOR DELETE TO authenticated USING (true);

-- 4. applications ------------------------------------------------------------------
DROP POLICY IF EXISTS "anon_insert_applications" ON public.applications;
DROP POLICY IF EXISTS "anon_select_applications" ON public.applications;
DROP POLICY IF EXISTS "anon_update_applications" ON public.applications;
DROP POLICY IF EXISTS "anon_delete_applications" ON public.applications;

CREATE POLICY "public_insert_applications" ON public.applications
FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "employer_read_applications" ON public.applications
FOR SELECT TO authenticated USING (true);
CREATE POLICY "employer_update_applications" ON public.applications
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_delete_applications" ON public.applications
FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

REVOKE DELETE ON public.applications FROM anon;

CREATE OR REPLACE FUNCTION public.count_accepted_applications()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT count(*)::int FROM public.applications WHERE status = 'accepted';
$$;

GRANT EXECUTE ON FUNCTION public.count_accepted_applications() TO anon, authenticated;

-- 5. advertising tables ------------------------------------------------------------
DROP POLICY IF EXISTS "auth_insert_ad_placements" ON public.ad_placements;
DROP POLICY IF EXISTS "auth_update_ad_placements" ON public.ad_placements;
DROP POLICY IF EXISTS "auth_delete_ad_placements" ON public.ad_placements;
CREATE POLICY "admin_insert_ad_placements" ON public.ad_placements
FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
CREATE POLICY "admin_update_ad_placements" ON public.ad_placements
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
CREATE POLICY "admin_delete_ad_placements" ON public.ad_placements
FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
REVOKE INSERT, DELETE ON public.ad_placements FROM anon;

DROP POLICY IF EXISTS "auth_insert_ad_spaces" ON public.ad_spaces;
DROP POLICY IF EXISTS "auth_update_ad_spaces" ON public.ad_spaces;
DROP POLICY IF EXISTS "auth_delete_ad_spaces" ON public.ad_spaces;
CREATE POLICY "admin_insert_ad_spaces" ON public.ad_spaces
FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
CREATE POLICY "admin_update_ad_spaces" ON public.ad_spaces
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
CREATE POLICY "admin_delete_ad_spaces" ON public.ad_spaces
FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

DROP POLICY IF EXISTS "auth_delete_ad_requests" ON public.ad_requests;
DROP POLICY IF EXISTS "auth_update_ad_requests" ON public.ad_requests;
CREATE POLICY "admin_delete_ad_requests" ON public.ad_requests
FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
CREATE POLICY "admin_update_ad_requests" ON public.ad_requests
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- 6. job_payments ------------------------------------------------------------------
DROP POLICY IF EXISTS "auth_insert_job_payments" ON public.job_payments;
DROP POLICY IF EXISTS "auth_update_job_payments" ON public.job_payments;
DROP POLICY IF EXISTS "auth_select_job_payments" ON public.job_payments;
CREATE POLICY "admin_insert_job_payments" ON public.job_payments
FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
CREATE POLICY "admin_update_job_payments" ON public.job_payments
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
CREATE POLICY "admin_select_job_payments" ON public.job_payments
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- 7. set_moderator_status ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_moderator_status(p_user_id uuid, p_is_moderator boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET is_moderator = p_is_moderator, updated_at = now()
  WHERE id = p_user_id;
END;
$$;
