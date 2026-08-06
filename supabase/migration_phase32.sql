-- ============================================================
-- WHMI CPD Dashboard — Phase 32 migration
--   - events.certificates_enabled: per-event toggle to allow/disallow CPD
--     certificates being generated or sent for that event. Defaults to
--     true, so nothing changes for existing events.
--   - events.recurrence_group_id: shared id linking the occurrences of a
--     recurring event series together (null for non-recurring events).
--   - events.group_in_upcoming: whether occurrences show as tabs together
--     in Upcoming Events while still open/in progress. Defaults true.
--   - events.group_in_previous: whether occurrences stay grouped together
--     once they move to Previous Events. Defaults false (separate).
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

alter table public.events add column if not exists certificates_enabled boolean not null default true;
alter table public.events add column if not exists recurrence_group_id text;
alter table public.events add column if not exists group_in_upcoming boolean not null default true;
alter table public.events add column if not exists group_in_previous boolean not null default false;

create index if not exists events_recurrence_group_id_idx on public.events (recurrence_group_id) where recurrence_group_id is not null;
