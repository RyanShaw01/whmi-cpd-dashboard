-- ============================================================
-- WHMI CPD Dashboard — Phase 29 migration
--   - Adds a 3rd theme option (dark navy) alongside light/dark, so the
--     old boolean dark_mode/main_dark_mode columns are replaced with
--     text columns that can hold 'light' | 'dark' | 'navy'.
--   - Backfills from the existing boolean columns so nobody's current
--     preference changes. The old boolean columns are left in place
--     (unused, harmless) rather than dropped.
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

alter table public.users add column if not exists theme_mode text not null default 'light';
alter table public.users add column if not exists main_theme_mode text;

update public.users set theme_mode = case when dark_mode then 'dark' else 'light' end;
update public.users set main_theme_mode = case
  when main_dark_mode is null then null
  when main_dark_mode then 'dark'
  else 'light'
end
where main_theme_mode is null;
