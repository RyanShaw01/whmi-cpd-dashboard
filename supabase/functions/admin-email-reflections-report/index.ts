// Admin/owner-only: compiles a person's reflections into a single report email and sends it
// to an arbitrary address the admin chooses (unlike email-reflection-copy, which only ever
// emails the caller's own account).
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendEmail } from "../_shared/resend.ts";
import { wrapEmailHtml, reflectionEntryCardHtml, boldHtml, BLUE } from "../_shared/emailTemplate.ts";

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

    const { toEmail, toName, entries } = await req.json();
    // entries: [{ activityName, activityDate, sections: [{ label, items: [{ question, answer }] }] }]
    if (!toEmail || !Array.isArray(entries) || entries.length === 0) {
      return new Response(JSON.stringify({ ok: false, error: "toEmail and entries are required" }), { status: 400, headers: CORS_HEADERS });
    }

    const bodyLines: string[] = [
      `CPD Reflections Report${toName ? `: ${toName}` : ""}`,
      `${entries.length} reflection${entries.length === 1 ? "" : "s"}`,
      "",
    ];
    for (const entry of entries) {
      bodyLines.push("=".repeat(40));
      bodyLines.push(entry.activityName || "Reflection");
      if (entry.activityDate) bodyLines.push(`Date: ${entry.activityDate}`);
      bodyLines.push("");
      for (const section of entry.sections || []) {
        if (!section.items?.length) continue;
        bodyLines.push(section.label, "-".repeat(section.label.length));
        for (const item of section.items) {
          if (!item.answer) continue;
          bodyLines.push(item.question ? `Q: ${item.question}` : "", `A: ${item.answer}`, "");
        }
      }
      bodyLines.push("");
    }
    bodyLines.push("- WHMI CPD Dashboard");

    const html = wrapEmailHtml({
      preheader: `CPD reflections report${toName ? ` for ${toName}` : ""}`,
      title: `CPD Reflections Report${toName ? `: ${toName}` : ""}`,
      bodyHtml: `
        <h1 style="margin:0 0 4px 0;font-size:19px;font-weight:800;color:${BLUE};">CPD Reflections Report</h1>
        <p style="margin:0 0 18px 0;font-size:12.5px;color:#6b7785;">${toName ? `${boldHtml(toName)} - ` : ""}${entries.length} reflection${entries.length === 1 ? "" : "s"}</p>
        ${entries.map((entry: { activityName?: string; activityDate?: string; sections: unknown[] }) => reflectionEntryCardHtml(entry as any)).join("")}
      `,
    });

    const emailResult = await sendEmail({
      to: toEmail,
      subject: `CPD Reflections Report${toName ? `: ${toName}` : ""}`,
      text: bodyLines.filter(l => l !== undefined).join("\n"),
      html,
    });
    if (!emailResult.ok) {
      return new Response(JSON.stringify({ ok: false, error: emailResult.error || "email failed to send" }), { status: 502, headers: CORS_HEADERS });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("admin-email-reflections-report error", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: CORS_HEADERS });
  }
});
