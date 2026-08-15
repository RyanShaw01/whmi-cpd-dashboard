// Shared branded HTML wrapper for every outbound email, so registration/reminder/certificate
// mail all look like they come from the same product instead of each function hand-rolling its
// own layout. Table-based markup + inline styles only - this has to render in Outlook and
// Gmail's stripped-down HTML sandboxes, not just a modern browser.
// No emoji, no em dashes anywhere in this file or in copy that runs through it (house style).
import { WH_LOGO_DATA_URI } from "./logoBase64.ts";

export const NAVY = "#152A4E";
export const BLUE = "#35A8DD";
export const GREEN = "#9CCB3B";
const TEXT = "#1a2233";
const FAINT = "#6b7785";
const BORDER = "#e2e6ea";
const BG = "#f2f4f6";

// Embedded as base64 (see logoBase64.ts) rather than linked by URL - a remote <img src> gets
// silently blocked by default in most email clients until the recipient clicks "show images",
// which a data: URI sidesteps entirely since there's no separate image request to block.

// Greeting uses first name only ("Hi Ryan," not "Hi Ryan Shaw,") - friendlier, and avoids
// spelling out a full name (sometimes lowercased or oddly cased in older/manually-entered data)
// right at the top of the email.
export function firstName(fullName: string | null | undefined): string {
  const first = (fullName || "").trim().split(/\s+/)[0] || "";
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : "there";
}

// Substitutes {{token}} placeholders in an admin-edited HTML override with real per-send values.
// Values are pre-rendered HTML fragments (already escaped by the caller where needed), not raw
// user input, so this is a straight string replace - no further escaping here.
export function applyPlaceholders(html: string, vars: Record<string, string>): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

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

