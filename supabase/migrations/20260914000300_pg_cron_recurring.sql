-- Schedules the generate-recurring edge function to run daily.
--
-- IMPORTANT: before this actually works you must:
--   1. Deploy the function: npx supabase functions deploy generate-recurring
--   2. Set its secret: npx supabase secrets set CRON_SHARED_SECRET=<a random string>
--   3. Replace YOUR_PROJECT_REF and YOUR_CRON_SHARED_SECRET below with the real
--      values, then re-run this migration (or run the cron.schedule call
--      directly in the Supabase SQL editor).
-- Until then this job safely no-ops (the URL 404s, the function is never
-- reached, next_run_date advances only when you use "Run now" in the app).

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'generate-recurring-daily',
  '0 6 * * *', -- 06:00 UTC daily
  $$
  select net.http_post(
    url := 'https://YOUR_PROJECT_REF.functions.supabase.co/generate-recurring',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'YOUR_CRON_SHARED_SECRET'
    ),
    body := '{}'::jsonb
  );
  $$
);
