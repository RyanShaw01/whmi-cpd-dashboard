// Admin/owner-only: sends a sample copy of any of the 6 email templates to the caller's own
// address, using whatever is CURRENTLY saved in Settings > Email Templates (including a
// full-HTML override, if one's set) - so an admin can verify their edits actually look right in a
// real inbox without needing to create a real event, register for it, wait for a cron, etc.
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendEmail } from "../_shared/mailer.ts";
import {
  registrationConfirmationHtml, registrationConfirmationSubject,
  reflectionReminderHtml, reflectionReminderSubject,
  thankYouEmailHtml, thankYouEmailSubject,
  certificateEmailHtml, certificateEmailSubject,
  wrapEmailHtml, reflectionSectionsHtml, reflectionEntryCardHtml, boldHtml, escapeHtml, BLUE,
  firstName,
} from "../_shared/emailTemplate.ts";
import { getEmailOverride } from "../_shared/emailOverrides.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const SAMPLE_TITLE = "Ultrasound-Guided Procedures Workshop";
const SAMPLE_SECTIONS = [
  {
    label: "Reflection",
    items: [
      { question: "What did you learn?", answer: "How to optimise probe positioning for deeper vascular access under real-time guidance." },
      { question: "How will this change your practice?", answer: "I'll incorporate the checklist approach for line placement in my next few procedures." },
    ],
  },
];

const TEMPLATE_KEYS = ["registration_confirmation", "post_event_thank_you", "reflection_reminder", "certificate", "reflection_copy", "reflections_report"];

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
    const { data: callerRow } = await supabaseAdmin.from("users").select("id, name, email, role").eq("auth_id", callerData.user.id).maybeSingle();
    if (!callerRow || !["admin", "owner"].includes(callerRow.role)) {
      return new Response(JSON.stringify({ ok: false, error: "forbidden" }), { status: 403, headers: CORS_HEADERS });
    }

    const { templateKey } = await req.json();
    if (!TEMPLATE_KEYS.includes(templateKey)) {
      return new Response(JSON.stringify({ ok: false, error: "unknown templateKey" }), { status: 400, headers: CORS_HEADERS });
    }

    const to = callerRow.email;
    const name = callerRow.name || "there";
    const titleForOverride = templateKey === "reflections_report" ? name : SAMPLE_TITLE;
    const override = await getEmailOverride(supabaseAdmin, templateKey as Parameters<typeof getEmailOverride>[1], titleForOverride);

    let subject = "";
    let html = "";
    let text = "";

    switch (templateKey) {
      case "registration_confirmation": {
        subject = registrationConfirmationSubject(SAMPLE_TITLE, override);
        html = registrationConfirmationHtml({
          name, title: SAMPLE_TITLE, date: "Thursday 15 August 2026", time: "5:00 PM - 7:00 PM",
          location: "Footscray Hospital - Auditorium", address: "160 Gordon St, Footscray VIC 3011",
          presenter: "Dr. Jane Smith", eventUrl: "https://whmi-cpd-dashboard.vercel.app", meetingUrl: "https://zoom.us/example",
          override,
        });
        text = `Hi ${firstName(name)},\n\nThis is a test send of the Registration Confirmation email.`;
        break;
      }
      case "post_event_thank_you": {
        subject = thankYouEmailSubject(SAMPLE_TITLE, override);
        html = thankYouEmailHtml(name, SAMPLE_TITLE, "https://whmi-cpd-dashboard.vercel.app/event/sample/reflect", override);
        text = `Hi ${firstName(name)},\n\nThis is a test send of the Post-Event Thank You email.`;
        break;
      }
      case "reflection_reminder": {
        subject = reflectionReminderSubject(SAMPLE_TITLE, override);
        html = reflectionReminderHtml({ name, title: SAMPLE_TITLE, link: "https://whmi-cpd-dashboard.vercel.app/event/sample/reflect", override });
        text = `Hi ${firstName(name)},\n\nThis is a test send of the Reflection Reminder email.`;
        break;
      }
      case "certificate": {
        subject = certificateEmailSubject(SAMPLE_TITLE, override);
        html = certificateEmailHtml({
          name, sessionName: SAMPLE_TITLE, dateLabel: "on Thursday 15 August 2026",
          reflectionContent: "This session gave me a much clearer picture of how to optimise probe positioning for deeper vascular access under real-time guidance.",
          override,
        });
        text = `Hi ${firstName(name)},\n\nThis is a test send of the CPD Certificate email.`;
        break;
      }
      case "reflection_copy": {
        const heading = override.heading || "Your reflection";
        subject = override.subject || `Your CPD Reflection: ${SAMPLE_TITLE}`;
        html = wrapEmailHtml({
          preheader: `Your CPD reflection for ${SAMPLE_TITLE}`,
          title: `Your CPD Reflection: ${SAMPLE_TITLE}`,
          bodyHtml: `
            <h1 style="margin:0 0 14px 0;font-size:19px;font-weight:800;color:${BLUE};">${escapeHtml(heading)}</h1>
            ${override.intro ? `<p style="margin:0 0 14px 0;">${escapeHtml(override.intro)}</p>` : ""}
            <p style="margin:0 0 4px 0;">${boldHtml(SAMPLE_TITLE)}</p>
            <p style="margin:0 0 14px 0;font-size:12.5px;color:#6b7785;">15 August 2026</p>
            ${reflectionSectionsHtml(SAMPLE_SECTIONS)}
          `,
        });
        text = `This is a test send of the Email Me My Reflection copy.`;
        break;
      }
      case "reflections_report": {
        const heading = override.heading || "CPD Reflections Report";
        subject = override.subject || `CPD Reflections Report: ${name}`;
        const entries = [
          { activityName: SAMPLE_TITLE, activityDate: "15 August 2026", sections: SAMPLE_SECTIONS },
          { activityName: "Radiation Safety Refresher", activityDate: "2 July 2026", sections: SAMPLE_SECTIONS },
        ];
        html = wrapEmailHtml({
          preheader: `CPD reflections report for ${name}`,
          title: `CPD Reflections Report: ${name}`,
          bodyHtml: `
            <h1 style="margin:0 0 4px 0;font-size:19px;font-weight:800;color:${BLUE};">${escapeHtml(heading)}</h1>
            ${override.intro ? `<p style="margin:0 0 14px 0;">${escapeHtml(override.intro)}</p>` : ""}
            <p style="margin:0 0 18px 0;font-size:12.5px;color:#6b7785;">${boldHtml(name)} - ${entries.length} reflections</p>
            ${entries.map(entry => reflectionEntryCardHtml(entry)).join("")}
          `,
        });
        text = `This is a test send of the Reflections Report email.`;
        break;
      }
    }

    const emailResult = await sendEmail({ to, subject: `[TEST] ${subject}`, text, html });
    if (!emailResult.ok) {
      return new Response(JSON.stringify({ ok: false, error: emailResult.error || "email failed to send" }), { status: 502, headers: CORS_HEADERS });
    }

    return new Response(JSON.stringify({ ok: true, sentTo: to }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("send-test-email error", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: CORS_HEADERS });
  }
});
