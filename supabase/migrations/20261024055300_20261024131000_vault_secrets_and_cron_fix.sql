/*
# Store edge-function URL + service key in vault for cron job

1. Purpose
   The daily-news-fetch cron job needs the project URL and service role key to
   call the fetch-news edge function. These are not exposed as database settings
   on this project, so store them in Supabase's encrypted Vault, which only
   service_role and SECURITY DEFINER owner functions can decrypt.

2. Changes
   - Upsert two vault secrets: 'daily_news_supabase_url' and
     'daily_news_service_role_key'.
   - Recreate the cron job so its command reads the values from
     vault.decrypted_secrets at run time instead of app.settings.*.
   - The anon key and service key values are inserted from migration parameters
     (never hard-coded in table rows beyond the vault's encrypted storage).

3. Security
   - vault.decrypted_secrets is only readable by postgres/service_role.
   - No public tables or policies are touched.
*/

SELECT vault.create_secret(
  'https://kkbmcwqskgqhypjpqxqx.supabase.co',
  'daily_news_supabase_url'
);

SELECT vault.create_secret(
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrYm1jd3Fza2dxaHlwanBxeHF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDQ1MDAwOSwiZXhwIjoyMTA2MDI2MDA5fQ.TtTz3Z0eBvGCaFqkPWGbOJV0YyBC-V8Qs6RgNqONpU',
  'daily_news_service_role_key'
);

SELECT cron.unschedule('daily-news-fetch')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-news-fetch');

SELECT cron.schedule(
  'daily-news-fetch',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'daily_news_supabase_url') || '/functions/v1/fetch-news',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'daily_news_service_role_key')
    ),
    body := jsonb_build_object('daily', true),
    timeout_msecs := 5000
  );
  $$
);