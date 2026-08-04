-- ============================================================
-- WHMI CPD Dashboard — Phase 18 migration
--   - cpd_types.sort_order (lets admins/owners rearrange CPD Types in Settings)
--   - brainstorm_ideas (admin/owner shared idea list + public no-login submission form)
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

-- CPD TYPES: SORT ORDER ------------------------------------------------------
alter table public.cpd_types add column if not exists sort_order int not null default 0;

-- BRAINSTORM IDEAS ------------------------------------------------------------
create table if not exists public.brainstorm_ideas (
  id text primary key,
  content text not null,
  added_by_name text not null,
  source text not null default 'admin' check (source in ('admin', 'public')),
  created_at timestamptz not null default now()
);
alter table public.brainstorm_ideas enable row level security;
drop policy if exists "insert: anyone" on public.brainstorm_ideas;
create policy "insert: anyone" on public.brainstorm_ideas for insert with check (true);
drop policy if exists "read: admin or owner" on public.brainstorm_ideas;
create policy "read: admin or owner" on public.brainstorm_ideas for select using (is_admin_or_owner());
drop policy if exists "delete: admin or owner" on public.brainstorm_ideas;
create policy "delete: admin or owner" on public.brainstorm_ideas for delete using (is_admin_or_owner());
