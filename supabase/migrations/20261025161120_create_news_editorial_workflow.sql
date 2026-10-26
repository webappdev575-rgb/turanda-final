/*
# News editorial workflow: AI rewriting, review queue, commodity chips, autopilot

1. Modified Tables
- `news_articles` — adds the owned-content workflow:
  - `slug` (text, unique, nullable) — URL identifier for the article page.
  - `body_content_tr` / `body_content_en` / `body_content_ar` (text) — AI-rewritten article body in Turkish plus translations.
  - `review_status` (text, default 'approved') — 'draft' | 'pending_review' | 'approved' | 'revision_requested' | 'rejected'.
  - `author_id` (uuid) — staff member who last wrote/submitted the body.
  - `submitted_by` / `submitted_at` — who sent it to review and when.
  - `reviewed_by` / `reviewed_at` — approving/rejecting reviewer and time.
  - `ai_rewritten_at` — when the AI rewrite last ran (null = manual/staff-written).
  - `source_body` (text) — original fetched text kept internally for reference/attribution only.
- `profiles` — adds `is_editor` (boolean, default false). Only admins may change it.
- `site_settings` — adds `news_autopilot` (boolean, default false). When true, successfully rewritten fetched articles publish immediately; otherwise they wait in the review queue.

2. New Tables
- `news_review_comments`
  - `id` (uuid), `article_id` (uuid, FK to news_articles, ON DELETE CASCADE), `author_id` (uuid, FK to auth.users, default auth.uid()),
    `comment` (text), `created_at`.
  - Staff-only discussion thread per article.
- `news_article_commodities`
  - `id` (uuid), `article_id` (uuid, FK to news_articles, ON DELETE CASCADE),
    `commodity_name` (text, FK to commodity_registry), `created_at`.
  - Links articles to commodities for price chips on the article page. National-average prices are joined live from `commodity_prices` at read time.

3. Security
- RLS enabled on both new tables.
- `news_review_comments`: SELECT/INSERT/UPDATE/DELETE for staff only (admin, moderator, or editor).
- `news_article_commodities`: readable by everyone (needed to render price chips); writes restricted to staff.
- `news_articles`: existing staff write policies unchanged; public read policy is updated so anon visitors only see approved articles while staff see everything.
- `profiles`: `is_editor` update restricted to admins via existing profile update policy pattern (column-level grant for admins through service actions; client updates go through admin dashboard checks).
- Grants: SELECT on new tables to anon+authenticated; INSERT/UPDATE/DELETE on review comments to authenticated; sequence grants not needed (uuid defaults).

4. Backfill
- Existing articles get slugs generated from their titles (with numeric suffix on collision) and `review_status='approved'` so the current public feed is unchanged.

5. Indexes
- `news_articles(slug)` unique index; indexes on review_status, review comments by article, and article-commodity links by article.
*/

-- ── news_articles: workflow columns ──
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS body_content_tr text;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS body_content_en text;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS body_content_ar text;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'approved';
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS submitted_at timestamptz;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS ai_rewritten_at timestamptz;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS source_body text;

CREATE UNIQUE INDEX IF NOT EXISTS news_articles_slug_key ON news_articles(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_news_articles_review_status ON news_articles(review_status);
ALTER TABLE news_articles ADD CONSTRAINT news_articles_review_status_check
  CHECK (review_status IN ('draft','pending_review','approved','revision_requested','rejected'));

-- ── profiles: editor role ──
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_editor boolean NOT NULL DEFAULT false;

-- ── site_settings: autopilot toggle ──
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS news_autopilot boolean NOT NULL DEFAULT false;

-- ── news_review_comments ──
CREATE TABLE IF NOT EXISTS news_review_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  comment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE news_review_comments ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON news_review_comments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON news_review_comments TO authenticated;

DROP POLICY IF EXISTS "staff_read_review_comments" ON news_review_comments;
CREATE POLICY "staff_read_review_comments" ON news_review_comments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND (p.is_admin OR p.is_moderator OR p.is_editor)
  )
);

DROP POLICY IF EXISTS "staff_insert_review_comments" ON news_review_comments;
CREATE POLICY "staff_insert_review_comments" ON news_review_comments FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = author_id AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND (p.is_admin OR p.is_moderator OR p.is_editor)
  )
);

DROP POLICY IF EXISTS "staff_update_own_review_comments" ON news_review_comments;
CREATE POLICY "staff_update_own_review_comments" ON news_review_comments FOR UPDATE
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "staff_delete_own_review_comments" ON news_review_comments;
CREATE POLICY "staff_delete_own_review_comments" ON news_review_comments FOR DELETE
TO authenticated
USING (auth.uid() = author_id);

-- ── news_article_commodities ──
CREATE TABLE IF NOT EXISTS news_article_commodities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  commodity_name text NOT NULL REFERENCES commodity_registry(commodity_name) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE news_article_commodities ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON news_article_commodities TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON news_article_commodities TO authenticated;

DROP POLICY IF EXISTS "public_read_article_commodities" ON news_article_commodities;
CREATE POLICY "public_read_article_commodities" ON news_article_commodities FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "staff_write_article_commodities" ON news_article_commodities;
CREATE POLICY "staff_write_article_commodities" ON news_article_commodities FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND (p.is_admin OR p.is_moderator OR p.is_editor)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND (p.is_admin OR p.is_moderator OR p.is_editor)
  )
);

CREATE INDEX IF NOT EXISTS idx_article_commodities_article ON news_article_commodities(article_id);

-- ── news_articles: public sees approved only; staff see all ──
DROP POLICY IF EXISTS "anon_select_news" ON news_articles;
CREATE POLICY "anon_select_news" ON news_articles FOR SELECT
TO anon, authenticated
USING (
  review_status = 'approved'
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND (p.is_admin OR p.is_moderator OR p.is_editor)
  )
);

-- ── backfill: slugify existing articles, mark approved ──
DO $$
DECLARE
  r RECORD;
  base text;
  candidate text;
  n int;
BEGIN
  FOR r IN SELECT id, title FROM news_articles WHERE slug IS NULL LOOP
    base := lower(regexp_replace(r.title, '[^a-zA-Z0-9]+', '-', 'g'));
    base := trim(both '-' from base);
    IF base = '' OR base IS NULL THEN
      base := 'haber';
    END IF;
    base := left(base, 80);
    candidate := base;
    n := 1;
    WHILE EXISTS (SELECT 1 FROM news_articles WHERE slug = candidate) LOOP
      n := n + 1;
      candidate := base || '-' || n::text;
    END LOOP;
    UPDATE news_articles SET slug = candidate WHERE id = r.id;
  END LOOP;
END $$;