// `raw: true` inserts `value` as-is (already-built, trusted HTML - e.g. a bullet list) instead of
// escaping it as plain text - used for multi-line values like a dot-pointed presenter list.
export function detailRowsHtml(rows: { label: string; value: string | null | undefined; raw?: boolean }[]): string {
  const visible = rows.filter(r => r.value);
  if (visible.length === 0) return "";
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:14px 0;border:1px solid ${BORDER};border-radius:10px;overflow:hidden;">
    ${visible.map((r, i) => `<tr>
      <td style="padding:9px 14px;background:#f7f9fa;font-size:11.5px;font-weight:600;color:${FAINT};width:110px;vertical-align:top;${i > 0 ? `border-top:1px solid ${BORDER};` : ""}">${escapeHtml(r.label)}</td>
      <td style="padding:9px 14px;font-size:13px;color:${TEXT};vertical-align:top;${i > 0 ? `border-top:1px solid ${BORDER};` : ""}">${r.raw ? r.value : escapeHtml(r.value)}</td>
    </tr>`).join("")}
  </table>`;
}

// Splits a "\n" or ","-separated presenter list the same way the frontend's splitPeopleList
// does, and renders it as one bullet per presenter (a single presenter just renders as plain
// text - no point bulleting a list of one). Each entry may carry an optional " — Title" suffix
// (parsePerson's convention), shown de-emphasised after the name.
export function presenterListHtml(presenter: string | null | undefined): string {
  const people = (presenter || "").split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
  const parsed = people.map(entry => {
    const idx = entry.indexOf(" — ");
    return idx === -1 ? { name: entry, title: "" } : { name: entry.slice(0, idx).trim(), title: entry.slice(idx + 3).trim() };
  });
  const personHtml = (p: { name: string; title: string }) => `${escapeHtml(p.name)}${p.title ? `<span style="color:${FAINT};"> — ${escapeHtml(p.title)}</span>` : ""}`;
  if (parsed.length === 0) return "";
  if (parsed.length === 1) return personHtml(parsed[0]);
  return `<ul style="margin:0;padding-left:16px;">${parsed.map(p => `<li style="margin:0 0 3px 0;">${personHtml(p)}</li>`).join("")}</ul>`;
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
export function certificateEmailSubject(sessionName: string, override?: EmailOverride): string {
  return override?.subject || `Your CPD Certificate: ${sessionName}`;
}

export function certificateEmailHtml({ name, sessionName, dateLabel, reflectionContent, override }: {
  name: string;
  sessionName: string;
  dateLabel: string; // e.g. "on Thursday 12 December 2026"
  reflectionContent?: string | null;
  override?: EmailOverride;
}): string {
  const reflectionSection = reflectionContent
    ? `<div style="margin:16px 0 4px 0;font-size:11.5px;font-weight:600;color:${FAINT};">YOUR SUBMITTED REFLECTION</div>${calloutHtml(paragraphsHtml(reflectionContent), GREEN)}`
    : "";

  if (override?.html) {
    return applyPlaceholders(override.html, {
      name: escapeHtml(firstName(name)), title: escapeHtml(sessionName), dateLabel: escapeHtml(dateLabel), reflectionSection,
    });
  }

  const heading = override?.heading || "Your certificate is attached";
  const introHtml = override?.intro
    ? `<p style="margin:0 0 14px 0;">${escapeHtml(override.intro)}</p>`
    : `<p style="margin:0 0 14px 0;">Please find attached your CPD certificate for ${boldHtml(sessionName)} ${escapeHtml(dateLabel)}.</p>`;
  return wrapEmailHtml({
    preheader: `Your CPD certificate for ${sessionName} is attached`,
    title: `Your CPD Certificate: ${sessionName}`,
    bodyHtml: `
      <h1 style="margin:0 0 14px 0;font-size:19px;font-weight:800;color:${GREEN};">${escapeHtml(heading)}</h1>
      <p style="margin:0 0 14px 0;">Hi ${escapeHtml(firstName(name))},</p>
      ${introHtml}
      ${reflectionSection}
    `,
  });
}

// The placeholder-token version of the default certificate body, used by Settings to seed the
// HTML editor. Mirrors certificateEmailHtml()'s own default (non-override) branch exactly, but
// with {{token}} strings standing in for real values - {{reflectionSection}} substitutes to
// either "" or a whole pre-rendered block, same as the real send path, so it can't just be
// generated by calling certificateEmailHtml() itself (that would double-wrap it).
export function certificateEmailDefaultTemplate(): string {
  return wrapEmailHtml({
    preheader: "Your CPD certificate for {{title}} is attached",
    title: "Your CPD Certificate: {{title}}",
    bodyHtml: `
      <h1 style="margin:0 0 14px 0;font-size:19px;font-weight:800;color:${GREEN};">Your certificate is attached</h1>
      <p style="margin:0 0 14px 0;">Hi {{name}},</p>
      <p style="margin:0 0 14px 0;">Please find attached your CPD certificate for ${boldHtml("{{title}}")} {{dateLabel}}.</p>
      {{reflectionSection}}
    `,
  });
}

// Shared by send-registration-confirmation (the only caller today, but factored out the same way
// as the other templates so its default lives next to everything else, and so an admin's HTML
// override renders identically regardless of which flow eventually sends it).
export function registrationConfirmationSubject(eventTitle: string, override?: EmailOverride): string {
  return override?.subject || `Registration confirmed: ${eventTitle}`;
}

// For a Hybrid event, splits the Location row into the physical venue and "Online" separated by
// a centred "OR", rather than only surfacing the online option as the "Join online" button below
// - so someone skimming just the details table still sees both ways to attend, not only one.
function locationRowHtml(location: string | null | undefined, isHybrid: boolean): string {
  const onlineLine = `Online<span style="color:${FAINT};"> (join link below)</span>`;
  if (!isHybrid) return location ? escapeHtml(location) : "";
  if (!location) return onlineLine;
  return `${escapeHtml(location)}<div style="margin:6px 0;font-size:10px;font-weight:700;letter-spacing:.5px;color:${FAINT};">OR</div>${onlineLine}`;
}

export function registrationConfirmationHtml({
  name, title, date, time, location, address, presenter, eventUrl, meetingUrl, mode, override,
}: {
  name: string; title: string; date: string; time: string;
  location?: string | null; address?: string | null; presenter?: string | null;
  eventUrl: string; meetingUrl?: string | null; mode?: string | null; override?: EmailOverride;
}): string {
  const isOnline = !!meetingUrl;
  const isHybrid = mode === "Hybrid";
  const locationValue = locationRowHtml(location, isHybrid);
  const detailsTable = detailRowsHtml([
    { label: "Date", value: date }, { label: "Time", value: time }, { label: "Location", value: locationValue, raw: true },
    { label: "Address", value: address }, { label: "Presenter", value: presenterListHtml(presenter), raw: true },
  ]);
  const buttons = sideBySideButtonsHtml([
    { label: "View event details", href: eventUrl, color: BLUE },
    ...(isOnline ? [{ label: "Join online", href: meetingUrl!, color: GREEN }] : []),
  ]);
  const disclaimer = isOnline ? disclaimerHtml("The online event button will only work from 20 minutes before the event starts.") : "";

  if (override?.html) {
    return applyPlaceholders(override.html, {
      name: escapeHtml(firstName(name)), title: escapeHtml(title), date: escapeHtml(date), time: escapeHtml(time),
      location: locationValue, address: escapeHtml(address || ""), presenter: presenterListHtml(presenter),
      eventUrl, meetingUrl: meetingUrl || "", detailsTable, buttons, disclaimer,
    });
  }

  const heading = override?.heading || "You're Registered";
  const introHtml = override?.intro
    ? `<p style="margin:0 0 14px 0;">${escapeHtml(override.intro)}</p>`
    : `<p style="margin:0 0 14px 0;">You're registered for ${boldHtml(title)}.</p>`;
  return wrapEmailHtml({
    preheader: `You're registered for ${title}`,
    title: `Registration confirmed: ${title}`,
    bodyHtml: `
      <h1 style="margin:0 0 14px 0;font-size:19px;font-weight:800;color:${BLUE};text-align:center;text-transform:uppercase;letter-spacing:.4px;">${escapeHtml(heading)}</h1>
      <p style="margin:0 0 14px 0;">Hi ${escapeHtml(firstName(name))},</p>
      ${introHtml}
      ${detailsTable}
      ${buttons}
      ${disclaimer}
      ${paragraphsHtml("We look forward to seeing you there. You'll receive a follow-up email with a link to submit your reflection and receive your CPD certificate after the event.")}
    `,
  });
}

