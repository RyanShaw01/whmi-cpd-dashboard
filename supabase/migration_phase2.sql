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
create policy "read: any signed-in user" on public.users for select using (auth.uid() is not null);
-- Update covers three cases: (1) admin/owner editing anyone, (2) a user editing their
-- already-linked own row, (3) a first-time real login "claiming" a pre-existing seed
-- row by email match (auth_id still null) to set auth_id on it. The with_check always
-- requires the resulting auth_id to be the caller's own uid, so no one can hijack
-- another row by pointing its auth_id at themselves.
create policy "update: self, claim-by-email, or admin" on public.users for update
  using (is_admin_or_owner() or auth_id = auth.uid() or (auth_id is null and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))))
  with check (is_admin_or_owner() or auth_id = auth.uid());
create policy "insert: admin or self-provisioning" on public.users for insert
  with check (is_admin_or_owner() or auth_id = auth.uid());
create policy "delete: admin only" on public.users for delete using (is_admin_or_owner());

-- LOGIN_EMAILS (system table — only admin/owner or the linked user manage it directly;
-- the app itself uses the anon/authenticated client, so self-provisioning insert is allowed)
alter table public.login_emails enable row level security;
-- A caller can always look up the login_emails row for the email they just
-- authenticated with (needed right after OTP verify, before their users row may
-- even exist) — this is what makes the "returning user?" lookup work for
-- everyone, not just admins. Cross-checking *other* people's emails is admin-only.
create policy "read: admin, owner, or own auth email" on public.login_emails for select
  using (is_admin_or_owner() or email = lower(coalesce(auth.jwt() ->> 'email', '')));
create policy "insert: admin or self" on public.login_emails for insert
  with check (is_admin_or_owner() or email = lower(coalesce(auth.jwt() ->> 'email', '')));
create policy "update: admin only" on public.login_emails for update using (is_admin_or_owner());
create policy "delete: admin only" on public.login_emails for delete using (is_admin_or_owner());

-- STAFF (pattern A)
drop policy if exists "anon full access (interim, tightened in Phase 2)" on public.staff;
create policy "read: any signed-in user" on public.staff for select using (auth.uid() is not null);
create policy "write: admin or owner" on public.staff for all using (is_admin_or_owner()) with check (is_admin_or_owner());

-- EVENTS (pattern A)
drop policy if exists "anon full access (interim, tightened in Phase 2)" on public.events;
create policy "read: any signed-in user" on public.events for select using (auth.uid() is not null);
create policy "write: admin or owner" on public.events for all using (is_admin_or_owner()) with check (is_admin_or_owner());
-- events also need to stay readable by the *public* event page (no login) — that page
-- only ever needs Registration Open events, so allow anon read scoped to that status.
create policy "public read: registration-open events" on public.events for select
  to anon using (status = 'Registration Open');

-- REGISTRATIONS (pattern B, plus anonymous public insert for the no-login QR flow)
drop policy if exists "anon full access (interim, tightened in Phase 2)" on public.registrations;
create policy "read: admin, owner, or own" on public.registrations for select
  using (is_admin_or_owner() or user_id = (select user_id from public.current_app_user()));
create policy "insert: signed-in self or public" on public.registrations for insert
  with check (true); -- covers both logged-in self-registration and anonymous QR registration
create policy "update/delete: admin or owner" on public.registrations for update using (is_admin_or_owner()) with check (is_admin_or_owner());
create policy "delete: admin or owner" on public.registrations for delete using (is_admin_or_owner());

-- EXTERNAL_PARTICIPANTS (pattern C — anonymous insert allowed, read/write locked down)
drop policy if exists "anon full access (interim, tightened in Phase 2)" on public.external_participants;
create policy "insert: anyone" on public.external_participants for insert with check (true);
create policy "read/update/delete: admin or owner" on public.external_participants for select using (is_admin_or_owner());
create policy "update: admin or owner" on public.external_participants for update using (is_admin_or_owner());
create policy "delete: admin or owner" on public.external_participants for delete using (is_admin_or_owner());

-- CERTIFICATES (pattern B)
drop policy if exists "anon full access (interim, tightened in Phase 2)" on public.certificates;
create policy "read: admin, owner, or recipient" on public.certificates for select
  using (is_admin_or_owner() or lower(recipient_email) in (select lower(email) from public.login_emails where user_id = (select user_id from public.current_app_user())));
create policy "write: admin or owner" on public.certificates for all using (is_admin_or_owner()) with check (is_admin_or_owner());
-- the certificate Edge Function uses the service-role key (bypasses RLS entirely), so
-- automatic cert issuance is unaffected by this tightening.

-- REFLECTIONS (pattern B, plus anonymous public insert for the no-login reflection form)
drop policy if exists "anon full access (interim, tightened in Phase 2)" on public.reflections;
create policy "read: admin, owner, or own" on public.reflections for select
  using (is_admin_or_owner() or lower(email) in (select lower(email) from public.login_emails where user_id = (select user_id from public.current_app_user())));
create policy "insert: anyone" on public.reflections for insert with check (true);
create policy "update/delete: admin or owner" on public.reflections for update using (is_admin_or_owner()) with check (is_admin_or_owner());
create policy "delete: admin or owner" on public.reflections for delete using (is_admin_or_owner());

-- FILES (pattern A)
drop policy if exists "anon full access (interim, tightened in Phase 2)" on public.files;
create policy "read: any signed-in user" on public.files for select using (auth.uid() is not null);
create policy "write: admin or owner" on public.files for all using (is_admin_or_owner()) with check (is_admin_or_owner());

-- DUPLICATE_DISMISSALS (pattern A)
drop policy if exists "anon full access (interim, tightened in Phase 2)" on public.duplicate_dismissals;
create policy "read/write: admin or owner" on public.duplicate_dismissals for all using (is_admin_or_owner()) with check (is_admin_or_owner());

-- AUDIT_LOG (pattern A — read admin/owner only; insert allowed from any signed-in
-- session since logAudit() fires from ordinary user actions, not just admin ones)
drop policy if exists "anon full access (interim, tightened in Phase 2)" on public.audit_log;
create policy "read: admin or owner" on public.audit_log for select using (is_admin_or_owner());
create policy "insert: any signed-in user" on public.audit_log for insert with check (auth.uid() is not null);

-- Note: storage.objects policies (event-files, certificates buckets) are intentionally
-- left as-is (public-read) — certificate PDFs and event flyers are meant to be shared
-- via direct link (email attachments, QR codes, posters), and tightening them isn't
-- part of this phase's scope.
