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
