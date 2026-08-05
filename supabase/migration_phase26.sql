-- ============================================================
-- WHMI CPD Dashboard — Phase 26 migration
--   - events.reflection_email_offset_direction: whether the follow-up/
--     reflection email offset (reflection_email_offset_minutes, added in
--     phase 25) counts back from the event's end time or forward after it.
--     Defaults to 'before' to match existing behaviour.
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

alter table public.events add column if not exists reflection_email_offset_direction text not null default 'before';
