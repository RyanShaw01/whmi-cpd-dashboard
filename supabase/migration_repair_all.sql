-- ============================================================
-- WHMI CPD Dashboard -- CONSOLIDATED REPAIR SCRIPT
-- Combines every migration from phase 2 through phase 22 into one safe,
-- idempotent run, because several migrations appear to have been skipped
-- over time (missing events.banner_focal_x, missing public.tags, etc).
--
-- Safe to run even if some/most of these already applied: every CREATE TABLE
-- uses IF NOT EXISTS, every ADD COLUMN uses IF NOT EXISTS, every INSERT uses
-- ON CONFLICT DO NOTHING (or DO UPDATE where intentional), and every CREATE
-- POLICY below has been given a matching DROP POLICY IF EXISTS immediately
-- before it so re-running never errors on a duplicate policy name.
--
-- DO NOT run schema.sql again after this -- it contains an early 'anon full
-- access' policy that migration_phase2.sql intentionally replaces; re-running
-- schema.sql would silently re-open that permissive access alongside the
-- tightened policies below (Postgres OR's multiple policies together).
-- ============================================================

-- ---- from migration_phase2.sql ----
-- ============================================================
-- WHMI CPD Dashboard — Phase 2 migration
-- Real authentication (Supabase Auth, email OTP) + RLS tightening.
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
--
-- IMPORTANT — before running this:
-- 1. In Supabase Dashboard > Authentication > Providers > Email, enable "Email OTP"
--    (disable password sign-in if you want OTP-only).
-- 2. In Authentication > Attack Protection, enable CAPTCHA protection and select
--    Cloudflare Turnstile, pasting in your Turnstile site key + secret key.
-- 3. In Authentication > Sessions, set the JWT expiry to 3600 (1 hour) if not already.
-- ============================================================

-- USERS — new auth-related fields ------------------------------------------
alter table public.users
  add column if not exists auth_id uuid unique references auth.users(id) on delete set null,
  add column if not exists user_type text not null default 'internal' check (user_type in ('internal','external')),
  add column if not exists verified boolean not null default false,
  add column if not exists secondary_email text unique,
  add column if not exists cert_email_preference text not null default 'primary' check (cert_email_preference in ('primary','secondary')),
  add column if not exists onboarded boolean not null default false;

-- Existing demo users predate real auth — treat them as already onboarded so
-- they aren't dropped into the onboarding flow the first time this ships.
update public.users set onboarded = true where onboarded = false;

-- LOGIN EMAILS — maps every login-capable email (primary or secondary) to an
-- app user id. This is what lets a secondary email sign into the same account:
-- both emails resolve through this table to the same users.id regardless of
-- which one issued the current Supabase Auth session.
create table if not exists public.login_emails (
  email text primary key,
  user_id text not null references public.users(id) on delete cascade
);
insert into public.login_emails (email, user_id)
  select lower(email), id from public.users
  on conflict (email) do nothing;

-- Helper: resolve the calling request's app user id/role/user_type from
-- auth.uid(), via users.auth_id. security definer so it can read public.users
-- regardless of the caller's own row-level access.
create or replace function public.current_app_user()
returns table (user_id text, role text, user_type text)
language sql stable security definer as $$
  select u.id, u.role, u.user_type
  from public.users u
  where u.auth_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_admin_or_owner()
returns boolean
language sql stable security definer as $$
  select exists (select 1 from public.current_app_user() where role in ('admin','owner'));
$$;

-- ============================================================
-- RLS — replace every interim "anon full access" policy with real ones.
-- Three patterns cover all tables:
--   A) admin/owner-managed reference data: read = any signed-in user, write = admin/owner
--   B) own-row-or-admin data: admin/owner, or the row belongs to the caller
--   C) public unauthenticated insert (anonymous one-off registrants), locked-down read
-- ============================================================

