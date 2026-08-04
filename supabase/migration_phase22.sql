-- ============================================================
-- WHMI CPD Dashboard — Phase 22 migration
--   - users.profession / users.department, captured during onboarding
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

alter table public.users add column if not exists profession text;
alter table public.users add column if not exists department text;