// Placeholder-token default - mirrors the non-override branch above exactly (see
// certificateEmailDefaultTemplate for why this can't just call registrationConfirmationHtml()).
export function registrationConfirmationDefaultTemplate(): string {
  return wrapEmailHtml({
    preheader: "You're registered for {{title}}",
    title: "Registration confirmed: {{title}}",
    bodyHtml: `
      <h1 style="margin:0 0 14px 0;font-size:19px;font-weight:800;color:${BLUE};text-align:center;text-transform:uppercase;letter-spacing:.4px;">You're Registered</h1>
      <p style="margin:0 0 14px 0;">Hi {{name}},</p>
      <p style="margin:0 0 14px 0;">You're registered for ${boldHtml("{{title}}")}.</p>
      {{detailsTable}}
      {{buttons}}
      {{disclaimer}}
      ${paragraphsHtml("We look forward to seeing you there. You'll receive a follow-up email with a link to submit your reflection and receive your CPD certificate after the event.")}
    `,
  });
}

// Shared by send-reflection-reminder (the only caller today - factored out the same way as the
// other templates so an admin's HTML override renders identically no matter which flow sends it).
export function reflectionReminderSubject(eventTitle: string, override?: EmailOverride): string {
  return override?.subject || `Reminder: submit your reflection for ${eventTitle}`;
}

