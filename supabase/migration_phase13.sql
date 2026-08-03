-- ============================================================
-- WHMI CPD Dashboard — Phase 13 migration
-- Adds resend tracking for the Certificates page's "Approve & Send All" / resend flow.
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

alter table public.certificates add column if not exists resend_count int not null default 0;
alter table public.certificates add column if not exists last_resent_at timestamptz;
