// Admin/owner-only: sends a presenter-specific "thanks for presenting" email (distinct wording
// from the attendee thank-you, no reflection-form ask) to every not-yet-thanked presenter
// (is_presenter = true) registered for an event, optionally attaching a CPD certificate the same
// way create-manual-certificate/send-reflection-certificate do. Presenters are excluded from the
// bulk attendee thank-you/reminder flows (send-thank-you-email, send-event-reminders) precisely
// so they can be thanked here instead - both paths reuse the same `reminder_sent_at` column to
// track "already thanked", so a presenter can never receive both.
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildCertificatePdf, hoursLabel, bytesToBase64 } from "../_shared/certificate.ts";
import { sendEmail } from "../_shared/mailer.ts";
import { presenterThankYouText, presenterThankYouHtml, presenterThankYouSubject } from "../_shared/emailTemplate.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

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

    const { eventId, includeCertificate } = await req.json();
    if (!eventId) return new Response(JSON.stringify({ ok: false, error: "eventId is required" }), { status: 400, headers: CORS_HEADERS });

    const { data: event, error: eventError } = await supabaseAdmin.from("events").select("*").eq("id", eventId).maybeSingle();
    if (eventError || !event) return new Response(JSON.stringify({ ok: false, error: "event not found" }), { status: 404, headers: CORS_HEADERS });

    const { data: presenters, error: regError } = await supabaseAdmin
      .from("registrations")
      .select("id, name, email")
      .eq("event_id", eventId)
      .eq("is_presenter", true)
      .is("reminder_sent_at", null);
    if (regError) throw regError;

    let templateBytes: Uint8Array | null = null;
    let cpdHours = 1;
    let dateLabel = "";
    if (includeCertificate) {
      const { data: templateFile, error: templateError } = await supabaseAdmin.storage.from("certificates").download("templates/certificate-of-attendance.pdf");
      if (templateError || !templateFile) {
        console.error("template download failed", templateError);
        return new Response(JSON.stringify({ ok: false, error: "certificate template missing" }), { status: 500, headers: CORS_HEADERS });
      }
      templateBytes = new Uint8Array(await templateFile.arrayBuffer());
      cpdHours = cpdHoursFromTimes(event.start_time, event.end_time) ?? 1;
      const eventDate = new Date(`${event.date}T00:00:00`);
      dateLabel = `on ${eventDate.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`;
    }

    let sentCount = 0;
    const sentAt = new Date().toISOString();
    for (const reg of presenters || []) {
      let attachments: { filename: string; content: string }[] | undefined;
      let certId: string | null = null;
      let pdfPath: string | null = null;

      if (includeCertificate && templateBytes) {
        const pdfBytes = await buildCertificatePdf(templateBytes, {
          name: reg.name, sessionName: event.title, dateLabel, code: event.asmirt_code || null, hoursLabel: hoursLabel(cpdHours),
        });
        certId = "c" + crypto.randomUUID();
        pdfPath = `${certId}.pdf`;
        const { error: uploadError } = await supabaseAdmin.storage.from("certificates").upload(pdfPath, pdfBytes, { contentType: "application/pdf" });
        if (uploadError) {
          console.error("presenter certificate upload failed", reg.id, uploadError);
          pdfPath = null;
        } else {
          attachments = [{ filename: `${event.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-certificate.pdf`, content: bytesToBase64(pdfBytes) }];
        }
      }

      const result = await sendEmail({
        to: reg.email,
        subject: presenterThankYouSubject(event.title),
        text: presenterThankYouText(reg.name, event.title, !!attachments),
        html: presenterThankYouHtml(reg.name, event.title, !!attachments),
        attachments,
      });

      if (result.ok) {
        await supabaseAdmin.from("registrations").update({ reminder_sent_at: sentAt }).eq("id", reg.id);
        sentCount++;
        if (certId) {
          const { error: certInsertError } = await supabaseAdmin.from("certificates").insert({
            id: certId,
            staff_name: reg.name,
            event_id: event.id,
            event_title: event.title,
            status: "Sent",
            date: event.date,
            recipient_email: reg.email,
            registration_id: reg.id,
            cpd_hours: cpdHours,
            pdf_path: pdfPath,
            sent_at: sentAt,
          });
          if (certInsertError) console.error("presenter certificate insert failed", reg.id, certInsertError);
        }
      } else {
        console.error("presenter thank-you email failed", reg.id, result.error);
      }
    }

    return new Response(JSON.stringify({ ok: true, sentCount, sentAt }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("send-presenter-thank-you error", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: CORS_HEADERS });
  }
});
