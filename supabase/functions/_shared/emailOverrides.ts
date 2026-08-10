// Reads admin-edited subject/heading/intro overrides for the most commonly-sent emails
// (Settings > Email Templates in the app), stored as one JSON blob under the app_settings row
// keyed "email_template_overrides" - the same generic key/value store src/lib/db.js already
// uses for staff_field_visibility etc. `{title}` in any override field is substituted with the
// event's actual title before use.
import type { EmailOverride } from "./emailTemplate.ts";

export async function getEmailOverride(
  // deno-lint-ignore no-explicit-any
  supabaseAdmin: any,
  key: "registration_confirmation" | "post_event_thank_you" | "reflection_reminder",
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
    return result;
  } catch (err) {
    console.error("getEmailOverride", err);
    return {};
  }
}
