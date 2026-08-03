-- ============================================================
-- WHMI CPD Dashboard — Phase 8b migration
-- Reflection form tweaks: 5-point appropriateness scale (was 3-point).
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

alter table public.reflections drop constraint if exists reflections_appropriateness_check;
alter table public.reflections add constraint reflections_appropriateness_check
  check (appropriateness in ('Too basic', 'Slightly too basic', 'Appropriate', 'Slightly too advanced', 'Too advanced'));