-- USERS (pattern B — everyone can read the directory, only admin/owner or the
-- user themself can update; only admin/owner can delete/insert others)
drop policy if exists "anon full access (interim, tightened in Phase 2)" on public.users;
drop policy if exists "read: any signed-in user" on public.users;
create policy "read: any signed-in user" on public.users for select using (auth.uid() is not null);
-- Update covers three cases: (1) admin/owner editing anyone, (2) a user editing their
-- already-linked own row, (3) a first-time real login "claiming" a pre-existing seed
-- row by email match (auth_id still null) to set auth_id on it. The with_check always
-- requires the resulting auth_id to be the caller's own uid, so no one can hijack
-- another row by pointing its auth_id at themselves.
drop policy if exists "update: self, claim-by-email, or admin" on public.users;
create policy "update: self, claim-by-email, or admin" on public.users for update
  using (is_admin_or_owner() or auth_id = auth.uid() or (auth_id is null and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))))
  with check (is_admin_or_owner() or auth_id = auth.uid());
drop policy if exists "insert: admin or self-provisioning" on public.users;
create policy "insert: admin or self-provisioning" on public.users for insert
  with check (is_admin_or_owner() or auth_id = auth.uid());
drop policy if exists "delete: admin only" on public.users;
create policy "delete: admin only" on public.users for delete using (is_admin_or_owner());

-- LOGIN_EMAILS (system table — only admin/owner or the linked user manage it directly;
-- the app itself uses the anon/authenticated client, so self-provisioning insert is allowed)
alter table public.login_emails enable row level security;
-- A caller can always look up the login_emails row for the email they just
-- authenticated with (needed right after OTP verify, before their users row may
-- even exist) — this is what makes the "returning user?" lookup work for
-- everyone, not just admins. Cross-checking *other* people's emails is admin-only.
drop policy if exists "read: admin, owner, or own auth email" on public.login_emails;
create policy "read: admin, owner, or own auth email" on public.login_emails for select
  using (is_admin_or_owner() or email = lower(coalesce(auth.jwt() ->> 'email', '')));
drop policy if exists "insert: admin or self" on public.login_emails;
create policy "insert: admin or self" on public.login_emails for insert
  with check (is_admin_or_owner() or email = lower(coalesce(auth.jwt() ->> 'email', '')));
drop policy if exists "update: admin only" on public.login_emails;
create policy "update: admin only" on public.login_emails for update using (is_admin_or_owner());
drop policy if exists "delete: admin only" on public.login_emails;
create policy "delete: admin only" on public.login_emails for delete using (is_admin_or_owner());

-- STAFF (pattern A)
drop policy if exists "anon full access (interim, tightened in Phase 2)" on public.staff;
drop policy if exists "read: any signed-in user" on public.staff;
create policy "read: any signed-in user" on public.staff for select using (auth.uid() is not null);
drop policy if exists "write: admin or owner" on public.staff;
create policy "write: admin or owner" on public.staff for all using (is_admin_or_owner()) with check (is_admin_or_owner());

-- EVENTS (pattern A)
drop policy if exists "anon full access (interim, tightened in Phase 2)" on public.events;
drop policy if exists "read: any signed-in user" on public.events;
create policy "read: any signed-in user" on public.events for select using (auth.uid() is not null);
drop policy if exists "write: admin or owner" on public.events;
create policy "write: admin or owner" on public.events for all using (is_admin_or_owner()) with check (is_admin_or_owner());
-- events also need to stay readable by the *public* event page (no login) — that page
-- only ever needs Registration Open events, so allow anon read scoped to that status.
drop policy if exists "public read: registration-open events" on public.events;
create policy "public read: registration-open events" on public.events for select
  to anon using (status = 'Registration Open');

-- REGISTRATIONS (pattern B, plus anonymous public insert for the no-login QR flow)
drop policy if exists "anon full access (interim, tightened in Phase 2)" on public.registrations;
drop policy if exists "read: admin, owner, or own" on public.registrations;
create policy "read: admin, owner, or own" on public.registrations for select
  using (is_admin_or_owner() or user_id = (select user_id from public.current_app_user()));
drop policy if exists "insert: signed-in self or public" on public.registrations;
create policy "insert: signed-in self or public" on public.registrations for insert
  with check (true); -- covers both logged-in self-registration and anonymous QR registration
drop policy if exists "update/delete: admin or owner" on public.registrations;
create policy "update/delete: admin or owner" on public.registrations for update using (is_admin_or_owner()) with check (is_admin_or_owner());
drop policy if exists "delete: admin or owner" on public.registrations;
create policy "delete: admin or owner" on public.registrations for delete using (is_admin_or_owner());

