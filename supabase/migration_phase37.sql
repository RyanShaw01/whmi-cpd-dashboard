-- ============================================================
-- WHMI CPD Dashboard — Phase 37 migration
-- Per-recipient email send log: every outbound email (registration confirmations, thank-yous,
-- reminders, certificates, presenter thank-yous, test sends, etc.) writes one row here so admins
-- can see exactly who was emailed what, and when. Written only by edge functions using the
-- service-role key (bypasses RLS) - there is deliberately no insert policy for anon/authenticated,
-- so this can only ever be populated server-side.
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query), once.
-- ============================================================

create table if not exists public.email_log (
  id text primary key,
  event_id text references public.events(id) on delete set null,
  recipient_email text not null,
  recipient_name text,
  template_key text not null,
  status text not null default 'sent', -- 'sent' | 'failed'
  error text,
  sent_at timestamptz not null default now()
);

create index if not exists email_log_event_id_idx on public.email_log(event_id);
create index if not exists email_log_sent_at_idx on public.email_log(sent_at desc);

alter table public.email_log enable row level security;

drop policy if exists "read: admin or owner" on public.email_log;
create policy "read: admin or owner" on public.email_log for select using (is_admin_or_owner());
