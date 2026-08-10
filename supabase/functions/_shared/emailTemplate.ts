// Shared branded HTML wrapper for every outbound email, so registration/reminder/certificate
// mail all look like they come from the same product instead of each function hand-rolling its
// own layout. Table-based markup + inline styles only - this has to render in Outlook and
// Gmail's stripped-down HTML sandboxes, not just a modern browser.
// No emoji, no em dashes anywhere in this file or in copy that runs through it (house style).

export const NAVY = "#152A4E";
export const BLUE = "#35A8DD";
export const GREEN = "#9CCB3B";
const TEXT = "#1a2233";
const FAINT = "#6b7785";
const BORDER = "#e2e6ea";
const BG = "#f2f4f6";

// Logo lives in /public so it's served at a stable, unhashed URL Vite won't fingerprint on
// each build - email clients cache/link by URL, so it has to stay the same across deploys.
const SITE_URL = Deno.env.get("SITE_URL") || "https://whmi-cpd-dashboard.vercel.app";
const LOGO_URL = `${SITE_URL}/wh-logo.png`;

export function escapeHtml(s: string | null | undefined): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Wraps a name/title in bold - use for event/session names inline in sentences.
export function boldHtml(s: string | null | undefined): string {
  return `<strong>${escapeHtml(s)}</strong>`;
}

// Turns "\n\n"-separated plain paragraphs into <p> tags - keeps callers simple when they just
// have prose, without needing to hand-write HTML for every line.
export function paragraphsHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p style="margin:0 0 14px 0;">${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

export function btnHtml(label: string, href: string, color: string = BLUE): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:6px 0 18px 0;"><tr><td align="center"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:8px;background:${color};"><a href="${href}" style="display:inline-block;padding:11px 22px;font-size:13.5px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${escapeHtml(label)}</a></td></tr></table></td></tr></table>`;
}

// Two buttons, centred, side by side - used for "View event details" + "Join online" together.
export function sideBySideButtonsHtml(buttons: { label: string; href: string; color?: string }[]): string {
  const cells = buttons.map(b => `<td style="padding:0 6px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:8px;background:${b.color || BLUE};"><a href="${b.href}" style="display:inline-block;padding:11px 22px;font-size:13.5px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;white-space:nowrap;">${escapeHtml(b.label)}</a></td></tr></table></td>`).join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:6px 0 4px 0;"><tr><td align="center"><table role="presentation" cellpadding="0" cellspacing="0"><tr>${cells}</tr></table></td></tr></table>`;
}

