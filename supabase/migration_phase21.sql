-- ============================================================
-- WHMI CPD Dashboard — Phase 21 migration
--   - Campus values switched from short codes (SH/FH/WTN/SDH) to full hospital
--     names everywhere they're selected/displayed. This converts any existing
--     stored short codes to match.
--   - events.level (optional floor/level, shown alongside room number)
--   - app_settings: generic admin/owner-configurable key/value store, first used
--     for which staff-record fields are shown (Settings > Staff Information Fields)
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

alter table public.events add column if not exists level text;

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
drop policy if exists "read: any signed-in user" on public.app_settings;
create policy "read: any signed-in user" on public.app_settings for select using (auth.uid() is not null);
drop policy if exists "write: admin or owner" on public.app_settings;
create policy "write: admin or owner" on public.app_settings for all using (is_admin_or_owner()) with check (is_admin_or_owner());

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
