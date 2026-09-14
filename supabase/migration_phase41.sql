-- ============================================================
-- WHMI CPD Dashboard — Phase 41 migration
-- Makes the four toggles under Settings > Automated Email Reminders real.
--
-- Until now all four were local React state that nothing ever read: two of them described
-- features that didn't exist (pre-event reminders, weekly digest) and two described behaviour
-- that always happened regardless of the switch (waitlist promotion, certificate auto-approval).
-- None of them persisted either - flipping one and reloading sprang it back.
--
-- Two things are needed for them to work:
--   1. somewhere to store the settings that the edge functions can also read, and
--   2. per-registration tracking of which pre-event reminders have already gone out, so nobody
--      gets the same one twice (reminder_sent_at already exists but is taken - it tracks the
--      post-event "please reflect" email).
--
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

-- Which of the three pre-event reminders each registration has had: any of 'week', 'day', 'hour'.
-- An array rather than three booleans so adding a fourth window later needs no schema change.
alter table public.registrations
  add column if not exists reminders_sent text[] not null default '{}';

-- Settings live in the same generic key/value store as email_template_overrides, so the edge
-- functions can read them with the service role exactly the way they already read those.
-- Inserted only if absent, so re-running never clobbers choices already made in the app.
insert into public.app_settings (key, value)
values (
  'automation_settings',
  '{"emailReminders": true, "autoWaitlist": true, "autoApproveCerts": true}'::jsonb
)
on conflict (key) do nothing;

-- Speeds up the cron's "who still needs this reminder" scan once there are a lot of rows.
create index if not exists registrations_reminders_sent_idx
  on public.registrations using gin (reminders_sent);