-- EXTERNAL_PARTICIPANTS (pattern C — anonymous insert allowed, read/write locked down)
drop policy if exists "anon full access (interim, tightened in Phase 2)" on public.external_participants;
drop policy if exists "insert: anyone" on public.external_participants;
create policy "insert: anyone" on public.external_participants for insert with check (true);
drop policy if exists "read/update/delete: admin or owner" on public.external_participants;
create policy "read/update/delete: admin or owner" on public.external_participants for select using (is_admin_or_owner());
drop policy if exists "update: admin or owner" on public.external_participants;
create policy "update: admin or owner" on public.external_participants for update using (is_admin_or_owner());
drop policy if exists "delete: admin or owner" on public.external_participants;
create policy "delete: admin or owner" on public.external_participants for delete using (is_admin_or_owner());

-- CERTIFICATES (pattern B)
drop policy if exists "anon full access (interim, tightened in Phase 2)" on public.certificates;
drop policy if exists "read: admin, owner, or recipient" on public.certificates;
create policy "read: admin, owner, or recipient" on public.certificates for select
  using (is_admin_or_owner() or lower(recipient_email) in (select lower(email) from public.login_emails where user_id = (select user_id from public.current_app_user())));
drop policy if exists "write: admin or owner" on public.certificates;
create policy "write: admin or owner" on public.certificates for all using (is_admin_or_owner()) with check (is_admin_or_owner());
-- the certificate Edge Function uses the service-role key (bypasses RLS entirely), so
-- automatic cert issuance is unaffected by this tightening.

-- REFLECTIONS (pattern B, plus anonymous public insert for the no-login reflection form)
drop policy if exists "anon full access (interim, tightened in Phase 2)" on public.reflections;
drop policy if exists "read: admin, owner, or own" on public.reflections;
create policy "read: admin, owner, or own" on public.reflections for select
  using (is_admin_or_owner() or lower(email) in (select lower(email) from public.login_emails where user_id = (select user_id from public.current_app_user())));
drop policy if exists "insert: anyone" on public.reflections;
create policy "insert: anyone" on public.reflections for insert with check (true);
drop policy if exists "update/delete: admin or owner" on public.reflections;
create policy "update/delete: admin or owner" on public.reflections for update using (is_admin_or_owner()) with check (is_admin_or_owner());
drop policy if exists "delete: admin or owner" on public.reflections;
create policy "delete: admin or owner" on public.reflections for delete using (is_admin_or_owner());

-- FILES (pattern A)
drop policy if exists "anon full access (interim, tightened in Phase 2)" on public.files;
drop policy if exists "read: any signed-in user" on public.files;
create policy "read: any signed-in user" on public.files for select using (auth.uid() is not null);
drop policy if exists "write: admin or owner" on public.files;
create policy "write: admin or owner" on public.files for all using (is_admin_or_owner()) with check (is_admin_or_owner());

-- DUPLICATE_DISMISSALS (pattern A)
drop policy if exists "anon full access (interim, tightened in Phase 2)" on public.duplicate_dismissals;
drop policy if exists "read/write: admin or owner" on public.duplicate_dismissals;
create policy "read/write: admin or owner" on public.duplicate_dismissals for all using (is_admin_or_owner()) with check (is_admin_or_owner());

-- AUDIT_LOG (pattern A — read admin/owner only; insert allowed from any signed-in
-- session since logAudit() fires from ordinary user actions, not just admin ones)
drop policy if exists "anon full access (interim, tightened in Phase 2)" on public.audit_log;
drop policy if exists "read: admin or owner" on public.audit_log;
create policy "read: admin or owner" on public.audit_log for select using (is_admin_or_owner());
drop policy if exists "insert: any signed-in user" on public.audit_log;
create policy "insert: any signed-in user" on public.audit_log for insert with check (auth.uid() is not null);

-- Note: storage.objects policies (event-files, certificates buckets) are intentionally
-- left as-is (public-read) — certificate PDFs and event flyers are meant to be shared
-- via direct link (email attachments, QR codes, posters), and tightening them isn't
-- part of this phase's scope.


