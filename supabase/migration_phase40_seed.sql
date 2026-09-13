-- ============================================================
-- WHMI CPD Dashboard — Phase 40 seed data (optional)
-- Starting set for Browse External CPD, captured from the providers' own listing pages on
-- 2026-09-13. Run AFTER migration_phase40.sql. Safe to re-run (on conflict do nothing), and
-- entirely optional - you can skip this and add listings yourself in Settings instead.
--
-- ASMIRT costs aren't shown on their listing page, only on each event's own page, so cost is
-- left blank rather than guessed. Fill any in via Settings > CPD Configuration.
-- ============================================================

insert into public.external_cpd_events (id, title, provider, url, event_date, cost, location, notes) values
  ('xcpd_asmirt_01', 'SA/NT Dial A CPD', 'ASMIRT', 'https://asmirt.org/events/sa-nt-dial-a-cpd/', '2026-09-14', null, 'Online', null),
  ('xcpd_asmirt_02', 'SA/NT Branch Annual Meeting 2026', 'ASMIRT', 'https://asmirt.org/events/sa-nt-branch-annual-meeting-2026/', '2026-10-01', null, 'Online', null),
  ('xcpd_asmirt_03', 'Vic Branch Annual Meeting 2026', 'ASMIRT', 'https://asmirt.org/events/vic-branch-annual-meeting-2026/', '2026-10-06', null, 'Online', null),
  ('xcpd_asmirt_04', 'NSW/ACT Branch Annual Meeting 2026', 'ASMIRT', 'https://asmirt.org/events/nsw-branch-annual-meeting-2026/', '2026-10-06', null, 'Online', null),
  ('xcpd_asmirt_05', 'SA/NT Branch Student Paper Night', 'ASMIRT', 'https://asmirt.org/events/sa-nt-student-paper-night-2/', '2026-10-07', null, 'Royal Adelaide Hospital, Adelaide', null),
  ('xcpd_asmirt_06', 'QLD Student Paper Night', 'ASMIRT', 'https://asmirt.org/events/qld-student-paper-night/', '2026-10-08', null, 'Cliftons and Online', null),
  ('xcpd_asmirt_07', 'QLD Adolescent & Young Adults & Annual Branch Meeting', 'ASMIRT', 'https://asmirt.org/events/qld-adolescent-young-adults-annual-branch-meeting/', '2026-10-12', null, 'Online', null),
  ('xcpd_asmirt_08', 'NSW/ACT Student Paper Night', 'ASMIRT', 'https://asmirt.org/events/nsw-act-student-paper-night-2026/', '2026-10-14', null, 'In Person & Online', null),
  ('xcpd_asmirt_09', 'WA Branch Annual Meeting', 'ASMIRT', 'https://asmirt.org/events/wa-branch-annual-meeting/', '2026-10-14', null, 'Online', null),
  ('xcpd_asmirt_10', 'Tas Branch Annual Meeting 2026', 'ASMIRT', 'https://asmirt.org/events/tas-branch-annual-meeting-2026/', '2026-10-14', null, 'Online', null),
  ('xcpd_asmirt_11', 'VIC Branch Student Paper Day', 'ASMIRT', 'https://asmirt.org/events/vic-student-paper-day-2/', '2026-10-17', null, 'Peter MacCallum Cancer Centre, Melbourne', null),
  ('xcpd_asmirt_12', 'IV Cannulation and Radiographic Contrast Media Workshop', 'ASMIRT', 'https://asmirt.org/events/iv-cannulation-and-radiographic-contrast-media-workshop-5/', '2026-10-17', null, 'Online', null),
  ('xcpd_asmirt_13', 'SA Branch Spooky Quiz Night', 'ASMIRT', 'https://asmirt.org/events/sa-quiz-night/', '2026-10-17', null, 'West Oak Hotel, Adelaide', null),
  ('xcpd_asmirt_14', 'ASMIRT Chat With... Steve Lacey', 'ASMIRT', 'https://asmirt.org/events/asmirt-chat-with-steve-lacey/', '2026-10-20', null, 'Online', null),
  ('xcpd_asmirt_15', 'NSW Branch Roll Beyond the Beam', 'ASMIRT', 'https://asmirt.org/events/nsw-branch-roll-beyond-the-beam/', '2026-10-23', null, 'I-Play Ed Square Soldiers Parade, Edmonson Park', null),
  ('xcpd_asmirt_16', 'VIC CEC Double Exposure: Two Workshops - One PD Day', 'ASMIRT', 'https://asmirt.org/events/vic-cec-double-exposure-two-workshops-one-pd-day/', '2026-11-14', null, 'Footscray Hospital Auditorium', null),
  ('xcpd_rab_rabinars', 'RABinars — monthly radiology webinars', 'Radiology Across Borders', 'https://legacy.radiologyacrossborders.org/teleconferences', null, 'Free', 'Online', 'Monthly online sessions for radiologists.'),
  ('xcpd_rab_rabitts', 'RABitts — monthly webinars for radiographers & sonographers', 'Radiology Across Borders', 'https://legacy.radiologyacrossborders.org/teleconferences', null, 'Free', 'Online', 'Sister programme to RABinars, aimed at technologists.')
on conflict (id) do nothing;
