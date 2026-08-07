// Admin/owner-only: sends a one-off "please submit your reflection" reminder email to a
// specific registrant for a past event, so admins aren't stuck waiting on the automated
// post-event email job (send-event-reminders) to follow up with stragglers individually.
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendEmail } from "../_shared/resend.ts";
import { wrapEmailHtml, boldHtml, escapeHtml, btnHtml, BLUE } from "../_shared/emailTemplate.ts";

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

    const html = wrapEmailHtml({
      preheader: `Submit your reflection for ${eventTitle} to get your CPD certificate`,
      title: `Reminder: submit your reflection for ${eventTitle}`,
      bodyHtml: `
        <h1 style="margin:0 0 14px 0;font-size:19px;font-weight:800;color:${BLUE};">Just a friendly reminder</h1>
        <p style="margin:0 0 14px 0;">Hello ${escapeHtml(name)},</p>
        <p style="margin:0 0 14px 0;">You attended ${boldHtml(eventTitle)}, but we haven't received your reflection yet. Submit it to get your CPD certificate.</p>
        ${btnHtml("Submit your reflection", link)}
        <p style="margin:0 0 14px 0;">If you've already submitted this, you can disregard this reminder.</p>
      `,
    });

    const emailResult = await sendEmail({
      to: email,
      subject: `Reminder: submit your reflection for ${eventTitle}`,
      text: `Hello ${name},\n\nYou attended ${eventTitle}, but we haven't received your reflection yet. Submit it here to get your CPD certificate:\n${link}\n\nIf you've already submitted this, you can disregard this reminder.\n\n- WHMI Education Team`,
      html,
    });

    return new Response(JSON.stringify({ ok: emailResult.ok, error: emailResult.error }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("send-reflection-reminder error", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: CORS_HEADERS });
  }
});
