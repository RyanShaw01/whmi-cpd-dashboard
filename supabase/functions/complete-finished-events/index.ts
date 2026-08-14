// Invoked on a schedule by pg_cron/pg_net (see supabase/migration_phase33.sql), never by a user
// - protected by a shared secret instead of a user session, same pattern as
// send-event-reminders. Moves events from "Registration Open"/"Registration Closed"/
// "Open (No Registration Needed)" to "Completed" 24 hours after they end - this is the only
// thing that moves an event out of Up Next/Upcoming Events and into Previous Events for good;
// before that 24h mark, a finished event deliberately keeps showing in Upcoming as a grace
// period (via isRecentlyCompleted on the client, which is purely time-based and doesn't check
// status at all). Any status not listed here never gets completed by this job - keep this in
// sync with every status EventForm lets an admin publish an event under.
import { createClient } from "npm:@supabase/supabase-js@2";

const CRON_SECRET = Deno.env.get("CRON_SECRET");
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

Deno.serve(async (req) => {
  const auth = req.headers.get("Authorization");
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401 });
  }

  try {
    const now = new Date();
    // Small lookback window so this stays cheap - anything older than ~10 days is either
    // already Completed or not worth scanning every run; the real gate is the per-row time
    // check below.
    const windowStart = new Date(now.getTime() - 10 * 86400000).toISOString().slice(0, 10);
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("id, date, end_time, status")
      .gte("date", windowStart)
      .in("status", ["Registration Open", "Registration Closed", "Open (No Registration Needed)"])
      .not("end_time", "is", null);
    if (eventsError) throw eventsError;

    let completedCount = 0;
    for (const event of events || []) {
      const end = new Date(`${event.date}T${event.end_time}:00`);
      const hoursSinceEnd = (now.getTime() - end.getTime()) / 3600000;
      if (hoursSinceEnd < 24) continue;
      const { error: updateError } = await supabase.from("events").update({ status: "Completed" }).eq("id", event.id);
      if (updateError) { console.error("complete event failed", event.id, updateError); continue; }
      completedCount++;
    }

    return new Response(JSON.stringify({ ok: true, completedCount }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("complete-finished-events error", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
});
