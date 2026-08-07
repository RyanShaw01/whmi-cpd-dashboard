// Invoked on a schedule by pg_cron/pg_net (see supabase/migration_phase8.sql), never by a
// user - protected by a shared secret instead of a user session. Finds events that ended
// 25-40 minutes ago and emails a reminder to every registrant who hasn't been reminded yet.
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendEmail } from "../_shared/resend.ts";
import { wrapEmailHtml, boldHtml, escapeHtml, btnHtml, BLUE } from "../_shared/emailTemplate.ts";

const CRON_SECRET = Deno.env.get("CRON_SECRET");
const SITE_URL = Deno.env.get("SITE_URL") || "http://localhost:5173";
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

function reminderText(name: string, eventTitle: string, reflectUrl: string) {
  return `Hi ${name},\n\nThanks for attending ${eventTitle}. We hope you found it valuable.\n\nWe'd love to hear your thoughts. Please take a few minutes to complete your CPD reflection and feedback form. Once submitted, your CPD certificate will be emailed to you automatically.\n\nFill in your reflection here: ${reflectUrl}\n\n- WHMI Education Team`;
}

function reminderHtml(name: string, eventTitle: string, reflectUrl: string) {
  return wrapEmailHtml({
    preheader: `Submit your reflection for ${eventTitle} to get your CPD certificate`,
    title: `Thanks for attending ${eventTitle}`,
    bodyHtml: `
      <h1 style="margin:0 0 14px 0;font-size:19px;font-weight:800;color:${BLUE};">Thanks for coming along</h1>
      <p style="margin:0 0 14px 0;">Hi ${escapeHtml(name)},</p>
      <p style="margin:0 0 14px 0;">Thanks for attending ${boldHtml(eventTitle)}. We hope you found it valuable.</p>
      <p style="margin:0 0 14px 0;">We'd love to hear your thoughts. Please take a few minutes to complete your CPD reflection and feedback form. Once submitted, your CPD certificate will be emailed to you automatically.</p>
      ${btnHtml("Submit your reflection", reflectUrl)}
      <p style="margin:0 0 14px 0;">It only takes a couple of minutes, and your certificate lands in your inbox right after.</p>
    `,
  });
}

Deno.serve(async (req) => {
  const auth = req.headers.get("Authorization");
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401 });
  }

  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 3 * 86400000).toISOString().slice(0, 10); // small lookback window is enough; time-window check below is the real gate
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("id, title, date, end_time")
      .gte("date", windowStart)
      .not("end_time", "is", null);
    if (eventsError) throw eventsError;

    let remindersSent = 0;
    for (const event of events || []) {
      const end = new Date(`${event.date}T${event.end_time}:00`);
      const minutesSinceEnd = (now.getTime() - end.getTime()) / 60000;
      if (minutesSinceEnd < 25 || minutesSinceEnd > 40) continue;

      const { data: registrations, error: regError } = await supabase
        .from("registrations")
        .select("id, name, email")
        .eq("event_id", event.id)
        .in("attendance_status", ["Registered", "Attended"])
        .is("reminder_sent_at", null);
      if (regError) { console.error("fetch registrations failed", event.id, regError); continue; }

      for (const reg of registrations || []) {
        const reflectUrl = `${SITE_URL}/event/${event.id}/reflect`;
        const result = await sendEmail({
          to: reg.email,
          subject: `Thanks for attending ${event.title}: share your feedback`,
          text: reminderText(reg.name, event.title, reflectUrl),
          html: reminderHtml(reg.name, event.title, reflectUrl),
        });
        if (result.ok) {
          await supabase.from("registrations").update({ reminder_sent_at: new Date().toISOString() }).eq("id", reg.id);
          remindersSent++;
        } else {
          console.error("reminder email failed", reg.id, result.error);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, remindersSent }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("send-event-reminders error", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
});
