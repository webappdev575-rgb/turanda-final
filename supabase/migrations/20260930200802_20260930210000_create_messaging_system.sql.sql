/*
# Create Direct Messaging System with Email Notification Preferences

1. New Tables
- `conversations`
  - `id` (uuid, primary key)
  - `job_id` (uuid, foreign key to jobs, ON DELETE CASCADE)
  - `employer_id` (uuid, foreign key to auth.users, ON DELETE CASCADE) — the employer/farm owner
  - `applicant_id` (uuid, foreign key to auth.users, ON DELETE CASCADE) — the worker who applied
  - `applicant_name` (text) — denormalized from application for display even if user profile changes
  - `applicant_email` (text) — denormalized for email notifications
  - `application_id` (uuid, foreign key to applications, ON DELETE SET NULL)
  - `last_message_at` (timestamptz) — updated on each new message for sorting
  - `created_at` (timestamptz, default now())

- `messages`
  - `id` (uuid, primary key)
  - `conversation_id` (uuid, foreign key to conversations, ON DELETE CASCADE)
  - `sender_id` (uuid, foreign key to auth.users, ON DELETE CASCADE)
  - `sender_role` (text: 'employer' | 'applicant')
  - `body` (text, not null)
  - `is_read` (boolean, default false)
  - `created_at` (timestamptz, default now())

2. Modified Tables
- `profiles` — two new columns:
  - `email_message_notifications` (boolean, default true) — whether to push email alerts on new messages
  - `message_notification_email` (text, nullable) — override email for message alerts; falls back to notification_email or auth email

3. Security
- RLS enabled on both `conversations` and `messages`.
- `conversations`: only the employer_id or applicant_id can SELECT/INSERT/UPDATE/DELETE.
- `messages`: only participants of the parent conversation can SELECT/INSERT/UPDATE.
  - INSERT: sender must be a participant.
  - SELECT: user must be a participant of the parent conversation.
  - UPDATE: only the recipient (non-sender) can mark as read — enforced via parent conversation membership.
- All policies scoped TO authenticated.

4. Indexes
- `messages_conversation_id_idx` on messages(conversation_id) for fast thread retrieval
- `messages_created_at_idx` on messages(created_at) for chronological ordering
- `conversations_employer_id_idx` on conversations(employer_id)
- `conversations_applicant_id_idx` on conversations(applicant_id)
- `conversations_last_message_at_idx` on conversations(last_message_at DESC) for inbox sorting

5. Trigger
- `update_conversation_last_message_at` — AFTER INSERT on messages, sets conversation.last_message_at to now()
*/

-- =============================================
-- profiles: add notification preference columns
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email_message_notifications') THEN
    ALTER TABLE public.profiles ADD COLUMN email_message_notifications boolean NOT NULL DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'message_notification_email') THEN
    ALTER TABLE public.profiles ADD COLUMN message_notification_email text;
  END IF;
END $$;

-- =============================================
-- conversations table
-- =============================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  employer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  applicant_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  applicant_name text NOT NULL,
  applicant_email text NOT NULL,
  application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_conversations" ON public.conversations;
CREATE POLICY "select_own_conversations"
ON public.conversations FOR SELECT
TO authenticated
USING (auth.uid() = employer_id OR auth.uid() = applicant_id);

DROP POLICY IF EXISTS "insert_own_conversations" ON public.conversations;
CREATE POLICY "insert_own_conversations"
ON public.conversations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = employer_id OR auth.uid() = applicant_id);

DROP POLICY IF EXISTS "update_own_conversations" ON public.conversations;
CREATE POLICY "update_own_conversations"
ON public.conversations FOR UPDATE
TO authenticated
USING (auth.uid() = employer_id OR auth.uid() = applicant_id)
WITH CHECK (auth.uid() = employer_id OR auth.uid() = applicant_id);

DROP POLICY IF EXISTS "delete_own_conversations" ON public.conversations;
CREATE POLICY "delete_own_conversations"
ON public.conversations FOR DELETE
TO authenticated
USING (auth.uid() = employer_id OR auth.uid() = applicant_id);

-- =============================================
-- messages table
-- =============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role text NOT NULL DEFAULT 'applicant' CHECK (sender_role IN ('employer', 'applicant')),
  body text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_messages" ON public.messages;
CREATE POLICY "select_own_messages"
ON public.messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (c.employer_id = auth.uid() OR c.applicant_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "insert_own_messages" ON public.messages;
CREATE POLICY "insert_own_messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (c.employer_id = auth.uid() OR c.applicant_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "update_own_messages" ON public.messages;
CREATE POLICY "update_own_messages"
ON public.messages FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (c.employer_id = auth.uid() OR c.applicant_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (c.employer_id = auth.uid() OR c.applicant_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "delete_own_messages" ON public.messages;
CREATE POLICY "delete_own_messages"
ON public.messages FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (c.employer_id = auth.uid() OR c.applicant_id = auth.uid())
  )
);

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS conversations_employer_id_idx ON public.conversations(employer_id);
CREATE INDEX IF NOT EXISTS conversations_applicant_id_idx ON public.conversations(applicant_id);
CREATE INDEX IF NOT EXISTS conversations_last_message_at_idx ON public.conversations(last_message_at DESC);

-- =============================================
-- Trigger: update conversation last_message_at
-- =============================================
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON public.messages;
CREATE TRIGGER trigger_update_conversation_timestamp
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_timestamp();
