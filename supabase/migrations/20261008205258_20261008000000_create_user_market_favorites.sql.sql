/*
# Create user_market_favorites table

1. Plain-English explanation
- Adds persistent favorites for the commodity markets page: each signed-in user can
  "star" commodities (charts) and regional commodity exchanges. Favorites stay until
  the user removes them. Guests keep favorites in browser cookies only (no server data).

2. New Tables
- `user_market_favorites`
  - `id` (uuid, primary key, auto-generated)
  - `user_id` (uuid, not null, references auth.users, defaults to the signed-in user)
  - `kind` (text, not null): 'commodity' for favorited commodity charts, 'exchange' for favorited regional exchanges
  - `value` (text, not null): the commodity name (e.g. 'Buğday') or exchange id (uuid) as text
  - `created_at` (timestamp with time zone, default now)
  - Unique constraint on (user_id, kind, value) so a favorite can never be duplicated
    (this also makes the guest→account merge idempotent via upsert).

3. Security
- RLS enabled.
- Four owner-scoped policies (select / insert / update / delete), all restricted to
  `authenticated` users: users can only ever read and manage their own favorites.

4. Notes
- No destructive operations. The app already has sign-in, so authenticated-only policies
  are correct; guests use cookies and never touch this table.
- `value` is text (not uuid) so it can hold both commodity names and exchange ids.
*/

CREATE TABLE IF NOT EXISTS public.user_market_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('commodity', 'exchange')),
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, value)
);

CREATE INDEX IF NOT EXISTS idx_user_market_favorites_user ON public.user_market_favorites (user_id, kind);

ALTER TABLE public.user_market_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_market_favorites" ON public.user_market_favorites;
CREATE POLICY "select_own_market_favorites" ON public.user_market_favorites
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_market_favorites" ON public.user_market_favorites;
CREATE POLICY "insert_own_market_favorites" ON public.user_market_favorites
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_market_favorites" ON public.user_market_favorites;
CREATE POLICY "update_own_market_favorites" ON public.user_market_favorites
FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_market_favorites" ON public.user_market_favorites;
CREATE POLICY "delete_own_market_favorites" ON public.user_market_favorites
FOR DELETE TO authenticated
USING (auth.uid() = user_id);
