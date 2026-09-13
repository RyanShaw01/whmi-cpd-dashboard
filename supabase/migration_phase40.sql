-- ============================================================
-- WHMI CPD Dashboard — Phase 40 migration
-- Adds the "Browse External CPD" listings: CPD offered by other organisations (ASMIRT,
-- Radiology Across Borders, etc.), shown to every signed-in user on their My CPD page and
-- maintained by admins in Settings > CPD Configuration.
--
-- Deliberately a plain admin-curated table rather than anything that scrapes those sites:
-- none of them publish a feed or API, so parsing their HTML would break silently whenever
-- one of them changes layout.
--
-- `event_date` is nullable on purpose - some listings are ongoing programmes with no single
-- date (e.g. RAB's monthly RABinars). Those sort last and render as "Ongoing".
-- `cost` is free text, not a number, so "Free", "$95", "Members free / $50 non-members" and
-- "Varies" are all expressible.
--
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

create table if not exists public.external_cpd_events (
  id text primary key,
  title text not null,
  provider text not null,
  url text not null,
  event_date date,
  cost text,
  location text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.external_cpd_events enable row level security;

-- Same shape as cpd_types (migration_phase12.sql): everyone signed in can read, only
-- admins/owners can change it.
drop policy if exists "read: any signed-in user" on public.external_cpd_events;
create policy "read: any signed-in user" on public.external_cpd_events for select using (auth.uid() is not null);

drop policy if exists "write: admin or owner" on public.external_cpd_events;
create policy "write: admin or owner" on public.external_cpd_events for all using (is_admin_or_owner()) with check (is_admin_or_owner());

create index if not exists external_cpd_events_date_idx on public.external_cpd_events (event_date);
