-- Schedules the generate-recurring edge function to run daily.
--
-- NOTE: for this project, the real cron job was already applied directly
-- against the database (via `supabase db query --linked`) with the actual
-- project ref and CRON_SHARED_SECRET filled in -- NOT through this file, to
-- avoid committing that secret to git. This file is kept as a template.
--
-- If you ever need to re-apply it (e.g. after rotating CRON_SHARED_SECRET
-- via `supabase secrets set`), fill in YOUR_PROJECT_REF and
-- YOUR_CRON_SHARED_SECRET below and run it with `supabase db query --linked
-- --file <this file>` or paste it into the Supabase SQL editor -- don't
-- commit the filled-in version.

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
