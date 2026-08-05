-- ============================================================
-- WHMI CPD Dashboard — Phase 31 migration
--   - users.card_theme_mode: independent theme for card/popup/form
--     surfaces (events, modals, panels), separate from the page
--     background theme. Null means "match the page theme" (default,
--     no visual change for existing users).
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

alter table public.users add column if not exists card_theme_mode text;
