-- ============================================================
-- WHMI CPD Dashboard — Phase 12 migration
-- Bundles the schema changes for the post-auth polish batch (Stages 2-5):
--   - cpd_types (admin-managed appellation code table) + events.cpd_type_id
--   - users.dark_mode (account-level theme persistence)
--   - events.open_to_external (external browse/register visibility)
--   - users.is_test (flagged test accounts, hidden from normal lists)
--   - certificates.is_manual / cpd_type_id (manual, no-account certificates)
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

-- CPD TYPES (appellation codes) -----------------------------------------
create table if not exists public.cpd_types (
  id text primary key,
  name text not null,
  appellation_code text not null,
  created_at timestamptz not null default now()
);
alter table public.cpd_types enable row level security;
drop policy if exists "read: any signed-in user" on public.cpd_types;
create policy "read: any signed-in user" on public.cpd_types for select using (auth.uid() is not null);
drop policy if exists "write: admin or owner" on public.cpd_types;
create policy "write: admin or owner" on public.cpd_types for all using (is_admin_or_owner()) with check (is_admin_or_owner());

alter table public.events add column if not exists cpd_type_id text references public.cpd_types(id) on delete set null;

-- ACCOUNT-LEVEL PREFERENCES ------------------------------------------------
alter table public.users add column if not exists dark_mode boolean not null default false;

-- EXTERNAL EVENT VISIBILITY -------------------------------------------------
alter table public.events add column if not exists open_to_external boolean not null default true;

-- TEST ACCOUNTS (admin "preview as" tool) ------------------------------------
alter table public.users add column if not exists is_test boolean not null default false;

-- MANUAL CERTIFICATES ----------------------------------------------------
-- Certificates created directly by an admin for someone with no account in the system.
-- user_id/registration_id/reflection_id are already null for these; this flag makes that
-- origin explicit and queryable without relying on that convention.
alter table public.certificates add column if not exists is_manual boolean not null default false;
alter table public.certificates add column if not exists cpd_type_id text references public.cpd_types(id) on delete set null;
