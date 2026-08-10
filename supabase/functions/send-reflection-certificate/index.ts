// Invoked directly by the client (src/lib/db.js: sendReflectionCertificate) right after a
// reflection is inserted. Public/unauthenticated by design — only a reflectionId is trusted
// from the caller, everything else is re-fetched server-side with the service-role key.
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildCertificatePdf, hoursLabel } from "../_shared/certificate.ts";
import { sendEmail } from "../_shared/resend.ts";
import { certificateEmailHtml, certificateEmailSubject } from "../_shared/emailTemplate.ts";
import { getEmailOverride } from "../_shared/emailOverrides.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

function cpdHoursFromTimes(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if ([sh, sm, eh, em].some(Number.isNaN)) return null;
  const minutes = (eh * 60 + em) - (sh * 60 + sm);
  if (minutes <= 0) return null;
  return Math.round((minutes / 60) * 100) / 100;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  try {
    const { reflectionId } = await req.json();
    if (!reflectionId) return new Response(JSON.stringify({ ok: false, error: "reflectionId required" }), { status: 400, headers: CORS_HEADERS });

    const { data: reflection, error: refError } = await supabase.from("reflections").select("*").eq("id", reflectionId).single();
    if (refError || !reflection) return new Response(JSON.stringify({ ok: false, error: "reflection not found" }), { status: 404, headers: CORS_HEADERS });

    const { data: event, error: eventError } = await supabase.from("events").select("*").eq("id", reflection.event_id).single();
    if (eventError || !event) return new Response(JSON.stringify({ ok: false, error: "event not found" }), { status: 404, headers: CORS_HEADERS });

    const cpdHours = cpdHoursFromTimes(event.start_time, event.end_time) ?? 1;
    const eventDate = new Date(`${event.date}T00:00:00`);
    const dateLabel = `on ${eventDate.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`;

    const { data: templateFile, error: templateError } = await supabase.storage.from("certificates").download("templates/certificate-of-attendance.pdf");
    if (templateError || !templateFile) {
      console.error("template download failed", templateError);
      return new Response(JSON.stringify({ ok: false, error: "certificate template missing" }), { status: 500, headers: CORS_HEADERS });
    }
    const templateBytes = new Uint8Array(await templateFile.arrayBuffer());

    const pdfBytes = await buildCertificatePdf(templateBytes, {
      name: reflection.name,
      sessionName: event.title,
      dateLabel,
      code: event.asmirt_code || null,
      hoursLabel: hoursLabel(cpdHours),
    });

    const certId = "c" + crypto.randomUUID();
    const pdfPath = `${certId}.pdf`;
    const { error: uploadError } = await supabase.storage.from("certificates").upload(pdfPath, pdfBytes, { contentType: "application/pdf" });
    if (uploadError) console.error("certificate upload failed", uploadError);

    const base64Pdf = btoa(String.fromCharCode(...pdfBytes));
    const shortDateLabel = `on ${eventDate.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}`;
    const override = await getEmailOverride(supabase, "certificate", event.title);
    const introText = override.intro || `Please find attached your CPD certificate for ${event.title} ${shortDateLabel}.`;
    const emailResult = await sendEmail({
      to: reflection.email,
      subject: certificateEmailSubject(event.title, override),
      text: `Hello ${reflection.name},\n\n${introText}\n\nYour submitted reflection:\n${reflection.content}\n\nAny issues or concerns, email whmieducation@wh.org.au\n\n- WHMI Education Team`,
      html: certificateEmailHtml({ name: reflection.name, sessionName: event.title, dateLabel: shortDateLabel, reflectionContent: reflection.content, override }),
      attachments: [{ filename: `${event.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-certificate.pdf`, content: base64Pdf }],
    });

    const { error: certInsertError } = await supabase.from("certificates").insert({
      id: certId,
      staff_name: reflection.name,
      event_id: event.id,
      event_title: event.title,
      status: emailResult.ok ? "Sent" : "Awaiting Approval",
      date: event.date,
      recipient_email: reflection.email,
      registration_id: reflection.registration_id,
      reflection_id: reflection.id,
      cpd_hours: cpdHours,
      pdf_path: uploadError ? null : pdfPath,
      sent_at: emailResult.ok ? new Date().toISOString() : null,
    });
    if (certInsertError) console.error("certificate insert failed", certInsertError);

    return new Response(JSON.stringify({ ok: emailResult.ok, certificateId: certId }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("send-reflection-certificate error", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: CORS_HEADERS });
  }
});
