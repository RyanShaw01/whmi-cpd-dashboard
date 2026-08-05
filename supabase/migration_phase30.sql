-- ============================================================
-- WHMI CPD Dashboard — Phase 30 migration
--   - registrations.organisation: which hospital/university/business an
--     external registrant is from.
--   - users.organisation: same, saved to an external viewer's profile so
--     it pre-fills next time, same pattern as profession.
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

alter table public.registrations add column if not exists organisation text;
alter table public.users add column if not exists organisation text;
