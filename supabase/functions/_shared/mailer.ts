// Sends transactional email through Gmail's SMTP relay using an account App Password, rather
// than a third-party ESP like Resend - emails genuinely originate from GMAIL_USER's own mailbox,
// so recipients see (and can reply to) the real WHMI Education address instead of a
// Resend-branded/test sender.
//
// One-time setup, in the Google Account that owns GMAIL_USER (whmieducation@gmail.com):
//   1. Turn on 2-Step Verification: https://myaccount.google.com/security
//   2. Create an App Password: https://myaccount.google.com/apppasswords
//      (App name: e.g. "WHMI CPD Dashboard" - Google gives you a 16-character password)
//   3. Set these as Supabase Edge Function secrets, run from the repo root:
//        supabase secrets set GMAIL_USER=whmieducation@gmail.com
//        supabase secrets set GMAIL_APP_PASSWORD=<the 16-character app password, no spaces>
//
// Gmail's own sending caps apply here (not Resend's): roughly 500 messages/day for a regular
// Gmail account, 2000/day on Google Workspace - fine for this app's volume, but worth knowing if
// event volume grows a lot.
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const GMAIL_USER = Deno.env.get("GMAIL_USER") || "whmieducation@gmail.com";
const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD");
// The "From" header shown to recipients. Must be GMAIL_USER itself (or a "Send As" alias
// already verified in that Gmail account's own Settings > Accounts) - Gmail's SMTP relay
// rejects sending as an address it doesn't recognise as belonging to the authenticated account.
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || `WHMI Education <${GMAIL_USER}>`;

export async function sendEmail({
  to, subject, text, html, attachments,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string; // optional branded HTML version; `text` is always sent too as the plain-text fallback
  attachments?: { filename: string; content: string; contentType?: string }[]; // content = base64
}) {
  if (!GMAIL_APP_PASSWORD) {
    console.error("GMAIL_APP_PASSWORD is not set — skipping email send");
    return { ok: false, error: "GMAIL_APP_PASSWORD not configured" };
  }

  const client = new SMTPClient({
    connection: {
      hostname: "smtp.gmail.com",
      port: 465,
      tls: true,
      auth: { username: GMAIL_USER, password: GMAIL_APP_PASSWORD },
    },
  });

  try {
    await client.send({
      from: FROM_EMAIL,
      to,
      subject,
      content: text,
      html,
      attachments: attachments?.map(a => ({
        filename: a.filename, content: a.content, encoding: "base64" as const,
        contentType: a.contentType || "application/pdf", // every attachment this app sends today is a certificate PDF
      })),
    });
    return { ok: true };
  } catch (err) {
    console.error("Gmail SMTP send failed", err);
    return { ok: false, error: String(err) };
  } finally {
    try { await client.close(); } catch { /* connection never opened, or already closed */ }
  }
}
