// Shared branded HTML wrapper for every outbound email, so registration/reminder/certificate
// mail all look like they come from the same product instead of each function hand-rolling its
// own layout. Table-based markup + inline styles only — this has to render in Outlook and
// Gmail's stripped-down HTML sandboxes, not just a modern browser.

export const NAVY = "#152A4E";
export const BLUE = "#35A8DD";
export const GREEN = "#9CCB3B";
const TEXT = "#1a2233";
const FAINT = "#6b7785";
const BORDER = "#e2e6ea";
const BG = "#f2f4f6";

export function escapeHtml(s: string | null | undefined): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Turns "\n\n"-separated plain paragraphs into <p> tags — keeps callers simple when they just
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
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 18px 0;"><tr><td style="border-radius:8px;background:${color};"><a href="${href}" style="display:inline-block;padding:11px 22px;font-size:13.5px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${escapeHtml(label)}</a></td></tr></table>`;
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

// A soft highlight box — used for "here's what you wrote" / callout-style content.
export function calloutHtml(bodyHtml: string, color: string = BLUE): string {
  return `<div style="margin:14px 0;padding:14px 16px;background:${color}14;border-left:3px solid ${color};border-radius:6px;font-size:13px;color:${TEXT};line-height:1.6;">${bodyHtml}</div>`;
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
    title: `Your CPD Certificate — ${sessionName}`,
    bodyHtml: `
      <h1 style="margin:0 0 14px 0;font-size:19px;font-weight:800;color:${GREEN};">Your certificate is attached 🎓</h1>
      ${paragraphsHtml(`Hello ${name},\n\nPlease find attached your CPD certificate for "${sessionName}" ${dateLabel}.`)}
      ${reflectionContent ? `<div style="margin:16px 0 4px 0;font-size:11.5px;font-weight:600;color:${FAINT};">YOUR SUBMITTED REFLECTION</div>${calloutHtml(paragraphsHtml(reflectionContent), GREEN)}` : ""}
      ${paragraphsHtml("This is an automated email and certificate. If there are any issues, please contact the CPD facilitator or the WH Medical Imaging Education Team.")}
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
              <td style="background:${NAVY};padding:20px 28px;">
                <span style="font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:18px;color:#ffffff;letter-spacing:.2px;">WHMI <span style="color:${BLUE};">CPD</span></span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 28px 6px 28px;color:${TEXT};font-size:14px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 26px 28px;">
                <div style="border-top:1px solid ${BORDER};padding-top:16px;color:${FAINT};font-size:11.5px;line-height:1.6;">
                  ${footerNote || "Western Health Medical Imaging &middot; Education Team<br/>This is an automated message &mdash; please don&rsquo;t reply directly to this email."}
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
