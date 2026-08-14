-- ============================================================
-- WHMI CPD Dashboard — Phase 36 migration
-- Lets a registration be flagged as a presenter (vs a regular attendee) - still counts toward
-- capacity/total registered, but is excluded from the bulk "everyone" thank-you/reflection-
-- reminder emails, so presenters can instead be thanked separately (Presenters section on the
-- event card, with an optional CPD certificate).
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

alter table public.registrations add column if not exists is_presenter boolean not null default false;
