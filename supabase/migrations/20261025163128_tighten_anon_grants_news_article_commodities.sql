/*
# Tighten anon grants on news_article_commodities

1. Security
- `news_article_commodities`: anonymous visitors only ever read the commodity price chips, so
  revoke INSERT/UPDATE/DELETE from `anon` (no anon write policy exists, but the table-level grant
  should match the intended access). Staff writes go through `authenticated` with the existing
  staff policy; the fetch-news edge function writes with the service role.
*/

REVOKE INSERT, UPDATE, DELETE ON public.news_article_commodities FROM anon;