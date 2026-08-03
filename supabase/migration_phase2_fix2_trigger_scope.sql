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
