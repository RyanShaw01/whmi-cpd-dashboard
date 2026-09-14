// Invoked on a schedule by pg_cron/pg_net (see supabase/migration_phase8.sql), never by a
// user - protected by a shared secret instead of a user session. Finds events that ended
// 25-40 minutes ago and emails a reminder to every registrant who hasn't been reminded yet.
//
// IMPORTANT: must always be deployed with `--no-verify-jwt` - pg_cron authenticates with
// CRON_SECRET, not a real Supabase-issued JWT. Leaving the platform's own JWT check on (the
// default on a plain deploy) makes every cron invocation get rejected with 401 before this
// file's code ever runs. See complete-finished-events/index.ts, which regressed exactly this way.
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendEmail } from "../_shared/mailer.ts";
import { thankYouEmailText, thankYouEmailHtml, thankYouEmailSubject } from "../_shared/emailTemplate.ts";
import { getEmailOverride } from "../_shared/emailOverrides.ts";
import { eventReminderSubject, eventReminderText, eventReminderHtml } from "../_shared/emailTemplate.ts";

/* Pre-event reminder windows. Each fires once per registration, tracked in
 * registrations.reminders_sent so a re-run (or a cron that fires more often than expected)
 * can't double-send. The window is generous enough that a missed tick still catches up, and
 * the recorded tag is what stops a duplicate - not the timing. */
const REMINDER_WINDOWS = [
  { tag: "week", label: "next week", minMinutes: 6 * 24 * 60, maxMinutes: 8 * 24 * 60 },
  { tag: "day", label: "tomorrow", minMinutes: 20 * 60, maxMinutes: 28 * 60 },
  { tag: "hour", label: "in about an hour", minMinutes: 30, maxMinutes: 120 },
];

function fmtDateLong(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function fmtTime12h(t?: string | null): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

const CRON_SECRET = Deno.env.get("CRON_SECRET");
const SITE_URL = Deno.env.get("SITE_URL") || "http://localhost:5173";
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

Deno.serve(async (req) => {
  const auth = req.headers.get("Authorization");
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401 });
  }

  try {
    const { data: settingsRow } = await supabase.from("app_settings").select("value").eq("key", "automation_settings").maybeSingle();
    const settings = settingsRow?.value || {};
    // Absent setting means "on": the feature shipped enabled, and a missing row shouldn't
    // silently stop reminders going out.
    const remindersEnabled = settings.emailReminders !== false;

    const now = new Date();
    const windowStart = new Date(now.getTime() - 3 * 86400000).toISOString().slice(0, 10); // small lookback window is enough; time-window check below is the real gate
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("id, title, date, end_time")
      .gte("date", windowStart)
      .not("end_time", "is", null);
    if (eventsError) throw eventsError;

    let remindersSent = 0;
    let preEventSent = 0;

    if (remindersEnabled) {
      const { data: upcoming, error: upcomingError } = await supabase
        .from("events")
        .select("id, title, date, start_time, end_time, location, campus, mode, meeting_url, status")
        .gte("date", now.toISOString().slice(0, 10))
        .not("start_time", "is", null)
        .in("status", ["Registration Open", "Registration Closed", "Open (No Registration Needed)"]);
      if (upcomingError) {
        console.error("fetch upcoming events failed", upcomingError);
      } else {
        for (const event of upcoming || []) {
          const start = new Date(`${event.date}T${event.start_time}:00`);
          const minutesUntil = (start.getTime() - now.getTime()) / 60000;
          const window = REMINDER_WINDOWS.find(w => minutesUntil >= w.minMinutes && minutesUntil <= w.maxMinutes);
          if (!window) continue;

          const { data: regs, error: regErr } = await supabase
            .from("registrations")
            .select("id, name, email, reminders_sent")
            .eq("event_id", event.id)
            .in("attendance_status", ["Registered", "Attended"]);
          if (regErr) { console.error("fetch registrations failed", event.id, regErr); continue; }

          const override = await getEmailOverride(supabase, "event_reminder", event.title);
          const dateLabel = fmtDateLong(event.date);
          const timeLabel = `${fmtTime12h(event.start_time)}${event.end_time ? ` - ${fmtTime12h(event.end_time)}` : ""}`;
          const locationLabel = [event.campus, event.location].filter(Boolean).join(" - ");
          const eventUrl = `${SITE_URL}/event/${event.id}`;

          for (const reg of regs || []) {
            if ((reg.reminders_sent || []).includes(window.tag)) continue;
            const result = await sendEmail({
              to: reg.email,
              subject: eventReminderSubject(event.title, window.label, override),
              text: eventReminderText(reg.name, event.title, window.label, dateLabel, timeLabel, eventUrl),
              html: eventReminderHtml({
                name: reg.name, title: event.title, whenLabel: window.label,
                date: dateLabel, time: timeLabel, location: locationLabel || null,
                eventUrl, meetingUrl: event.meeting_url, mode: event.mode, override,
              }),
              log: { templateKey: "event_reminder", eventId: event.id, recipientName: reg.name },
            });
            if (result.ok) {
              // Appended, not replaced, so the other two windows' tags survive.
              await supabase.from("registrations")
                .update({ reminders_sent: [...(reg.reminders_sent || []), window.tag] })
                .eq("id", reg.id);
              preEventSent++;
            } else {
              console.error("pre-event reminder failed", reg.id, result.error);
            }
          }
        }
      }
    }

    for (const event of events || []) {
      const end = new Date(`${event.date}T${event.end_time}:00`);
      const minutesSinceEnd = (now.getTime() - end.getTime()) / 60000;
      if (minutesSinceEnd < 25 || minutesSinceEnd > 40) continue;

      const { data: registrations, error: regError } = await supabase
        .from("registrations")
        .select("id, name, email")
        .eq("event_id", event.id)
        .in("attendance_status", ["Registered", "Attended"])
        .eq("is_presenter", false)
        .is("reminder_sent_at", null);
      if (regError) { console.error("fetch registrations failed", event.id, regError); continue; }

      const override = await getEmailOverride(supabase, "post_event_thank_you", event.title);
      for (const reg of registrations || []) {
        const reflectUrl = `${SITE_URL}/event/${event.id}/reflect`;
        const result = await sendEmail({
          to: reg.email,
          subject: thankYouEmailSubject(event.title, override),
          text: thankYouEmailText(reg.name, event.title, reflectUrl, override),
          html: thankYouEmailHtml(reg.name, event.title, reflectUrl, override),
          log: { templateKey: "post_event_thank_you", eventId: event.id, recipientName: reg.name },
        });
        if (result.ok) {
          await supabase.from("registrations").update({ reminder_sent_at: new Date().toISOString() }).eq("id", reg.id);
          remindersSent++;
        } else {
          console.error("reminder email failed", reg.id, result.error);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, remindersSent, preEventSent }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("send-event-reminders error", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
});
