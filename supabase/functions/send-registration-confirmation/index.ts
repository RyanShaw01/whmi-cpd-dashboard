// Public (no auth required): sends a registration confirmation email. Registration itself
// already happens client-side via an anonymous/authenticated insert against `registrations`
// (RLS-gated); this just emails the person a copy of what they registered for, since the
// public QR/link flow has no session to email-from-account-context the way other functions do.
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendEmail } from "../_shared/resend.ts";
import { wrapEmailHtml, paragraphsHtml, detailRowsHtml, sideBySideButtonsHtml, disclaimerHtml, boldHtml, escapeHtml, BLUE, GREEN } from "../_shared/emailTemplate.ts";
import { campusAddress } from "../_shared/campusAddresses.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = Deno.env.get("SITE_URL") || "https://whmi-cpd-dashboard.vercel.app";

const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

function fmtDate(d: string) {
  try {
    return new Date(`${d}T00:00:00`).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  } catch {
    return d;
  }
}
function fmtTime(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  try {
    const { eventId, name, email } = await req.json();
    if (!eventId || !name || !email) {
      return new Response(JSON.stringify({ ok: false, error: "eventId, name, and email are required" }), { status: 400, headers: CORS_HEADERS });
    }

    const { data: event, error: eventError } = await supabaseAdmin.from("events").select("*").eq("id", eventId).maybeSingle();
    if (eventError || !event) {
      return new Response(JSON.stringify({ ok: false, error: "event not found" }), { status: 404, headers: CORS_HEADERS });
    }

    const location = [event.campus, event.location].filter(Boolean).join(" - ");
    const timeRange = `${fmtTime(event.start_time)} - ${fmtTime(event.end_time)}`;
    const eventUrl = `${SITE_URL}/event/${eventId}`;
    const isOnline = (event.mode === "Online" || event.mode === "Hybrid") && !!event.meeting_url;
    // In-person/Hybrid events show the campus street address so recipients can find the venue.
    const isInPerson = event.mode === "In-person" || event.mode === "Hybrid";
    const address = isInPerson ? campusAddress(event.campus) : null;

    const bodyLines = [
      `Hi ${name},`,
      "",
      `You're registered for "${event.title}".`,
      "",
      `Date: ${fmtDate(event.date)}`,
      `Time: ${timeRange}`,
      location ? `Location: ${location}` : "",
      address ? `Address: ${address}` : "",
      event.presenter ? `Presenter: ${event.presenter}` : "",
      "",
      `View the event: ${eventUrl}`,
      isOnline ? `Join online: ${event.meeting_url} (only active from 20 minutes before the event)` : "",
      "",
      "We look forward to seeing you there. You'll receive a follow-up email with a link to submit your reflection and receive your CPD certificate after the event.",
      "",
      "- WHMI Education Team",
    ];

    const html = wrapEmailHtml({
      preheader: `You're registered for ${event.title}`,
      title: `Registration confirmed: ${event.title}`,
      bodyHtml: `
        <h1 style="margin:0 0 14px 0;font-size:19px;font-weight:800;color:${BLUE};text-align:center;text-transform:uppercase;letter-spacing:.4px;">You're Registered</h1>
        <p style="margin:0 0 14px 0;">Hi ${escapeHtml(name)},</p>
        <p style="margin:0 0 14px 0;">You're registered for ${boldHtml(event.title)}.</p>
        ${detailRowsHtml([
          { label: "Date", value: fmtDate(event.date) },
          { label: "Time", value: timeRange },
          { label: "Location", value: location },
          { label: "Address", value: address },
          { label: "Presenter", value: event.presenter },
        ])}
        ${sideBySideButtonsHtml([
          { label: "View event details", href: eventUrl, color: BLUE },
          ...(isOnline ? [{ label: "Join online", href: event.meeting_url, color: GREEN }] : []),
        ])}
        ${isOnline ? disclaimerHtml("The online event button will only work from 20 minutes before the event starts.") : ""}
        ${paragraphsHtml("We look forward to seeing you there. You'll receive a follow-up email with a link to submit your reflection and receive your CPD certificate after the event.")}
      `,
    });

    const emailResult = await sendEmail({
      to: email,
      subject: `Registration confirmed: ${event.title}`,
      text: bodyLines.filter(l => l !== undefined).join("\n"),
      html,
    });
    if (!emailResult.ok) {
      return new Response(JSON.stringify({ ok: false, error: emailResult.error || "email failed to send" }), { status: 502, headers: CORS_HEADERS });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("send-registration-confirmation error", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: CORS_HEADERS });
  }
});