-- ---- from migration_phase2_fix_privilege_escalation.sql ----
-- ============================================================
-- WHMI CPD Dashboard — Phase 2 security fix
-- Closes a privilege-escalation hole in the Stage 1 migration: the "users" UPDATE RLS
-- policy only checks that a caller is updating their OWN row (auth_id = auth.uid()) — it
-- never restricted WHICH columns a self-service update could touch. In practice this meant
-- any signed-in account (including a brand-new external self-signup) could call
--   supabase.from('users').update({ role: 'admin' }).eq('id', <own id>)
-- and grant themselves admin/owner, or flip their own `verified`/`user_type` flags.
--
-- Row Level Security policies can't compare OLD vs NEW column values on their own, so the
-- fix is a BEFORE UPDATE trigger: for any caller who isn't already admin/owner, privileged
-- columns (role, user_type, verified) are silently forced back to their previous value,
-- and auth_id may only ever move from null to the caller's own uid (the one-time "claim an
-- existing seed row by email" flow already documented in migration_phase2.sql).
--
-- Run this in Supabase SQL Editor once, after migration_phase2.sql. Safe to run on a
-- database that already has real user rows — it doesn't touch existing data.
-- ============================================================

create or replace function public.protect_user_privileged_columns()
returns trigger
language plpgsql
security definer
as $$
begin
  if not public.is_admin_or_owner() then
    new.role := old.role;
    new.user_type := old.user_type;
    new.verified := old.verified;

    if old.auth_id is not null then
      new.auth_id := old.auth_id;
    elsif new.auth_id is distinct from auth.uid() then
      new.auth_id := old.auth_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_user_privileged_columns on public.users;
create trigger protect_user_privileged_columns
  before update on public.users
  for each row execute function public.protect_user_privileged_columns();


-- ---- from migration_phase2_fix2_trigger_scope.sql ----
-- ============================================================
-- WHMI CPD Dashboard — Phase 2 security fix, round 2
-- The trigger added in migration_phase2_fix_privilege_escalation.sql was too broad: it
-- blocked privileged-column changes whenever the caller wasn't admin/owner — but that
-- includes trusted server-side contexts with no JWT at all (a direct SQL Editor edit, a
-- migration, the service-role key used by Edge Functions), where auth.uid() is null and
-- is_admin_or_owner() therefore also evaluates false. Those contexts already bypass RLS by
-- design and should not be second-guessed by this trigger.
--
-- Fix: only enforce the column protection when there IS an authenticated end-user JWT
-- (auth.uid() is not null) and that user isn't admin/owner. Service-role/SQL-editor writes
-- (auth.uid() is null) pass through untouched, exactly as RLS already treats them.
--
-- Run this in Supabase SQL Editor once, after migration_phase2_fix_privilege_escalation.sql.
-- ============================================================

create or replace function public.protect_user_privileged_columns()
returns trigger
language plpgsql
security definer
as $$
begin
  if auth.uid() is not null and not public.is_admin_or_owner() then
    new.role := old.role;
    new.user_type := old.user_type;
    new.verified := old.verified;

    if old.auth_id is not null then
      new.auth_id := old.auth_id;
    elsif new.auth_id is distinct from auth.uid() then
      new.auth_id := old.auth_id;
    end if;
  end if;
  return new;
end;
$$;


-- ---- from migration_phase3.sql ----
-- ============================================================
-- WHMI CPD Dashboard — Phase 3 migration
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- Adds full event-management fields + a Storage bucket for event files.
-- ============================================================

alter table public.events
  add column if not exists description text,
  add column if not exists learning_objectives text,
  add column if not exists presenters text,        -- comma-joined display string, e.g. "Dr. A. Okafor, R. Chen"
  add column if not exists organisers text,         -- comma-joined display string
  add column if not exists supporting_staff text,   -- comma-joined display string
  add column if not exists campus text,
  add column if not exists room text,
  add column if not exists online_capacity int,
  add column if not exists in_person_capacity int,
  add column if not exists tags text[] not null default '{}';

-- Backfill presenters from the existing single-name `presenter` column so
-- nothing already seeded looks empty.
update public.events set presenters = presenter where presenters is null and presenter is not null;

-- STORAGE — bucket for flyers/slides/handouts/supporting files -------------
insert into storage.buckets (id, name, public)
values ('event-files', 'event-files', true)
on conflict (id) do nothing;

