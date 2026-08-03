// Admin/owner-only: generates a certificate PDF for someone with no account in the system
// (name/email/session typed directly by the admin, no reflectionId). Modeled directly on
// send-reflection-certificate, reusing the same PDF template + buildCertificatePdf helper.
// Skips emailing (this is a one-off admin action, not an automated flow) and returns the
// PDF's public URL so the admin can download it immediately.
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildCertificatePdf, hoursLabel } from "../_shared/certificate.ts";

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
    const dateLabel = `On ${eventDate.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`;

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

    const { error: certInsertError } = await supabaseAdmin.from("certificates").insert({
      id: certId,
      staff_name: name,
      event_id: null,
      event_title: sessionName,
      status: "Sent",
      date,
      recipient_email: email,
      cpd_hours: hours,
      pdf_path: uploadError ? null : pdfPath,
      sent_at: new Date().toISOString(),
      is_manual: true,
      cpd_type_id: cpdTypeId || null,
    });
    if (certInsertError) console.error("certificate insert failed", certInsertError);

    const pdfUrl = uploadError ? null : supabaseAdmin.storage.from("certificates").getPublicUrl(pdfPath).data.publicUrl;
    return new Response(JSON.stringify({ ok: true, certificateId: certId, pdfUrl }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("create-manual-certificate error", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: CORS_HEADERS });
  }
});
