-- ============================================================
-- WHMI CPD Dashboard — Phase 24 migration
--   - users.accessibility: was only ever saved to local session state (never
--     actually persisted), so it reverted on every reload/relogin. Adding it
--     here so it saves to the profile properly, same as dietary requirements.
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

alter table public.users add column if not exists accessibility text;
