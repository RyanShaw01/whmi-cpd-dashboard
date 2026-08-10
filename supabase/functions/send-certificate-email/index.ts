// Admin/owner-only: (re)sends an already-generated certificate PDF by email. Used for both the
// "Approve & Send All" bulk action (isResend: false, first send) and the per-certificate resend
// button (isResend: true, tracks resend_count/last_resent_at instead of touching sent_at/status).
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendEmail } from "../_shared/resend.ts";
import { certificateEmailHtml, certificateEmailSubject } from "../_shared/emailTemplate.ts";
import { getEmailOverride } from "../_shared/emailOverrides.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { certificateId, isResend } = await req.json();
    if (!certificateId) return new Response(JSON.stringify({ ok: false, error: "certificateId required" }), { status: 400, headers: CORS_HEADERS });

    const { data: cert, error: certError } = await supabaseAdmin.from("certificates").select("*").eq("id", certificateId).single();
    if (certError || !cert) return new Response(JSON.stringify({ ok: false, error: "certificate not found" }), { status: 404, headers: CORS_HEADERS });
    if (!cert.pdf_path) return new Response(JSON.stringify({ ok: false, error: "no PDF on file for this certificate" }), { status: 400, headers: CORS_HEADERS });

    const { data: pdfFile, error: downloadError } = await supabaseAdmin.storage.from("certificates").download(cert.pdf_path);
    if (downloadError || !pdfFile) {
      console.error("certificate pdf download failed", downloadError);
      return new Response(JSON.stringify({ ok: false, error: "certificate PDF missing" }), { status: 500, headers: CORS_HEADERS });
    }
    const pdfBytes = new Uint8Array(await pdfFile.arrayBuffer());
    const base64Pdf = btoa(String.fromCharCode(...pdfBytes));

    const shortDateLabel = cert.date
      ? `on ${new Date(`${cert.date}T00:00:00`).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}`
      : "";
    const override = await getEmailOverride(supabaseAdmin, "certificate", cert.event_title);
    const introText = override.intro || `Please find attached your CPD certificate for ${cert.event_title}${shortDateLabel ? ` ${shortDateLabel}` : ""}.`;
    const emailResult = await sendEmail({
      to: cert.recipient_email,
      subject: certificateEmailSubject(cert.event_title, override),
      text: `Hello ${cert.staff_name},\n\n${introText}\n\nAny issues or concerns, email whmieducation@wh.org.au\n\n- WHMI Education Team`,
      html: certificateEmailHtml({ name: cert.staff_name, sessionName: cert.event_title, dateLabel: shortDateLabel, override }),
      attachments: [{ filename: `${cert.event_title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-certificate.pdf`, content: base64Pdf }],
    });
    if (!emailResult.ok) {
      return new Response(JSON.stringify({ ok: false, error: emailResult.error || "email failed to send" }), { status: 502, headers: CORS_HEADERS });
    }

    const update = isResend
      ? { resend_count: (cert.resend_count || 0) + 1, last_resent_at: new Date().toISOString() }
      : { status: "Sent", sent_at: new Date().toISOString() };
    const { error: updateError } = await supabaseAdmin.from("certificates").update(update).eq("id", certificateId);
    if (updateError) console.error("certificate update failed", updateError);

    return new Response(JSON.stringify({ ok: true }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("send-certificate-email error", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: CORS_HEADERS });
  }
});
