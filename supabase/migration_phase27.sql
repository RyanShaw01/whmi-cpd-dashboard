-- ============================================================
-- WHMI CPD Dashboard — Phase 27 migration
--   - registrations.reflection_email_sent_at: tracks when a reflection
--     follow-up/reminder email was last sent for a given registration, so
--     the admin Reflections overview can show "sent" status and let admins
--     resend it.
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

alter table public.registrations add column if not exists reflection_email_sent_at timestamptz;
