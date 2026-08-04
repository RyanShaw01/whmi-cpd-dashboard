// Admin/owner-only: renders the certificate template with sample/placeholder data so an admin
// can preview what an attendee's certificate will look like for a given event, without
// generating a real certificate record, uploading anything, or sending an email.
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

    const { sessionName, date, cpdHours, cpdTypeId } = await req.json();

    let code: string | null = null;
    if (cpdTypeId) {
      const { data: cpdType } = await supabaseAdmin.from("cpd_types").select("appellation_code").eq("id", cpdTypeId).maybeSingle();
      code = cpdType?.appellation_code ?? null;
    }

    const hours = Number(cpdHours) || 1;
    const dateLabel = date
      ? `On ${new Date(`${date}T00:00:00`).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`
      : "On [Event Date]";

    const { data: templateFile, error: templateError } = await supabaseAdmin.storage.from("certificates").download("templates/certificate-of-attendance.pdf");
    if (templateError || !templateFile) {
      console.error("template download failed", templateError);
      return new Response(JSON.stringify({ ok: false, error: "certificate template missing" }), { status: 500, headers: CORS_HEADERS });
    }
    const templateBytes = new Uint8Array(await templateFile.arrayBuffer());

    const pdfBytes = await buildCertificatePdf(templateBytes, {
      name: "Jane Smith",
      sessionName: sessionName || "[Event Title]",
      dateLabel,
      code,
      hoursLabel: hoursLabel(hours),
    });

    return new Response(pdfBytes, { headers: { ...CORS_HEADERS, "Content-Type": "application/pdf" } });
  } catch (err) {
    console.error("preview-certificate-template error", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: CORS_HEADERS });
  }
});
