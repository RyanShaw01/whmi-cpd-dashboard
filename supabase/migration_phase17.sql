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
