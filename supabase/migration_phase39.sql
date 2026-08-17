-- ============================================================
-- WHMI CPD Dashboard — Phase 39 migration
-- Fixes the reflection link (and the plain "view event" link) permanently showing "Event not
-- found" for anyone who isn't logged in, once the event has actually completed.
--
-- The anon-read RLS policy on public.events only ever allowed status = 'Registration Open' -
-- so even after fetching previousEvents client-side, Postgres silently returned zero rows for
-- a Completed/Archived event to an anonymous visitor (exactly who clicks a reflection link from
-- an email). It also meant the "Open (No Registration Needed)" status - which is supposed to be
-- visible to everyone, logged in or not - was invisible to anonymous visitors too.
--
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

drop policy if exists "public read: registration-open events" on public.events;
create policy "public read: publicly-visible events" on public.events for select
  to anon using (status in ('Registration Open', 'Open (No Registration Needed)', 'Completed', 'Archived'));
