-- ============================================================
-- WHMI CPD Dashboard — Phase 3 migration
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- Adds full event-management fields + a Storage bucket for event files.
-- ============================================================

alter table public.events
  add column if not exists description text,
  add column if not exists learning_objectives text,
  add column if not exists presenters text,        -- comma-joined display string, e.g. "Dr. A. Okafor, R. Chen"
  add column if not exists organisers text,         -- comma-joined display string
  add column if not exists supporting_staff text,   -- comma-joined display string
  add column if not exists campus text,
  add column if not exists room text,
  add column if not exists online_capacity int,
  add column if not exists in_person_capacity int,
  add column if not exists tags text[] not null default '{}';

-- Backfill presenters from the existing single-name `presenter` column so
-- nothing already seeded looks empty.
update public.events set presenters = presenter where presenters is null and presenter is not null;

-- STORAGE — bucket for flyers/slides/handouts/supporting files -------------
insert into storage.buckets (id, name, public)
values ('event-files', 'event-files', true)
on conflict (id) do nothing;

-- INTERIM policies (same permissive stance as schema.sql — tightened once
-- Phase 2 auth lands and we know who's allowed to upload/delete what).
drop policy if exists "anon full access (interim, tightened in Phase 2)" on storage.objects;
create policy "anon full access (interim, tightened in Phase 2)" on storage.objects
  for all using (bucket_id = 'event-files') with check (bucket_id = 'event-files');
