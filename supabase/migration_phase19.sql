-- ============================================================
-- WHMI CPD Dashboard — Phase 19 migration
--   - brainstorm_ideas.category (lets ideas be sorted into Topics/CPD Types,
--     Event Delivery Types, Presenters, and Location sections)
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

alter table public.brainstorm_ideas add column if not exists category text not null default 'other';
