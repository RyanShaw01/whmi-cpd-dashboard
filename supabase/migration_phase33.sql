-- ============================================================
-- WHMI CPD Dashboard — Phase 33 migration
-- Auto-complete events 24h after they end (moves them from Upcoming to Previous Events).
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

-- Already created by Phase 8, kept here so this migration is runnable standalone.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ============================================================
-- After deploying the complete-finished-events Edge Function (see
-- supabase/functions/complete-finished-events/), run this separately with the real function
-- URL + CRON_SECRET filled in (same secret already used for whmi-event-reminders):
--
-- select cron.schedule(
--   'whmi-complete-finished-events',
--   '*/15 * * * *',
--   $$
--   select net.http_post(
--     url := 'https://<project-ref>.supabase.co/functions/v1/complete-finished-events',
--     headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>')
--   );
--   $$
-- );
-- ============================================================
