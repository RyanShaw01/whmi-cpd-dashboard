-- ============================================================
-- WHMI CPD Dashboard — Phase 38 migration
-- Adds a new "Informational" event status: visible to everyone the same as "Registration Open",
-- but nobody can register for it and no attendance is collected - for events WH just wants to
-- list (an external conference, a drop-in session) without running registration for.
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

alter table public.events drop constraint if exists events_status_check;
alter table public.events add constraint events_status_check
  check (status in ('Draft','Awaiting Approval','Registration Open','Informational','Registration Closed','Completed','Archived'));
