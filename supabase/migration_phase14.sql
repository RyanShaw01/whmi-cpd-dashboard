-- ============================================================
-- WHMI CPD Dashboard — Phase 14 migration
-- Reflection collection is now always available via link + QR code; this adds a
-- per-event toggle for whether a follow-up email should also be sent (default on).
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

alter table public.events add column if not exists reflection_auto_email boolean not null default true;
