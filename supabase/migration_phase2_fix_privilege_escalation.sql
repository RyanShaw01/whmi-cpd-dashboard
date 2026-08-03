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
