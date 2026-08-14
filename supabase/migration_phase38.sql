-- ============================================================
-- WHMI CPD Dashboard — Phase 38 migration
-- Adds a new "Open (No Registration Needed)" event status: visible to everyone the same as
-- "Registration Open", but nobody can register for it and no attendance is collected - for
-- events WH just wants to list (an external conference, a drop-in session) without running
-- registration for. (Renamed from an earlier draft of this migration that used the label
-- "Informational" - the UPDATE below is a no-op if this is the first time you're running it.)
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

update public.events set status = 'Open (No Registration Needed)' where status = 'Informational';

alter table public.events drop constraint if exists events_status_check;
alter table public.events add constraint events_status_check
  check (status in ('Draft','Awaiting Approval','Registration Open','Open (No Registration Needed)','Registration Closed','Completed','Archived'));
