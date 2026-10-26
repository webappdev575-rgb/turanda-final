/*
# Daily news fetch automation (pg_cron + pg_net)

1. Purpose
   Schedule the fetch-news edge function to run automatically once per day so the
   bilingual news feed (1-2 posts/day from the seed pool) stays active without
   anyone pressing "Pull News" in the admin dashboard. The manual button remains
   for on-demand pulls.

2. Extensions
   - Enable pg_cron (in-database scheduler).
   - Enable pg_net (async HTTP caller used to invoke the edge function).

3. Scheduled job
   - cron job "daily-news-fetch": runs at 08:00 UTC (11:00 Istanbul) every day,
     POSTs to the project's own /functions/v1/fetch-news endpoint using
     SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from vault-decoded settings,
     with Authorization header so verify_jwt=false function accepts the call.
   - Job creation is idempotent: unschedules first, then schedules.

4. Security
   - Service role key is read from the already-provisioned Supabase settings via
     current_setting, never stored in a table or logged.
   - No table or policy changes.
*/

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('daily-news-fetch')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-news-fetch');

SELECT cron.schedule(
  'daily-news-fetch',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/fetch-news',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('mode', 'scheduled'),
    timeout_msecs := 5000
  );
  $$
);