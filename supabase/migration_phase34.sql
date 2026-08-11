-- ============================================================
-- WHMI CPD Dashboard — Phase 34 migration
-- Let the public (no login) see an event's promotional flyer/banner on the public event and
-- reflection pages, without opening up every other uploaded file (slides, handouts, supporting
-- materials) to anonymous visitors.
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

-- Phase 2 locked `files` SELECT down to "any signed-in user" (see migration_phase2.sql). That's
-- correct for internal materials, but it also meant the public event page - reachable with no
-- account via a QR code or an emailed registration link - could never see the event's flyer,
-- since eventBannerUrl() only ever looks at files with kind = 'flyer' regardless of who's asking.
--
-- RLS policies are OR'd together per operation, so this adds permission rather than replacing
-- the existing one: signed-in users still see every file kind (unchanged), and everyone -
-- signed in or not - can now additionally see just the flyer.
drop policy if exists "read: anyone can see the promotional flyer" on public.files;
create policy "read: anyone can see the promotional flyer" on public.files
  for select using (kind = 'flyer');

-- ============================================================
-- If the poster/banner still doesn't render after this, the other half of the picture is the
-- `event-files` Storage bucket itself: Storage > event-files > check it's marked "Public" (the
-- app calls getPublicUrl() for flyers, which only serves actual bytes without a signed URL when
-- the bucket is public - this SQL policy alone doesn't change bucket-level Storage settings).
-- ============================================================
