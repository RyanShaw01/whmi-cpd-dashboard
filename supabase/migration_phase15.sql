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
