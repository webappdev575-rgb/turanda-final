/*
# Schedule daily commodity price fetch

1. Purpose
   Commodity prices were stuck (latest data Oct 22) because no scheduled job
   existed to call the fetch-commodities edge function. A daily news cron job
   already exists and works; this adds the missing commodity equivalent using
   the same pattern (vault secrets + pg_net http_post).

2. Changes
   - Add two vault secrets: 'daily_commodities_supabase_url' and
     'daily_commodities_service_role_key' (same project URL and service key
     already stored for the news job).
   - Create cron job 'daily-commodities-fetch' running at 07:30 UTC daily,
     calling the fetch-commodities edge function with the service role key.

3. Security
   - vault.decrypted_secrets is only readable by postgres/service_role.
   - No public tables or policies are touched.
*/

SELECT vault.create_secret(
  'https://kkbmcwqskgqhypjpqxqx.supabase.co',
  'daily_commodities_supabase_url'
);

SELECT vault.create_secret(
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrYm1jd3Fza2dxaHlwanBxeHF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDQ1MDAwOSwiZXhwIjoyMTA2MDI2MDA5fQ.TtTz3Z0eBvGCaFqkPWGbOJV0YyBC-V8Qs6RgNqONpU',
  'daily_commodities_service_role_key'
);

SELECT cron.unschedule('daily-commodities-fetch')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-commodities-fetch');

SELECT cron.schedule(
  'daily-commodities-fetch',
  '30 7 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'daily_commodities_supabase_url') || '/functions/v1/fetch-commodities',
    body := jsonb_build_object('daily', true),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'daily_commodities_service_role_key')
    ),
    timeout_milliseconds := 120000
  );
  $$
);
