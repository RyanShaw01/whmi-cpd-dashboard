// Thin wrapper around Resend's REST API (https://resend.com/docs/api-reference/emails/send-email).
// FROM_EMAIL defaults to Resend's shared test domain so sending works immediately without
// any DNS setup; swap the FROM_EMAIL secret to a verified @westernhealth.org.au address later.
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "WHMI CPD <onboarding@resend.dev>";

export async function sendEmail({
  to, subject, text, html, attachments,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string; // optional branded HTML version; `text` is always sent too as the plain-text fallback
  attachments?: { filename: string; content: string }[]; // content = base64
}) {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set — skipping email send");
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, text, ...(html ? { html } : {}), attachments }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error("Resend send failed", res.status, body);
    return { ok: false, error: body };
  }
  return { ok: true };
}
