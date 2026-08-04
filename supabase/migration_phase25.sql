-- ============================================================
-- WHMI CPD Dashboard — Phase 25 migration
--   - events.external_price: optional price shown to external
--     participants when registering (internal/WH staff never see it).
--   - events.reflection_email_offset_minutes: how long before the event
--     ends the follow-up/reflection email should go out. Defaults to 20
--     (existing behaviour/intent), now editable per event.
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

alter table public.events add column if not exists external_price numeric;
alter table public.events add column if not exists reflection_email_offset_minutes integer not null default 20;
