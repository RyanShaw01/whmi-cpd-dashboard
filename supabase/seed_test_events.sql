-- ============================================================
-- WHMI CPD Dashboard — sample "Test" events
--   Adds a handful of upcoming events (spread over the next ~3 months) and
--   a handful of completed/previous events, all titled "Test ..." so
--   they're easy to spot and delete afterwards. Safe to run more than
--   once — ids are fixed, so re-running just updates the same rows
--   (on conflict do update) rather than duplicating them.
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query).
-- To remove them again afterwards:
--   delete from public.events where id like 'test-%';
-- ============================================================

insert into public.events
  (id, title, topic, date, start_time, end_time, location, campus, mode, presenter,
   capacity, registered, waitlist, status, tags)
values
  ('test-up-1', 'Test Ultrasound-Guided Procedures Workshop', 'Ultrasound',
   current_date + interval '9 days', '09:00', '12:00', 'Education Wing', 'Sunshine Hospital',
   'In-person', 'Dr. Sarah Chen', 30, 12, 0, 'Registration Open', array['Ultrasound']),

  ('test-up-2', 'Test CT Protocol Updates 2026', 'CT',
   current_date + interval '23 days', '13:00', '15:00', 'Seminar Room 2', 'Footscray Hospital',
   'Hybrid', 'James Okafor', 40, 25, 0, 'Registration Open', array['CT']),

  ('test-up-3', 'Test MRI Safety Refresher', 'MRI',
   current_date + interval '38 days', '10:00', '11:30', null, null,
   'Online', 'Priya Nair', null, 8, 0, 'Registration Open', array['MRI']),

  ('test-up-4', 'Test Paediatric Imaging Grand Round', 'Skill Development',
   current_date + interval '55 days', '12:00', '13:00', 'Lecture Theatre 1', 'Williamstown Hospital',
   'In-person', 'Dr. Michael Tran', 60, 3, 0, 'Draft', array[]::text[]),

  ('test-up-5', 'Test Nuclear Medicine Case Review', 'Nuclear medicine',
   current_date + interval '71 days', '14:00', '16:00', 'Education Wing', 'Sunshine Hospital',
   'In-person', 'Dr. Amara Osei', 25, 0, 0, 'Awaiting Approval', array['Nuclear medicine']),

  ('test-up-6', 'Test DSA Interventional Techniques', 'DSA',
   current_date + interval '86 days', '09:30', '12:30', 'Cath Lab Training Suite', 'Footscray Hospital',
   'In-person', 'Dr. Liam Fitzgerald', 20, 6, 0, 'Registration Open', array['DSA'])
on conflict (id) do update set
  title = excluded.title, topic = excluded.topic, date = excluded.date,
  start_time = excluded.start_time, end_time = excluded.end_time, location = excluded.location,
  campus = excluded.campus, mode = excluded.mode, presenter = excluded.presenter,
  capacity = excluded.capacity, registered = excluded.registered, status = excluded.status,
  tags = excluded.tags;

insert into public.events
  (id, title, topic, date, start_time, end_time, location, campus, mode, presenter,
   capacity, registered, waitlist, status, tags, attendance, feedback)
values
  ('test-prev-1', 'Test Radiographic Positioning Masterclass', 'Skill Development',
   current_date - interval '18 days', '09:00', '12:00', 'Education Wing', 'Sunshine Hospital',
   'In-person', 'Dr. Sarah Chen', 30, 27, 0, 'Completed', array['X-Ray'], 24, 8.6),

  ('test-prev-2', 'Test Contrast Reaction Management', 'Audit & QA',
   current_date - interval '34 days', '13:00', '14:30', 'Seminar Room 2', 'Footscray Hospital',
   'Hybrid', 'James Okafor', 40, 33, 0, 'Completed', array['CT'], 29, 7.9),

  ('test-prev-3', 'Test MRI Quench Response Drill', 'Audit & QA',
   current_date - interval '52 days', '10:00', '11:00', 'MRI Suite', 'Williamstown Hospital',
   'In-person', 'Priya Nair', 15, 15, 0, 'Completed', array['MRI'], 14, 9.1),

  ('test-prev-4', 'Test Breast Imaging Case Conference', 'Self-Directed Learning',
   current_date - interval '75 days', '12:00', '13:30', 'Lecture Theatre 1', 'Williamstown Hospital',
   'In-person', 'Dr. Michael Tran', 50, 41, 0, 'Completed', array['Mammography'], 38, 8.2),

  ('test-prev-5', 'Test Nuclear Medicine Dosimetry Update', 'Organised Program',
   current_date - interval '95 days', '14:00', '16:00', 'Education Wing', 'Sunshine Hospital',
   'Online', 'Dr. Amara Osei', null, 19, 0, 'Completed', array['Nuclear medicine'], 17, 7.5)
on conflict (id) do update set
  title = excluded.title, topic = excluded.topic, date = excluded.date,
  start_time = excluded.start_time, end_time = excluded.end_time, location = excluded.location,
  campus = excluded.campus, mode = excluded.mode, presenter = excluded.presenter,
  capacity = excluded.capacity, registered = excluded.registered, status = excluded.status,
  tags = excluded.tags, attendance = excluded.attendance, feedback = excluded.feedback;
