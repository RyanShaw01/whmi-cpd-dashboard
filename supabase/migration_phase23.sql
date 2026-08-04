-- ============================================================
-- WHMI CPD Dashboard — Phase 23 migration
--   - personal_reflections: self-authored reflections for non-WH CPD activities,
--     shown in the new Reflection tab alongside a user's existing WH event
--     reflections (from public.reflections).
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

create table if not exists public.personal_reflections (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  activity_name text not null,
  activity_date date not null,
  mode text not null default 'full' check (mode in ('full', 'short', 'freeform')),
  answers jsonb not null default '{}',
  freeform_text text,
  created_at timestamptz not null default now()
);
alter table public.personal_reflections enable row level security;

drop policy if exists "read: own or admin/owner" on public.personal_reflections;
create policy "read: own or admin/owner" on public.personal_reflections for select
  using (is_admin_or_owner() or user_id = (select user_id from public.current_app_user()));

drop policy if exists "insert: own or admin/owner" on public.personal_reflections;
create policy "insert: own or admin/owner" on public.personal_reflections for insert
  with check (is_admin_or_owner() or user_id = (select user_id from public.current_app_user()));

drop policy if exists "update: own or admin/owner" on public.personal_reflections;
create policy "update: own or admin/owner" on public.personal_reflections for update
  using (is_admin_or_owner() or user_id = (select user_id from public.current_app_user()));

drop policy if exists "delete: own or admin/owner" on public.personal_reflections;
create policy "delete: own or admin/owner" on public.personal_reflections for delete
  using (is_admin_or_owner() or user_id = (select user_id from public.current_app_user()));
