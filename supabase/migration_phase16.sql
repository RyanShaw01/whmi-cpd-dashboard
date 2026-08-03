-- ============================================================
-- WHMI CPD Dashboard — Phase 16 migration
--   - events.banner_focal_x / banner_focal_y: lets an admin re-centre where a
--     promotional flyer banner crops (percentage, 0-100, default 50/50 = centered).
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

alter table public.events add column if not exists banner_focal_x numeric not null default 50;
alter table public.events add column if not exists banner_focal_y numeric not null default 50;
