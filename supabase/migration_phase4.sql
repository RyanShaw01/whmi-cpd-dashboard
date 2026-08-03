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
