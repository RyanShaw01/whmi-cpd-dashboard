-- ============================================================
-- WHMI CPD Dashboard — bulk-add 16 Western Health staff as Owners
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- After running, use the "Add to Staff" button in Settings > Team Access
-- to link these accounts into the Staff Directory.
-- ============================================================

insert into public.users (id, name, email, role, avatar_id, avatar_color, user_type, verified, onboarded)
values
  ('u_owner_' || gen_random_uuid(), 'Adam Steward',       'Adam.Steward@wh.org.au',    'owner', 'bone',   'blue',   'internal', true, false),
  ('u_owner_' || gen_random_uuid(), 'Jessica Fell',        'Jessica.Fell@wh.org.au',    'owner', 'waves',  'purple', 'internal', true, false),
  ('u_owner_' || gen_random_uuid(), 'Jessica Watson',      'Jessica.Watson@wh.org.au',  'owner', 'magnet', 'green',  'internal', true, false),
  ('u_owner_' || gen_random_uuid(), 'Pempe Akdemir',       'Pempe.Akdemir@wh.org.au',   'owner', 'bone',   'teal',   'internal', true, false),
  ('u_owner_' || gen_random_uuid(), 'Monica Cottee',       'Monica.Cottee1@wh.org.au',  'owner', 'waves',  'orange', 'internal', true, false),
  ('u_owner_' || gen_random_uuid(), 'Magdalena Dolic',     'Magdalena.Dolic@wh.org.au', 'owner', 'magnet', 'rose',   'internal', true, false),
  ('u_owner_' || gen_random_uuid(), 'Harrison Nguyen',     'Harrison.Nguyen@wh.org.au', 'owner', 'bone',   'red',    'internal', true, false),
  ('u_owner_' || gen_random_uuid(), 'Grace Liu',           'Grace.Liu2@wh.org.au',      'owner', 'waves',  'indigo', 'internal', true, false),
  ('u_owner_' || gen_random_uuid(), 'Lachlan Arthur',      'Lachlan.Arthur@wh.org.au',  'owner', 'magnet', 'cyan',   'internal', true, false),
  ('u_owner_' || gen_random_uuid(), 'Talishia Higginson',  'Talishia.Scutella@wh.org.au', 'owner', 'bone', 'pink',   'internal', true, false),
  ('u_owner_' || gen_random_uuid(), 'Tate Brazil',         'Tate.Brazil@wh.org.au',     'owner', 'waves',  'lime',   'internal', true, false),
  ('u_owner_' || gen_random_uuid(), 'Trinh Tran',          'Trinh.Tran@wh.org.au',      'owner', 'magnet', 'blue',   'internal', true, false),
  ('u_owner_' || gen_random_uuid(), 'Van Le',              'Vicky.Le@wh.org.au',        'owner', 'bone',   'purple', 'internal', true, false),
  ('u_owner_' || gen_random_uuid(), 'Shivani Verma',       'Shivani.Verma@wh.org.au',   'owner', 'waves',  'green',  'internal', true, false),
  ('u_owner_' || gen_random_uuid(), 'Willis Duong',        'Willis.Duong@wh.org.au',    'owner', 'magnet', 'teal',   'internal', true, false),
  ('u_owner_' || gen_random_uuid(), 'Adriana Jovevski',    'Adriana.Jovevski@wh.org.au','owner', 'bone',   'orange', 'internal', true, false)
on conflict (email) do nothing;
