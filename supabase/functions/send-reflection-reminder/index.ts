// Admin/owner-only: sends a one-off "please submit your reflection" reminder email to a
// specific registrant for a past event, so admins aren't stuck waiting on the automated
// post-event email job (send-event-reminders) to follow up with stragglers individually.
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendEmail } from "../_shared/mailer.ts";
import { reflectionReminderHtml, reflectionReminderSubject, firstName } from "../_shared/emailTemplate.ts";
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

    const { name, email, eventId, eventTitle } = await req.json();
    if (!name || !email || !eventId || !eventTitle) {
      return new Response(JSON.stringify({ ok: false, error: "name, email, eventId, and eventTitle are required" }), { status: 400, headers: CORS_HEADERS });
    }

    const link = `${SITE_URL}/event/${eventId}/reflect`;
    const override = await getEmailOverride(supabaseAdmin, "reflection_reminder", eventTitle);
    const introText = override.intro || `You attended ${eventTitle}, but we haven't received your reflection yet.`;

    const html = reflectionReminderHtml({ name, title: eventTitle, link, override });

    const emailResult = await sendEmail({
      to: email,
      subject: reflectionReminderSubject(eventTitle, override),
      text: `Hi ${firstName(name)},\n\n${introText} Submit it here to get your CPD certificate:\n${link}\n\nIf you've already submitted this, you can disregard this reminder.\n\n- WHMI Education Team`,
      html,
    });

    return new Response(JSON.stringify({ ok: emailResult.ok, error: emailResult.error }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("send-reflection-reminder error", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: CORS_HEADERS });
  }
});
