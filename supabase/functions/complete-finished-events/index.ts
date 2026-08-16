// Invoked on a schedule by pg_cron/pg_net (see supabase/migration_phase33.sql), never by a user
// - protected by a shared secret instead of a user session, same pattern as
// send-event-reminders. Moves any event still short of a terminal state to "Completed" 24 hours
// after it ends - this is the only thing that moves an event out of Up Next/Upcoming Events and
// into Previous Events for good; before that 24h mark, a finished event deliberately keeps
// showing in Upcoming as a grace period (via isRecentlyCompleted on the client, which is purely
// time-based and doesn't check status at all - so an event past its end time can appear there
// even while still Draft/Awaiting Approval, if nobody moved it out of that status in time).
//
// Deliberately an EXCLUDE list (only "Completed" and "Archived" are skipped), not an allowlist of
// specific pre-completion statuses - an allowlist has to be kept in sync by hand every time a new
// status is added to EventForm, and missing one here means events under it silently never
// complete (this happened once already, with "Open (No Registration Needed)"). Once something's
// past its end time, the only two states that should legitimately survive this job are the ones
// an admin deliberately chose as an end state.
//
// IMPORTANT: must always be deployed with `--no-verify-jwt` (supabase functions deploy
// complete-finished-events --no-verify-jwt). pg_cron authenticates with CRON_SECRET, not a real
// Supabase-issued JWT - if the platform's own JWT check is left on (the default on a plain
// deploy), every cron invocation gets rejected with 401 before this file's code ever runs, and
// events silently stop completing with no visible error anywhere. This exact regression happened
// once already - a plain redeploy re-enabled it.
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
      .not("status", "in", "(Completed,Archived)")
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
