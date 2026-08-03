-- ============================================================
-- WHMI CPD Dashboard — Phase 11 migration
-- Previous Events Archive: recording link per event.
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

alter table public.events add column if not exists recording_url text;
