// Reads admin-edited overrides for the most commonly-sent emails (Settings > Email Templates in
// the app), stored as one JSON blob under the app_settings row keyed "email_template_overrides" -
// the same generic key/value store src/lib/db.js already uses for staff_field_visibility etc.
//
// Two override shapes coexist here:
//  - subject/heading/intro (legacy, still used by reflection_copy and reflections_report, whose
//    content is a dynamic list of Q&A entries that doesn't reduce to a static HTML template).
//    `{title}` (single braces) in any of these three is substituted with the event's actual
//    title before use.
//  - html (registration_confirmation, post_event_thank_you, reflection_reminder, certificate):
//    a full replacement for the email body, edited as raw HTML in Settings. Contains `{{token}}`
//    (double braces) placeholders - substituted per-send by applyPlaceholders() at the call site,
//    which is the only place that knows what values are actually available for that template, so
//    it's returned here unsubstituted.
import type { EmailOverride } from "./emailTemplate.ts";

export async function getEmailOverride(
  // deno-lint-ignore no-explicit-any
  supabaseAdmin: any,
  key: "registration_confirmation" | "post_event_thank_you" | "reflection_reminder" | "certificate" | "reflection_copy" | "reflections_report",
  title: string,
): Promise<EmailOverride> {
  try {
    const { data, error } = await supabaseAdmin.from("app_settings").select("value").eq("key", "email_template_overrides").maybeSingle();
    if (error || !data?.value) return {};
    const entry = data.value[key];
    if (!entry) return {};
    const sub = (s: string | null | undefined) => (s ? s.replace(/\{title\}/g, title) : undefined);
    const result: EmailOverride = {};
    if (sub(entry.subject)) result.subject = sub(entry.subject);
    if (sub(entry.heading)) result.heading = sub(entry.heading);
    if (sub(entry.intro)) result.intro = sub(entry.intro);
    if (entry.html) result.html = entry.html;
    return result;
  } catch (err) {
    console.error("getEmailOverride", err);
    return {};
  }
}
