-- ============================================================
-- WHMI CPD Dashboard — Phase 35 migration
-- Lets a brand-new @wh.org.au registrant (no existing `staff` row, no `users` account) get filed
-- into the Staff Directory the same way a new external registrant already gets filed into
-- external_participants — currently `staff` only allows admin/owner writes, so the public/no-
-- login registration flow could never create one, and every unmatched registrant silently ended
-- up in External Participants regardless of their actual email domain.
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

-- Mirrors external_participants' "insert: anyone" policy (see migration_phase2.sql) - narrow,
-- insert-only. Read/update/delete stay admin/owner-only (existing policies, unchanged).
drop policy if exists "insert: anyone" on public.staff;
create policy "insert: anyone" on public.staff for insert with check (true);