export function reflectionReminderHtml({ name, title, link, override }: {
  name: string; title: string; link: string; override?: EmailOverride;
}): string {
  const button = btnHtml("Submit your reflection", link);

  if (override?.html) {
    return applyPlaceholders(override.html, {
      name: escapeHtml(firstName(name)), title: escapeHtml(title), link, button,
    });
  }

  const heading = override?.heading || "Just a friendly reminder";
  const introHtml = override?.intro
    ? `<p style="margin:0 0 14px 0;">${escapeHtml(override.intro)}</p>`
    : `<p style="margin:0 0 14px 0;">You attended ${boldHtml(title)}, but we haven't received your reflection yet. Submit it to get your CPD certificate.</p>`;
  return wrapEmailHtml({
    preheader: `Submit your reflection for ${title} to get your CPD certificate`,
    title: `Reminder: submit your reflection for ${title}`,
    bodyHtml: `
      <h1 style="margin:0 0 14px 0;font-size:19px;font-weight:800;color:${BLUE};">${escapeHtml(heading)}</h1>
      <p style="margin:0 0 14px 0;">Hi ${escapeHtml(firstName(name))},</p>
      ${introHtml}
      ${button}
      <p style="margin:0 0 14px 0;">If you've already submitted this, you can disregard this reminder.</p>
    `,
  });
}

// Placeholder-token default - mirrors the non-override branch above exactly.
export function reflectionReminderDefaultTemplate(): string {
  return wrapEmailHtml({
    preheader: "Submit your reflection for {{title}} to get your CPD certificate",
    title: "Reminder: submit your reflection for {{title}}",
    bodyHtml: `
      <h1 style="margin:0 0 14px 0;font-size:19px;font-weight:800;color:${BLUE};">Just a friendly reminder</h1>
      <p style="margin:0 0 14px 0;">Hi {{name}},</p>
      <p style="margin:0 0 14px 0;">You attended ${boldHtml("{{title}}")}, but we haven't received your reflection yet. Submit it to get your CPD certificate.</p>
      {{button}}
      <p style="margin:0 0 14px 0;">If you've already submitted this, you can disregard this reminder.</p>
    `,
  });
}

