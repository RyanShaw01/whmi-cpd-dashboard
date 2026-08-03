-- ============================================================
-- WHMI CPD Dashboard — Phase 8 migration
-- Real reflection/feedback form + automatic certificates & reminders.
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

-- REFLECTIONS — real form fields ------------------------------------------
alter table public.reflections
  add column if not exists relevance_rating int check (relevance_rating between 0 and 10),
  add column if not exists appropriateness text check (appropriateness in ('Too basic','Appropriate','Too advanced')),
  add column if not exists most_valuable text,
  add column if not exists improvements text,
  add column if not exists future_topics text;

alter table public.reflections drop constraint if exists reflections_rating_check;
alter table public.reflections add constraint reflections_rating_check check (rating between 0 and 10);

-- EVENTS — optional ASMIRT endorsement code --------------------------------
alter table public.events add column if not exists asmirt_code text;

-- REGISTRATIONS — reminder de-dupe guard -----------------------------------
alter table public.registrations add column if not exists reminder_sent_at timestamptz;
-- Backfill: mark all EXISTING registrations as already-reminded so the new cron
-- job doesn't mass-email everyone the moment it's enabled.
update public.registrations set reminder_sent_at = now() where reminder_sent_at is null;

-- CERTIFICATES — auto-issue support ----------------------------------------
alter table public.certificates
  add column if not exists recipient_email text,
  add column if not exists registration_id text references public.registrations(id) on delete set null,
  add column if not exists reflection_id text references public.reflections(id) on delete set null,
  add column if not exists cpd_hours numeric,
  add column if not exists pdf_path text,
  add column if not exists sent_at timestamptz;

-- STORAGE — bucket for generated certificate PDFs (mirrors event-files) ---
insert into storage.buckets (id, name, public)
  values ('certificates', 'certificates', true)
  on conflict (id) do nothing;

drop policy if exists "anon full access (interim, tightened in Phase 2)" on storage.objects;
create policy "anon full access (interim, tightened in Phase 2)" on storage.objects
  for all using (bucket_id in ('event-files', 'certificates')) with check (bucket_id in ('event-files', 'certificates'));

-- SCHEDULING — extensions needed for the 30-minute reminder cron ----------
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ============================================================
-- After deploying the Edge Functions (see supabase/functions/), run this
-- separately with the real function URL + CRON_SECRET filled in:
--
-- select cron.schedule(
--   'whmi-event-reminders',
--   '*/5 * * * *',
--   $$
--   select net.http_post(
--     url := 'https://<project-ref>.supabase.co/functions/v1/send-event-reminders',
--     headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>')
--   );
--   $$
-- );
-- ============================================================
