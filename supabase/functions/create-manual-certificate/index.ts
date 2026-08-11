// Admin/owner-only: generates a certificate PDF for someone with no account in the system
// (name/email/session typed directly by the admin, no reflectionId). Modeled directly on
// send-reflection-certificate, reusing the same PDF template + buildCertificatePdf helper.
// Emails the certificate to the recipient automatically, and if they don't match an existing
// users row, links them to a staff (internal, @wh.org.au) or external_participants record.
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildCertificatePdf, hoursLabel, bytesToBase64 } from "../_shared/certificate.ts";
import { sendEmail } from "../_shared/mailer.ts";
import { certificateEmailHtml, certificateEmailSubject, firstName } from "../_shared/emailTemplate.ts";
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

    const { name, email, sessionName, date, cpdHours, cpdTypeId } = await req.json();
    if (!name || !email || !sessionName || !date) {
      return new Response(JSON.stringify({ ok: false, error: "name, email, sessionName, and date are required" }), { status: 400, headers: CORS_HEADERS });
    }

    let code: string | null = null;
    if (cpdTypeId) {
      const { data: cpdType } = await supabaseAdmin.from("cpd_types").select("appellation_code").eq("id", cpdTypeId).maybeSingle();
      code = cpdType?.appellation_code ?? null;
    }

    const hours = Number(cpdHours) || 1;
    const eventDate = new Date(`${date}T00:00:00`);
    const dateLabel = `on ${eventDate.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`;

    const { data: templateFile, error: templateError } = await supabaseAdmin.storage.from("certificates").download("templates/certificate-of-attendance.pdf");
    if (templateError || !templateFile) {
      console.error("template download failed", templateError);
      return new Response(JSON.stringify({ ok: false, error: "certificate template missing" }), { status: 500, headers: CORS_HEADERS });
    }
    const templateBytes = new Uint8Array(await templateFile.arrayBuffer());

    const pdfBytes = await buildCertificatePdf(templateBytes, {
      name, sessionName, dateLabel, code, hoursLabel: hoursLabel(hours),
    });

    const certId = "c" + crypto.randomUUID();
    const pdfPath = `${certId}.pdf`;
    const { error: uploadError } = await supabaseAdmin.storage.from("certificates").upload(pdfPath, pdfBytes, { contentType: "application/pdf" });
    if (uploadError) console.error("certificate upload failed", uploadError);

    const base64Pdf = bytesToBase64(pdfBytes);
    const shortDateLabel = dateLabel.charAt(0).toLowerCase() + dateLabel.slice(1);
    const override = await getEmailOverride(supabaseAdmin, "certificate", sessionName);
    const introText = override.intro || `Please find attached your CPD certificate for ${sessionName} ${shortDateLabel}.`;
    const emailResult = await sendEmail({
      to: email,
      subject: certificateEmailSubject(sessionName, override),
      text: `Hi ${firstName(name)},\n\n${introText}\n\nAny issues or concerns, email whmieducation@wh.org.au\n\n- WHMI Education Team`,
      html: certificateEmailHtml({ name, sessionName, dateLabel: shortDateLabel, override }),
      attachments: uploadError ? undefined : [{ filename: `${sessionName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-certificate.pdf`, content: base64Pdf }],
    });

    const { error: certInsertError } = await supabaseAdmin.from("certificates").insert({
      id: certId,
      staff_name: name,
      event_id: null,
      event_title: sessionName,
      status: emailResult.ok ? "Sent" : "Awaiting Approval",
      date,
      recipient_email: email,
      cpd_hours: hours,
      pdf_path: uploadError ? null : pdfPath,
      sent_at: emailResult.ok ? new Date().toISOString() : null,
      is_manual: true,
      cpd_type_id: cpdTypeId || null,
    });
    if (certInsertError) console.error("certificate insert failed", certInsertError);

    // Link the recipient to an existing account, or best-effort create a staff/external record
    // so they show up in the directory even though no login account exists for them.
    const { data: existingUser } = await supabaseAdmin.from("users").select("id").ilike("email", email).maybeSingle();
    if (!existingUser) {
      const isInternal = /@wh\.org\.au$/i.test(email);
      if (isInternal) {
        const { data: existingStaff } = await supabaseAdmin.from("staff").select("id, certificates").ilike("name", name).maybeSingle();
        if (existingStaff) {
          await supabaseAdmin.from("staff").update({ certificates: (existingStaff.certificates || 0) + 1 }).eq("id", existingStaff.id);
        } else {
          await supabaseAdmin.from("staff").insert({ id: "st" + crypto.randomUUID(), name, certificates: 1 });
        }
      } else {
        const { data: existingExternal } = await supabaseAdmin.from("external_participants").select("id").ilike("email", email).maybeSingle();
        if (!existingExternal) {
          await supabaseAdmin.from("external_participants").insert({ id: "ep" + crypto.randomUUID(), name, email });
        }
      }
    }

    const pdfUrl = uploadError ? null : supabaseAdmin.storage.from("certificates").getPublicUrl(pdfPath).data.publicUrl;
    return new Response(JSON.stringify({ ok: true, certificateId: certId, pdfUrl, emailed: emailResult.ok }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("create-manual-certificate error", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: CORS_HEADERS });
  }
});
