// Any signed-in user: emails a copy of one of THEIR OWN reflections (personal or WH-event) to
// their own account email — never an arbitrary address supplied by the client.
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendEmail } from "../_shared/resend.ts";

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
    const { data: callerRow } = await supabaseAdmin.from("users").select("id, name, email").eq("auth_id", callerData.user.id).maybeSingle();
    if (!callerRow) return new Response(JSON.stringify({ ok: false, error: "forbidden" }), { status: 403, headers: CORS_HEADERS });

    const { activityName, activityDate, sections } = await req.json();
    // sections: [{ label: string, items: [{ question: string, answer: string }] }]
    if (!activityName || !Array.isArray(sections)) {
      return new Response(JSON.stringify({ ok: false, error: "activityName and sections are required" }), { status: 400, headers: CORS_HEADERS });
    }

    const bodyLines: string[] = [
      `Your reflection: ${activityName}`,
      activityDate ? `Date: ${activityDate}` : "",
      "",
    ];
    for (const section of sections) {
      if (!section.items?.length) continue;
      bodyLines.push(section.label, "-".repeat(section.label.length));
      for (const item of section.items) {
        if (!item.answer) continue;
        bodyLines.push(`Q: ${item.question}`, `A: ${item.answer}`, "");
      }
    }
    bodyLines.push("", "- WHMI CPD Dashboard");

    const emailResult = await sendEmail({
      to: callerRow.email,
      subject: `Your CPD Reflection: ${activityName}`,
      text: bodyLines.filter(l => l !== undefined).join("\n"),
    });
    if (!emailResult.ok) {
      return new Response(JSON.stringify({ ok: false, error: emailResult.error || "email failed to send" }), { status: 502, headers: CORS_HEADERS });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("email-reflection-copy error", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: CORS_HEADERS });
  }
});
