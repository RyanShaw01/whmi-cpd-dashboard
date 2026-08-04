-- ============================================================
-- Diagnostic — run in Supabase SQL Editor and share the results.
-- Checks whether admin/owner accounts' auth_id correctly links to a real
-- signed-in identity. If auth_id is null, or doesn't match any row in the
-- second query, that account's writes will be silently blocked by RLS
-- (is_admin_or_owner() returns false), which matches the "couldn't save"
-- behaviour being seen on event edits and the banner crop.
-- ============================================================

-- 1. Every admin/owner account and whether it has an auth_id set
select id, name, email, role, auth_id, verified
from public.users
where role in ('admin', 'owner')
order by role, name;

-- 2. Every real signed-in identity Supabase Auth knows about
select id, email, created_at, confirmed_at
from auth.users
order by created_at desc
limit 30;