export function wrapEmailHtml({ preheader = "", title, bodyHtml, footerNote, signOff = "- WHMI Education Team" }: { preheader?: string; title: string; bodyHtml: string; footerNote?: string; signOff?: string }): string {
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
                <img src="${WH_LOGO_DATA_URI}" alt="Western Health" width="82" style="display:block;margin:0 auto 6px auto;height:auto;border:0;" />
                <div style="font-size:10px;font-weight:700;letter-spacing:1.4px;color:${NAVY};text-transform:uppercase;">Medical Imaging CPD</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 28px 6px 28px;color:${TEXT};font-size:14px;line-height:1.6;">
                ${bodyHtml}
                <p style="margin:18px 0 0 0;">${signOff}</p>
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
export type EmailOverride = { subject?: string; heading?: string; intro?: string; html?: string };

export function thankYouEmailSubject(eventTitle: string, override?: EmailOverride): string {
  return override?.subject || `Thanks for attending ${eventTitle}: share your feedback`;
}

export function thankYouEmailText(name: string, eventTitle: string, reflectUrl: string, override?: EmailOverride): string {
  const intro = override?.intro || `Thanks for attending ${eventTitle}. We hope you found it valuable.`;
  return `Hi ${firstName(name)},\n\n${intro}\n\nWe'd love to hear your thoughts. Please take a few minutes to complete your CPD reflection and feedback form. Once submitted, your CPD certificate will be emailed to you automatically.\n\nFill in your reflection here: ${reflectUrl}\n\n- WHMI Education Team`;
}

export function thankYouEmailHtml(name: string, eventTitle: string, reflectUrl: string, override?: EmailOverride): string {
  if (override?.html) {
    return applyPlaceholders(override.html, {
      name: escapeHtml(firstName(name)), title: escapeHtml(eventTitle), reflectUrl,
      button: btnHtml("Submit your reflection", reflectUrl),
    });
  }

  const heading = override?.heading || "Thanks for coming along";
  const introHtml = override?.intro ? `<p style="margin:0 0 14px 0;">${escapeHtml(override.intro)}</p>` : `<p style="margin:0 0 14px 0;">Thanks for attending ${boldHtml(eventTitle)}. We hope you found it valuable.</p>`;
  return wrapEmailHtml({
    preheader: `Submit your reflection for ${eventTitle} to get your CPD certificate`,
    title: `Thanks for attending ${eventTitle}`,
    bodyHtml: `
      <h1 style="margin:0 0 14px 0;font-size:19px;font-weight:800;color:${BLUE};">${escapeHtml(heading)}</h1>
      <p style="margin:0 0 14px 0;">Hi ${escapeHtml(firstName(name))},</p>
      ${introHtml}
      <p style="margin:0 0 14px 0;">We'd love to hear your thoughts. Please take a few minutes to complete your CPD reflection and feedback form. Once submitted, your CPD certificate will be emailed to you automatically.</p>
      ${btnHtml("Submit your reflection", reflectUrl)}
      <p style="margin:0 0 14px 0;">It only takes a couple of minutes, and your certificate lands in your inbox right after.</p>
    `,
  });
}

// Placeholder-token default, mirrors the non-override branch above exactly (see
// certificateEmailDefaultTemplate for why this can't just call thankYouEmailHtml() itself).
export function thankYouEmailDefaultTemplate(): string {
  return wrapEmailHtml({
    preheader: "Submit your reflection for {{title}} to get your CPD certificate",
    title: "Thanks for attending {{title}}",
    bodyHtml: `
      <h1 style="margin:0 0 14px 0;font-size:19px;font-weight:800;color:${BLUE};">Thanks for coming along</h1>
      <p style="margin:0 0 14px 0;">Hi {{name}},</p>
      <p style="margin:0 0 14px 0;">Thanks for attending ${boldHtml("{{title}}")}. We hope you found it valuable.</p>
      <p style="margin:0 0 14px 0;">We'd love to hear your thoughts. Please take a few minutes to complete your CPD reflection and feedback form. Once submitted, your CPD certificate will be emailed to you automatically.</p>
      {{button}}
      <p style="margin:0 0 14px 0;">It only takes a couple of minutes, and your certificate lands in your inbox right after.</p>
    `,
  });
}

// Separate, presenter-facing "thanks for presenting" copy - deliberately distinct from
// thankYouEmail* above (no reflection-form ask, since presenters aren't being asked to reflect
// on someone else's session) and not override-configurable, unlike the attendee templates,
// to keep this addition scoped to what was actually asked for.
export function presenterThankYouSubject(eventTitle: string): string {
  return `Thank you for presenting ${eventTitle}`;
}

export function presenterThankYouText(name: string, eventTitle: string, certificateAttached: boolean): string {
  const certLine = certificateAttached ? "\n\nYour CPD certificate for presenting is attached." : "";
  return `Hi ${firstName(name)},\n\nThank you for taking the time to present at ${eventTitle}.\n\nWe appreciate the time and expertise you put into the session and your contribution to ongoing learning across Western Health and the Medical Imaging department.${certLine}\n\nKind regards,\n\nWHMI Education Team`;
}

export function presenterThankYouHtml(name: string, eventTitle: string, certificateAttached: boolean): string {
  const certLine = certificateAttached
    ? `<p style="margin:0 0 14px 0;">Your CPD certificate for presenting is attached.</p>`
    : "";
  return wrapEmailHtml({
    preheader: `Thank you for presenting ${eventTitle}`,
    title: `Thank you for presenting ${eventTitle}`,
    signOff: "Kind regards,<br/><br/>WHMI Education Team",
    bodyHtml: `
      <h1 style="margin:0 0 14px 0;font-size:19px;font-weight:800;color:${BLUE};">Thank you for presenting</h1>
      <p style="margin:0 0 14px 0;">Hi ${escapeHtml(firstName(name))},</p>
      <p style="margin:0 0 14px 0;">Thank you for taking the time to present at ${boldHtml(eventTitle)}.</p>
      <p style="margin:0 0 14px 0;">We appreciate the time and expertise you put into the session and your contribution to ongoing learning across Western Health and the Medical Imaging department.</p>
      ${certLine}
    `,
  });
}
