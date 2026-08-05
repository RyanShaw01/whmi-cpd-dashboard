-- ============================================================
-- WHMI CPD Dashboard — Phase 28 migration
--   - users.main_dark_mode: lets someone set the main content page's
--     light/dark theme independently of the sidebar+header theme
--     (users.dark_mode). Null means "match the sidebar+header theme".
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

alter table public.users add column if not exists main_dark_mode boolean;
