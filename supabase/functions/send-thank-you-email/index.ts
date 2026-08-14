// Admin/owner-only: manually sends the "thanks for attending, please reflect" email to every
// eligible registrant of a past event who hasn't received it yet - the same copy the automated
// post-event cron (send-event-reminders) sends 25-40 minutes after an event ends, so admins have
// a way to (re)trigger it on demand without waiting on the cron window, and without ever double-
// sending: both paths write the same `reminder_sent_at` column, so whichever one fires first is
// the one that "counts" for greying the button out.
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendEmail } from "../_shared/mailer.ts";
import { thankYouEmailText, thankYouEmailHtml, thankYouEmailSubject } from "../_shared/emailTemplate.ts";
import { getEmailOverride } from "../_shared/emailOverrides.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = Deno.env.get("SITE_URL") || "https://whmi-cpd-dashboard.vercel.app";
const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace(/^Bearer /i, "");
    if (!jwt) return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401, headers: CORS_HEADERS });

    const { data: callerData, error: callerError } = await supabaseAdmin.auth.getUser(jwt);
    if (callerError || !callerData?.user) {
      return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401, headers: CORS_HEADERS });
    }
    const { data: callerRow } = await supabaseAdmin.from("users").select("id, role").eq("auth_id", callerData.user.id).maybeSingle();
    if (!callerRow || !["admin", "owner"].includes(callerRow.role)) {
      return new Response(JSON.stringify({ ok: false, error: "forbidden" }), { status: 403, headers: CORS_HEADERS });
    }

    const { eventId } = await req.json();
    if (!eventId) return new Response(JSON.stringify({ ok: false, error: "eventId is required" }), { status: 400, headers: CORS_HEADERS });

    const { data: event, error: eventError } = await supabaseAdmin.from("events").select("id, title").eq("id", eventId).maybeSingle();
    if (eventError || !event) return new Response(JSON.stringify({ ok: false, error: "event not found" }), { status: 404, headers: CORS_HEADERS });

    const { data: registrations, error: regError } = await supabaseAdmin
      .from("registrations")
      .select("id, name, email")
      .eq("event_id", eventId)
      .in("attendance_status", ["Registered", "Attended"])
      .eq("is_presenter", false)
      .is("reminder_sent_at", null);
    if (regError) throw regError;

    let sentCount = 0;
    const sentAt = new Date().toISOString();
    const override = await getEmailOverride(supabaseAdmin, "post_event_thank_you", event.title);
    for (const reg of registrations || []) {
      const reflectUrl = `${SITE_URL}/event/${eventId}/reflect`;
      const result = await sendEmail({
        to: reg.email,
        subject: thankYouEmailSubject(event.title, override),
        text: thankYouEmailText(reg.name, event.title, reflectUrl, override),
        html: thankYouEmailHtml(reg.name, event.title, reflectUrl, override),
      });
      if (result.ok) {
        await supabaseAdmin.from("registrations").update({ reminder_sent_at: sentAt }).eq("id", reg.id);
        sentCount++;
      } else {
        console.error("thank-you email failed", reg.id, result.error);
      }
    }

    return new Response(JSON.stringify({ ok: true, sentCount, sentAt }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("send-thank-you-email error", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: CORS_HEADERS });
  }
});
