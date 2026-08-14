-- ============================================================
-- WHMI CPD Dashboard — Phase 1 schema
-- Run this once in your Supabase project's SQL Editor (Dashboard > SQL Editor > New query).
-- ============================================================

-- USERS -------------------------------------------------------------
-- Not yet linked to auth.users (Supabase Auth lands in Phase 2). No password
-- column on purpose — the app's demo login checks a fixed client-side value,
-- nothing credential-shaped is persisted here.
create table if not exists public.users (
  id text primary key,
  name text not null,
  email text not null unique,
  role text not null check (role in ('admin','owner','viewer')),
  staff_id text,
  avatar_id text not null default 'bone',
  avatar_color text not null default 'blue',
  dietary_requirements text,
  created_at timestamptz not null default now()
);

-- STAFF ---------------------------------------------------------------
create table if not exists public.staff (
  id text primary key,
  name text not null,
  profession text,
  campuses text[] not null default '{}',
  department text,
  hours numeric not null default 0,
  attended int not null default 0,
  certificates int not null default 0,
  modality text,
  grade text,
  qualified_year int,
  hours_last_3_years numeric,
  events_this_year int,
  last_attended date,
  attended_event_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.users drop constraint if exists users_staff_id_fkey;
alter table public.users
  add constraint users_staff_id_fkey foreign key (staff_id) references public.staff(id) on delete set null;

-- EXTERNAL PARTICIPANTS ------------------------------------------------
-- Non-WH-staff people who registered via a public event QR link.
create table if not exists public.external_participants (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

-- EVENTS ----------------------------------------------------------------
-- Upcoming and previous events share one table, distinguished by status.
create table if not exists public.events (
  id text primary key,
  title text not null,
  topic text,
  date date not null,
  start_time text,
  end_time text,
  location text,
  mode text check (mode in ('Online','In-person','Hybrid')),
  presenter text,
  registered int not null default 0,
  capacity int,
  waitlist int not null default 0,
  status text not null check (status in ('Draft','Awaiting Approval','Registration Open','Open (No Registration Needed)','Registration Closed','Completed','Archived')),
  meeting_url text,
  attendance int,
  feedback numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- REGISTRATIONS -----------------------------------------------------------
create table if not exists public.registrations (
  id text primary key default gen_random_uuid()::text,
  event_id text not null references public.events(id) on delete cascade,
  user_id text references public.users(id) on delete set null,
  external_participant_id text references public.external_participants(id) on delete set null,
  name text not null,
  email text not null,
  dietary text,
  is_external boolean not null default false,
  attendance_status text not null default 'Registered' check (attendance_status in ('Registered','Attended','No Show','Cancelled','Waitlisted')),
  created_at timestamptz not null default now()
);

-- CERTIFICATES ---------------------------------------------------------
create table if not exists public.certificates (
  id text primary key,
  staff_name text not null,
  event_id text references public.events(id) on delete set null,
  event_title text not null,
  status text not null default 'Awaiting Approval' check (status in ('Awaiting Approval','Sent')),
  date date not null,
  created_at timestamptz not null default now()
);

-- REFLECTIONS (Phase 7 — table scaffolded now, no UI yet) ----------------
create table if not exists public.reflections (
  id text primary key default gen_random_uuid()::text,
  event_id text references public.events(id) on delete cascade,
  registration_id text references public.registrations(id) on delete cascade,
  content text,
  submitted_at timestamptz default now()
);

-- FILES (Phase 3 — table scaffolded now, no upload UI yet) ---------------
create table if not exists public.files (
  id text primary key default gen_random_uuid()::text,
  event_id text references public.events(id) on delete cascade,
  kind text,
  storage_path text,
  uploaded_by text references public.users(id),
  created_at timestamptz default now()
);

-- AUDIT LOG (Phase 14 — table scaffolded now, no write calls yet) --------
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  actor_id text references public.users(id),
  action text not null,
  entity_type text,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- INTERIM: Phase 2 (real Supabase Auth) hasn't landed yet, so there's no
-- auth.uid() to key per-role policies off. RLS is turned ON at the table
-- level (not left wide open), but the policy below grants the anon key full
-- access so the app keeps working. This gets replaced with real per-role
-- policies (admin/owner/viewer) as part of Phase 2 — do not treat this as
-- the final security model.
-- ============================================================
alter table public.users enable row level security;
alter table public.staff enable row level security;
alter table public.external_participants enable row level security;
alter table public.events enable row level security;
alter table public.registrations enable row level security;
alter table public.certificates enable row level security;
alter table public.reflections enable row level security;
alter table public.files enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists "anon full access (interim, tightened in Phase 2)" on public.users;
drop policy if exists "anon full access (interim, tightened in Phase 2)" on public.staff;
drop policy if exists "anon full access (interim, tightened in Phase 2)" on public.external_participants;
drop policy if exists "anon full access (interim, tightened in Phase 2)" on public.events;
drop policy if exists "anon full access (interim, tightened in Phase 2)" on public.registrations;
drop policy if exists "anon full access (interim, tightened in Phase 2)" on public.certificates;
drop policy if exists "anon full access (interim, tightened in Phase 2)" on public.reflections;
drop policy if exists "anon full access (interim, tightened in Phase 2)" on public.files;
drop policy if exists "anon full access (interim, tightened in Phase 2)" on public.audit_log;

create policy "anon full access (interim, tightened in Phase 2)" on public.users for all using (true) with check (true);
create policy "anon full access (interim, tightened in Phase 2)" on public.staff for all using (true) with check (true);
create policy "anon full access (interim, tightened in Phase 2)" on public.external_participants for all using (true) with check (true);
create policy "anon full access (interim, tightened in Phase 2)" on public.events for all using (true) with check (true);
create policy "anon full access (interim, tightened in Phase 2)" on public.registrations for all using (true) with check (true);
create policy "anon full access (interim, tightened in Phase 2)" on public.certificates for all using (true) with check (true);
create policy "anon full access (interim, tightened in Phase 2)" on public.reflections for all using (true) with check (true);
create policy "anon full access (interim, tightened in Phase 2)" on public.files for all using (true) with check (true);
create policy "anon full access (interim, tightened in Phase 2)" on public.audit_log for all using (true) with check (true);
