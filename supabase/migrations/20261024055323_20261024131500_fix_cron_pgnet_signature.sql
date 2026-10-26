/*
# Fix daily-news-fetch cron job for this project's pg_net signature

1. Purpose
   This project's pg_net exposes net.http_post(url, body, params, headers,
   timeout_milliseconds) — the earlier job used named arguments from the newer
   signature and would fail at run time.

2. Changes
   - Reschedule 'daily-news-fetch' using the correct positional-compatible call
     with named parameters that exist here: url, body, headers,
     timeout_milliseconds := 30000 (edge function can take tens of seconds).
*/

SELECT cron.unschedule('daily-news-fetch')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-news-fetch');

SELECT cron.schedule(
  'daily-news-fetch',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'daily_news_supabase_url') || '/functions/v1/fetch-news',
    body := jsonb_build_object('daily', true),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'daily_news_service_role_key')
    ),
    timeout_milliseconds := 30000
  );
  $$
);