-- INTERIM policies (same permissive stance as schema.sql — tightened once
-- Phase 2 auth lands and we know who's allowed to upload/delete what).
drop policy if exists "anon full access (interim, tightened in Phase 2)" on storage.objects;
create policy "anon full access (interim, tightened in Phase 2)" on storage.objects
  for all using (bucket_id = 'event-files') with check (bucket_id = 'event-files');


-- ---- from migration_phase4.sql ----
-- ============================================================
-- WHMI CPD Dashboard — Phase 4/5 migration
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- Extends registrations with the remaining public-form fields.
-- (attendance_status already exists from the Phase 1 schema.)
-- ============================================================

alter table public.registrations
  add column if not exists profession text,
  add column if not exists campus text,
  add column if not exists attendance_type text check (attendance_type in ('Online', 'In-person')),
  add column if not exists accessibility text,
  add column if not exists comments text;


-- ---- from migration_phase6_7.sql ----
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
drop policy if exists "anon full access (interim, tightened in Phase 2)" on public.reflections;
create policy "anon full access (interim, tightened in Phase 2)" on public.reflections for all using (true) with check (true);
drop policy if exists "anon full access (interim, tightened in Phase 2)" on public.duplicate_dismissals;
create policy "anon full access (interim, tightened in Phase 2)" on public.duplicate_dismissals for all using (true) with check (true);


-- ---- from migration_phase8.sql ----
-- ============================================================
-- WHMI CPD Dashboard — Phase 8 migration
-- Real reflection/feedback form + automatic certificates & reminders.
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

-- REFLECTIONS — real form fields ------------------------------------------
alter table public.reflections
  add column if not exists relevance_rating int check (relevance_rating between 0 and 10),
  add column if not exists appropriateness text check (appropriateness in ('Too basic','Appropriate','Too advanced')),
  add column if not exists most_valuable text,
  add column if not exists improvements text,
  add column if not exists future_topics text;

alter table public.reflections drop constraint if exists reflections_rating_check;
alter table public.reflections add constraint reflections_rating_check check (rating between 0 and 10);

-- EVENTS — optional ASMIRT endorsement code --------------------------------
alter table public.events add column if not exists asmirt_code text;

-- REGISTRATIONS — reminder de-dupe guard -----------------------------------
alter table public.registrations add column if not exists reminder_sent_at timestamptz;
-- Backfill: mark all EXISTING registrations as already-reminded so the new cron
-- job doesn't mass-email everyone the moment it's enabled.
update public.registrations set reminder_sent_at = now() where reminder_sent_at is null;

-- CERTIFICATES — auto-issue support ----------------------------------------
alter table public.certificates
  add column if not exists recipient_email text,
  add column if not exists registration_id text references public.registrations(id) on delete set null,
  add column if not exists reflection_id text references public.reflections(id) on delete set null,
  add column if not exists cpd_hours numeric,
  add column if not exists pdf_path text,
  add column if not exists sent_at timestamptz;

-- STORAGE — bucket for generated certificate PDFs (mirrors event-files) ---
insert into storage.buckets (id, name, public)
  values ('certificates', 'certificates', true)
  on conflict (id) do nothing;

drop policy if exists "anon full access (interim, tightened in Phase 2)" on storage.objects;
create policy "anon full access (interim, tightened in Phase 2)" on storage.objects
  for all using (bucket_id in ('event-files', 'certificates')) with check (bucket_id in ('event-files', 'certificates'));

-- SCHEDULING — extensions needed for the 30-minute reminder cron ----------
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ============================================================
-- After deploying the Edge Functions (see supabase/functions/), run this
-- separately with the real function URL + CRON_SECRET filled in:
--
-- select cron.schedule(
--   'whmi-event-reminders',
--   '*/5 * * * *',
--   $$
--   select net.http_post(
--     url := 'https://<project-ref>.supabase.co/functions/v1/send-event-reminders',
--     headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>')
--   );
--   $$
-- );
-- ============================================================


-- ---- from migration_phase8b.sql ----
-- ============================================================
-- WHMI CPD Dashboard — Phase 8b migration
-- Reflection form tweaks: 5-point appropriateness scale (was 3-point).
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

alter table public.reflections drop constraint if exists reflections_appropriateness_check;
alter table public.reflections add constraint reflections_appropriateness_check
  check (appropriateness in ('Too basic', 'Slightly too basic', 'Appropriate', 'Slightly too advanced', 'Too advanced'));


-- ---- from migration_phase11.sql ----
-- ============================================================
-- WHMI CPD Dashboard — Phase 11 migration
-- Previous Events Archive: recording link per event.
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

alter table public.events add column if not exists recording_url text;


-- ---- from migration_phase12.sql ----
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


-- ---- from migration_phase13.sql ----
-- ============================================================
-- WHMI CPD Dashboard — Phase 13 migration
-- Adds resend tracking for the Certificates page's "Approve & Send All" / resend flow.
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

alter table public.certificates add column if not exists resend_count int not null default 0;
alter table public.certificates add column if not exists last_resent_at timestamptz;


-- ---- from migration_phase14.sql ----
-- ============================================================
-- WHMI CPD Dashboard — Phase 14 migration
-- Reflection collection is now always available via link + QR code; this adds a
-- per-event toggle for whether a follow-up email should also be sent (default on).
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

alter table public.events add column if not exists reflection_auto_email boolean not null default true;


-- ---- from migration_phase15.sql ----
-- ============================================================
-- WHMI CPD Dashboard — Phase 15 migration
--   - tags (admin-managed, reorderable event topic/tag list), seeded from the old
--     hardcoded TOPICS list
--   - events.show_reg_count_external (opt-in registration-count visibility for
--     external viewers)
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

-- TAGS ---------------------------------------------------------------------
create table if not exists public.tags (
  id text primary key,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.tags enable row level security;
drop policy if exists "read: any signed-in user" on public.tags;
create policy "read: any signed-in user" on public.tags for select using (auth.uid() is not null);
drop policy if exists "write: admin or owner" on public.tags;
create policy "write: admin or owner" on public.tags for all using (is_admin_or_owner()) with check (is_admin_or_owner());

insert into public.tags (id, name, sort_order) values
  ('tag-trauma', 'Trauma', 0),
  ('tag-msk', 'MSK', 1),
  ('tag-ct', 'CT', 2),
  ('tag-mri', 'MRI', 3),
  ('tag-leadership', 'Leadership', 4),
  ('tag-research', 'Research', 5),
  ('tag-paediatrics', 'Paediatrics', 6),
  ('tag-ultrasound', 'Ultrasound', 7)
on conflict (id) do nothing;

-- REGISTRATION COUNT VISIBILITY ---------------------------------------------
alter table public.events add column if not exists show_reg_count_external boolean not null default false;


-- ---- from migration_phase16.sql ----
-- ============================================================
-- WHMI CPD Dashboard — Phase 16 migration
--   - events.banner_focal_x / banner_focal_y: lets an admin re-centre where a
--     promotional flyer banner crops (percentage, 0-100, default 50/50 = centered).
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

alter table public.events add column if not exists banner_focal_x numeric not null default 50;
alter table public.events add column if not exists banner_focal_y numeric not null default 50;


-- ---- from migration_phase17.sql ----
-- ============================================================
-- WHMI CPD Dashboard — Phase 17 migration
--   - events.banner_zoom (crop-box resize for the promotional banner)
--   - avatar_icons / avatar_colors (admin-managed profile avatar options)
--   - cpd_types.category + replace seed data with the real ASMIRT-approved list
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

-- BANNER CROP ZOOM ----------------------------------------------------------
alter table public.events add column if not exists banner_zoom numeric not null default 1;

-- AVATAR ICONS + COLOURS -----------------------------------------------------
create table if not exists public.avatar_icons (
  id text primary key,
  kind text not null check (kind in ('builtin', 'image')),
  icon_key text,
  image_path text,
  label text not null,
  icon_scale numeric not null default 55,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.avatar_icons enable row level security;
drop policy if exists "read: any signed-in user" on public.avatar_icons;
create policy "read: any signed-in user" on public.avatar_icons for select using (auth.uid() is not null);
drop policy if exists "write: admin or owner" on public.avatar_icons;
create policy "write: admin or owner" on public.avatar_icons for all using (is_admin_or_owner()) with check (is_admin_or_owner());

create table if not exists public.avatar_colors (
  id text primary key,
  name text not null,
  hex text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.avatar_colors enable row level security;
drop policy if exists "read: any signed-in user" on public.avatar_colors;
create policy "read: any signed-in user" on public.avatar_colors for select using (auth.uid() is not null);
drop policy if exists "write: admin or owner" on public.avatar_colors;
create policy "write: admin or owner" on public.avatar_colors for all using (is_admin_or_owner()) with check (is_admin_or_owner());

insert into storage.buckets (id, name, public)
values ('avatar-icons', 'avatar-icons', true)
on conflict (id) do nothing;

drop policy if exists "anon full access (interim, tightened in Phase 2)" on storage.objects;
create policy "anon full access (interim, tightened in Phase 2)" on storage.objects
  for all using (bucket_id in ('event-files', 'certificates', 'avatar-icons')) with check (bucket_id in ('event-files', 'certificates', 'avatar-icons'));

-- Seed with the 22 existing built-in icons and 12 existing colours so nothing changes
-- visually the first time this runs.
insert into public.avatar_icons (id, kind, icon_key, label, icon_scale, sort_order) values
  ('bone', 'builtin', 'bone', 'Bones the X-ray Buddy', 55, 0),
  ('waves', 'builtin', 'waves', 'Sonar the Ultrasound Pal', 55, 1),
  ('magnet', 'builtin', 'magnet', 'Maggie the MRI Magnet', 55, 2),
  ('radiation', 'builtin', 'radiation', 'Ray the Safety Officer', 55, 3),
  ('stetho', 'builtin', 'stetho', 'Doc Stetho', 55, 4),
  ('ghost', 'builtin', 'ghost', 'Boo the Bone Ghost', 55, 5),
  ('skull', 'builtin', 'skull', 'Sherlock the Skeleton', 55, 6),
  ('hand', 'builtin', 'hand', 'Handy the Hand Bones', 55, 7),
  ('cross', 'builtin', 'cross', 'Addy the Health Cross', 55, 8),
  ('hospital', 'builtin', 'hospital', 'Hank the Hospital', 55, 9),
  ('syringe', 'builtin', 'syringe', 'Vic the Vaccinator', 55, 10),
  ('pill', 'builtin', 'pill', 'Percy the Pill', 55, 11),
  ('thermometer', 'builtin', 'thermometer', 'Tempy', 55, 12),
  ('microscope', 'builtin', 'microscope', 'Micro the Scientist', 55, 13),
  ('brain', 'builtin', 'brain', 'Brainy', 55, 14),
  ('eye', 'builtin', 'eye', 'Iris the Eye', 55, 15),
  ('briefcase', 'builtin', 'briefcase', 'Barry from Admin', 55, 16),
  ('clipboard', 'builtin', 'clipboard', 'Claire the Clipboard', 55, 17),
  ('sun', 'builtin', 'sun', 'Sunny', 55, 18),
  ('donut', 'builtin', 'donut', 'Dot the Doughnut', 55, 19),
  ('bandage', 'builtin', 'bandage', 'Bandy the Band-Aid', 55, 20),
  ('cookie', 'builtin', 'cookie', 'Cookie the Crumb', 55, 21)
on conflict (id) do nothing;

insert into public.avatar_colors (id, name, hex, sort_order) values
  ('avcolor-green', 'green', '#9CCB3B', 0),
  ('avcolor-blue', 'blue', '#35A8DD', 1),
  ('avcolor-purple', 'purple', '#7B3FE4', 2),
  ('avcolor-grey', 'grey', '#58595B', 3),
  ('avcolor-teal', 'teal', '#14B8A6', 4),
  ('avcolor-orange', 'orange', '#F59E0B', 5),
  ('avcolor-rose', 'rose', '#F43F5E', 6),
  ('avcolor-red', 'red', '#EF4444', 7),
  ('avcolor-indigo', 'indigo', '#6366F1', 8),
  ('avcolor-cyan', 'cyan', '#06B6D4', 9),
  ('avcolor-pink', 'pink', '#EC4899', 10),
  ('avcolor-lime', 'lime', '#84CC16', 11)
on conflict (id) do nothing;

-- CPD TYPES: category field + real ASMIRT list -----------------------------
alter table public.cpd_types add column if not exists category text;

delete from public.cpd_types;

insert into public.cpd_types (id, name, appellation_code, category) values
  ('cpd-competency-training-programs', 'Competency Training Programs', 'WSTRNH-002848', 'Audit & QA'),
  ('cpd-cpd-meetings', 'CPD Meetings', 'WSTRNH-002850', 'Skill Development/ Workplace Learning'),
  ('cpd-creation-of-a-hi-5-presentation', 'Creation of a ''Hi-5'' Presentation', 'WSTRNH-003659', 'Skill Development'),
  ('cpd-fluorsocopy-masterclass', 'Fluorsocopy Masterclass', 'WSTRNH-003363', 'Skill Development/ Workplace Learning'),
  ('cpd-intern-presentation-evening', 'Intern Presentation Evening', 'WSTRNH-002849', 'Professional Activity/ Organised Program'),
  ('cpd-monthly-plain-film-audit', 'Monthly Plain Film Audit', 'WSTRNH-002853', 'Audit & QA'),
  ('cpd-performance-appraisals', 'Performance Appraisals', 'WSTRNH-002852', 'Audit & QA'),
  ('cpd-physics-tutorials', 'Physics Tutorials', 'WSTRNH-003366', 'Skill Development/ Workplace Learning'),
  ('cpd-preliminary-image-evaluation-pie-lecture', 'Preliminary Image Evaluation (PIE) Lecture', 'WSTRNH-003856', 'Organised Program'),
  ('cpd-radiology-a3-projects', 'Radiology A3 Projects', 'WSTRNH-002857', 'Audit & QA'),
  ('cpd-radiology-intern-ultrasound-trainee-tutorial-program', 'Radiology Intern / Ultrasound Trainee Tutorial Program', 'WSTRNH-002856', 'Skill Development/ Workplace Learning'),
  ('cpd-radiology-journal-club', 'Radiology Journal Club', 'WSTRNH-002855', 'Professional Activity/ Organised Program'),
  ('cpd-radiology-online-learning-modules', 'Radiology Online Learning Modules', 'WSTRNH-003463', 'Skill Development'),
  ('cpd-review-of-a-hi-5-presentation', 'Review of a ''Hi-5'' Presentation', 'WSTRNH-003660', 'Self-Directed Learning'),
  ('cpd-ultrasound-presentation-in-meetings', 'Ultrasound Presentation in Meetings', 'WSTRNH-003857', 'Organised Program'),
  ('cpd-website-quiz', 'Website Quiz', 'WSTRNH-003365', 'Self-Directed Learning'),
  ('cpd-website-reviews', 'Website Reviews', 'WSTRNH-003661', 'Self-Directed Learning'),
  ('cpd-weekly-intern-tutorial', 'Weekly Intern Tutorial', 'WSTRNH-003364', 'Skill Development/ Workplace Learning'),
  ('cpd-western-health-medical-imaging-lecture', 'Western Health Medical Imaging Lecture', 'WSTRNH-003858', 'Organised Program')
on conflict (id) do update set name = excluded.name, appellation_code = excluded.appellation_code, category = excluded.category;


-- ---- from migration_phase18.sql ----
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


-- ---- from migration_phase19.sql ----
-- ============================================================
-- WHMI CPD Dashboard — Phase 19 migration
--   - brainstorm_ideas.category (lets ideas be sorted into Topics/CPD Types,
--     Event Delivery Types, Presenters, and Location sections)
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

alter table public.brainstorm_ideas add column if not exists category text not null default 'other';


-- ---- from migration_phase20.sql ----
-- ============================================================
-- WHMI CPD Dashboard — Phase 20 migration
--   - brainstorm_ideas.source: allow 'member' (a signed-in non-admin/owner user
--     suggesting an idea from the Dashboard or Upcoming Events, as opposed to
--     'admin' composing directly in the Brainstorming tab or 'public' via the
--     no-login QR/link form)
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- Run migration_phase19.sql first if you haven't already (adds the category column).
-- ============================================================

alter table public.brainstorm_ideas drop constraint if exists brainstorm_ideas_source_check;
alter table public.brainstorm_ideas add constraint brainstorm_ideas_source_check check (source in ('admin', 'public', 'member'));


-- ---- from migration_phase21.sql ----
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


-- ---- from migration_phase22.sql ----
-- ============================================================
-- WHMI CPD Dashboard — Phase 22 migration
--   - users.profession / users.department, captured during onboarding
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

alter table public.users add column if not exists profession text;
alter table public.users add column if not exists department text;

