-- ============================================================
-- WHMI CPD Dashboard — Phase 21 migration
--   - Campus values switched from short codes (SH/FH/WTN/SDH) to full hospital
--     names everywhere they're selected/displayed. This converts any existing
--     stored short codes to match.
--   - events.level (optional floor/level, shown alongside room number)
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

alter table public.events add column if not exists level text;

-- STAFF.CAMPUSES (text[]) -----------------------------------------------------
update public.staff
set campuses = (
  select array_agg(
    case c
      when 'SH' then 'Sunshine Hospital'
      when 'FH' then 'Footscray Hospital'
      when 'WTN' then 'Williamstown Hospital'
      when 'SDH' then 'Sunbury Day Hospital'
      else c
    end
  )
  from unnest(campuses) as c
)
where campuses && array['SH', 'FH', 'WTN', 'SDH'];

-- EVENTS.CAMPUS (text) --------------------------------------------------------
update public.events set campus = 'Sunshine Hospital' where campus = 'SH';
update public.events set campus = 'Footscray Hospital' where campus = 'FH';
update public.events set campus = 'Williamstown Hospital' where campus = 'WTN';
update public.events set campus = 'Sunbury Day Hospital' where campus = 'SDH';