export function detailRowsHtml(rows: { label: string; value: string | null | undefined }[]): string {
  const visible = rows.filter(r => r.value);
  if (visible.length === 0) return "";
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:14px 0;border:1px solid ${BORDER};border-radius:10px;overflow:hidden;">
    ${visible.map((r, i) => `<tr>
      <td style="padding:9px 14px;background:#f7f9fa;font-size:11.5px;font-weight:600;color:${FAINT};width:110px;vertical-align:top;${i > 0 ? `border-top:1px solid ${BORDER};` : ""}">${escapeHtml(r.label)}</td>
      <td style="padding:9px 14px;font-size:13px;color:${TEXT};vertical-align:top;${i > 0 ? `border-top:1px solid ${BORDER};` : ""}">${escapeHtml(r.value)}</td>
    </tr>`).join("")}
  </table>`;
}

// A soft highlight box - used for "here's what you wrote" / callout-style content.
export function calloutHtml(bodyHtml: string, color: string = BLUE): string {
  return `<div style="margin:14px 0;padding:14px 16px;background:${color}14;border-left:3px solid ${color};border-radius:6px;font-size:13px;color:${TEXT};line-height:1.6;">${bodyHtml}</div>`;
}

// A small muted disclaimer line - e.g. "this link only works 20 minutes before the event".
export function disclaimerHtml(text: string): string {
  return `<p style="margin:2px 0 18px 0;font-size:11px;color:${FAINT};text-align:center;">${escapeHtml(text)}</p>`;
}

// Shared by email-reflection-copy and admin-email-reflections-report so a reflection's
// Q&A sections render identically wherever they're emailed from.
export function reflectionSectionsHtml(sections: { label: string; items: { question?: string; answer: string }[] }[]): string {
  return sections
    .filter(s => s.items?.some(i => i.answer))
    .map(s => `
      <div style="margin:20px 0 8px 0;font-size:11px;font-weight:700;letter-spacing:.4px;color:${NAVY};text-transform:uppercase;">${escapeHtml(s.label)}</div>
      ${s.items.filter(i => i.answer).map(i => `
        <div style="margin:0 0 12px 0;">
          ${i.question ? `<div style="font-size:12px;font-weight:600;color:${FAINT};margin-bottom:3px;">${escapeHtml(i.question)}</div>` : ""}
          <div style="font-size:13px;color:${TEXT};">${escapeHtml(i.answer)}</div>
        </div>
      `).join("")}
    `).join("");
}

// A single reflection entry (used inside the admin's multi-entry reflections report) - a
// bordered card with the activity name, date, and its Q&A sections.
export function reflectionEntryCardHtml(entry: { activityName?: string; activityDate?: string; sections: { label: string; items: { question?: string; answer: string }[] }[] }): string {
  return `<div style="margin:0 0 16px 0;padding:14px 16px;border:1px solid ${BORDER};border-radius:10px;">
    <div style="font-size:14px;font-weight:700;color:${TEXT};">${escapeHtml(entry.activityName || "Reflection")}</div>
    ${entry.activityDate ? `<div style="font-size:11.5px;color:${FAINT};margin-top:2px;">${escapeHtml(entry.activityDate)}</div>` : ""}
    ${reflectionSectionsHtml(entry.sections || [])}
  </div>`;
}

// Shared by the three certificate-sending functions (send-reflection-certificate,
// send-certificate-email, create-manual-certificate) so the "here's your certificate" copy
// stays identical no matter which flow generated it.
export function certificateEmailHtml({ name, sessionName, dateLabel, reflectionContent }: {
  name: string;
  sessionName: string;
  dateLabel: string; // e.g. "on Thursday 12 December 2026"
  reflectionContent?: string | null;
}): string {
  return wrapEmailHtml({
    preheader: `Your CPD certificate for ${sessionName} is attached`,
    title: `Your CPD Certificate: ${sessionName}`,
    bodyHtml: `
      <h1 style="margin:0 0 14px 0;font-size:19px;font-weight:800;color:${GREEN};">Your certificate is attached</h1>
      <p style="margin:0 0 14px 0;">Hello ${escapeHtml(name)},</p>
      <p style="margin:0 0 14px 0;">Please find attached your CPD certificate for ${boldHtml(sessionName)} ${escapeHtml(dateLabel)}.</p>
      ${reflectionContent ? `<div style="margin:16px 0 4px 0;font-size:11.5px;font-weight:600;color:${FAINT};">YOUR SUBMITTED REFLECTION</div>${calloutHtml(paragraphsHtml(reflectionContent), GREEN)}` : ""}
    `,
  });
}

export function wrapEmailHtml({ preheader = "", title, bodyHtml, footerNote }: { preheader?: string; title: string; bodyHtml: string; footerNote?: string }): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <span style="display:none;font-size:1px;color:${BG};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid ${BORDER};">
            <tr>
              <td style="background:#ffffff;padding:20px 28px 14px 28px;text-align:center;border-bottom:3px solid ${NAVY};">
                <img src="${LOGO_URL}" alt="Western Health" width="82" style="display:block;margin:0 auto 6px auto;height:auto;border:0;" />
                <div style="font-size:10px;font-weight:700;letter-spacing:1.4px;color:${NAVY};text-transform:uppercase;">Medical Imaging CPD</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 28px 6px 28px;color:${TEXT};font-size:14px;line-height:1.6;">
                ${bodyHtml}
                <p style="margin:18px 0 0 0;">- WHMI Education Team</p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 26px 28px;">
                <div style="border-top:1px solid ${BORDER};padding-top:16px;color:${FAINT};font-size:11.5px;line-height:1.6;">
                  ${footerNote || `Any issues or concerns, email <a href="mailto:whmieducation@wh.org.au" style="color:${FAINT};">whmieducation@wh.org.au</a>`}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// Shared "thanks for attending, please reflect" copy, used both by the automated post-event
// cron (send-event-reminders) and the admin-triggered manual "Send Thank-You Email" action
// (send-thank-you-email) so the wording never drifts between the two paths.
export function thankYouEmailText(name: string, eventTitle: string, reflectUrl: string): string {
  return `Hi ${name},\n\nThanks for attending ${eventTitle}. We hope you found it valuable.\n\nWe'd love to hear your thoughts. Please take a few minutes to complete your CPD reflection and feedback form. Once submitted, your CPD certificate will be emailed to you automatically.\n\nFill in your reflection here: ${reflectUrl}\n\n- WHMI Education Team`;
}

export function thankYouEmailHtml(name: string, eventTitle: string, reflectUrl: string): string {
  return wrapEmailHtml({
    preheader: `Submit your reflection for ${eventTitle} to get your CPD certificate`,
    title: `Thanks for attending ${eventTitle}`,
    bodyHtml: `
      <h1 style="margin:0 0 14px 0;font-size:19px;font-weight:800;color:${BLUE};">Thanks for coming along</h1>
      <p style="margin:0 0 14px 0;">Hi ${escapeHtml(name)},</p>
      <p style="margin:0 0 14px 0;">Thanks for attending ${boldHtml(eventTitle)}. We hope you found it valuable.</p>
      <p style="margin:0 0 14px 0;">We'd love to hear your thoughts. Please take a few minutes to complete your CPD reflection and feedback form. Once submitted, your CPD certificate will be emailed to you automatically.</p>
      ${btnHtml("Submit your reflection", reflectUrl)}
      <p style="margin:0 0 14px 0;">It only takes a couple of minutes, and your certificate lands in your inbox right after.</p>
    `,
  });
}
