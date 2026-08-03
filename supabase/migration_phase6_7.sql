-- ============================================================
-- WHMI CPD Dashboard — Phase 6/7 migration
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

-- REFLECTIONS — flesh out the Phase 1 placeholder table -----------------
alter table public.reflections
  add column if not exists name text,
  add column if not exists email text,
  add column if not exists rating int check (rating between 1 and 5),
  add column if not exists event_title text,
  add column if not exists presenter text;

-- EVENTS — how reflections are collected for this event ------------------
alter table public.events
  add column if not exists reflection_method text check (reflection_method in ('auto-email', 'qr', 'link')) default 'link';

-- DUPLICATE DETECTION — dismissed warning pairs don't reappear -----------
create table if not exists public.duplicate_dismissals (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('registration', 'reflection')),
  id_a text not null,
  id_b text not null,
  created_at timestamptz not null default now()
);

alter table public.reflections enable row level security;
alter table public.duplicate_dismissals enable row level security;

drop policy if exists "anon full access (interim, tightened in Phase 2)" on public.reflections;
drop policy if exists "anon full access (interim, tightened in Phase 2)" on public.duplicate_dismissals;
create policy "anon full access (interim, tightened in Phase 2)" on public.reflections for all using (true) with check (true);
create policy "anon full access (interim, tightened in Phase 2)" on public.duplicate_dismissals for all using (true) with check (true);
