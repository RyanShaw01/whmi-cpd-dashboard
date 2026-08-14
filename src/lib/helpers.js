export function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function daysUntil(dateStr) {
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target - now) / 86400000);
}

export function fmtDate(d) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
}

/* "HH:MM" -> "4pm" / "4:30pm", 12-hour, no leading zero. */
export function fmtTime12h(hhmm) {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  if ([h, m].some(Number.isNaN)) return "";
  const period = h >= 12 ? "pm" : "am";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return m === 0 ? `${h12}${period}` : `${h12}:${String(m).padStart(2, "0")}${period}`;
}

/* "HH:MM", "HH:MM" -> "4pm - 5pm". */
export function fmtTimeRange12h(start, end) {
  const s = fmtTime12h(start);
  const e = fmtTime12h(end);
  if (!s || !e) return s || e || "—";
  return `${s} - ${e}`;
}

/*
 * Countdown to an event's start time, always relative (never a literal date/time — the
 * exact date and time are shown separately alongside this, so repeating them here would
 * be redundant): minutes, then hours, then days, then weeks the further out it gets.
 */
export function formatCountdown(dateStr, startTime) {
  const target = new Date(`${dateStr}T${startTime}:00`);
  const now = new Date();
  const diffMs = target - now;

  if (diffMs <= 0) return "Now";

  const minutes = diffMs / 60000;
  if (minutes < 60) { const n = Math.max(1, Math.round(minutes)); return `in ${n} minute${n === 1 ? "" : "s"}`; }

  const hours = diffMs / 3600000;
  if (hours < 24) { const n = Math.round(hours); return `in ${n} hour${n === 1 ? "" : "s"}`; }

  const days = diffMs / 86400000;
  if (days < 7) { const n = Math.round(days); return `in ${n} day${n === 1 ? "" : "s"}`; }

  const weeks = Math.round(days / 7);
  return `in ${weeks} week${weeks === 1 ? "" : "s"}`;
}

/* Human-readable duration between two "HH:MM" times, e.g. "2 hr 30 min". */
export function formatDuration(start, end) {
  if (!start || !end) return "—";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if ([sh, sm, eh, em].some(Number.isNaN)) return "—";
  let minutes = (eh * 60 + em) - (sh * 60 + sm);
  if (minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

/* Online/hybrid meeting links open 20 minutes before start, close at event end. */
export function canJoinMeeting(dateStr, startTime, endTime) {
  const start = new Date(`${dateStr}T${startTime}:00`);
  const end = endTime && endTime !== "—" ? new Date(`${dateStr}T${endTime}:00`) : new Date(start.getTime() + 3600000);
  const opensAt = new Date(start.getTime() - 20 * 60000);
  const now = new Date();
  return now >= opensAt && now <= end;
}

/* Faint countdown text shown under an event card's date: weeks away, then days once under
 * 3 weeks out, then hours once under 2 days out, and "Happening now" (flagged via `happening`
 * so the caller can render it in an obviously-coloured box) while the event is in progress. */
export function eventCountdownText(dateStr, startTime, endTime) {
  if (!dateStr || !startTime) return null;
  const start = new Date(`${dateStr}T${startTime}:00`);
  const end = endTime ? new Date(`${dateStr}T${endTime}:00`) : new Date(start.getTime() + 3600000);
  const now = new Date();
  if (now >= start && now <= end) return { text: "Happening now", happening: true };
  const diffMs = start - now;
  if (diffMs <= 0) return null; // already finished
  const hours = diffMs / 3600000;
  if (hours < 48) return { text: `in ${Math.max(1, Math.round(hours))} hour${Math.round(hours) === 1 ? "" : "s"}`, happening: false };
  const days = diffMs / 86400000;
  if (days < 21) return { text: `in ${Math.round(days)} day${Math.round(days) === 1 ? "" : "s"}`, happening: false };
  const weeks = Math.round(days / 7);
  return { text: `in ${weeks} week${weeks === 1 ? "" : "s"}`, happening: false };
}

/* Big-banner-card vs compact-list display — a personal display preference (like the due-soon
 * toggle), remembered across sessions via localStorage and settable both from the section
 * itself and from Settings > Appearance. Upcoming Events and the Dashboard's Up Next section
 * each get their own key, so picking a view in one doesn't change the other. */
export function makeViewPref(storageKey) {
  return {
    get: () => { try { const v = localStorage.getItem(storageKey); return v === "list" ? "list" : "grid"; } catch { return "grid"; } },
    set: (value) => { try { localStorage.setItem(storageKey, value); } catch { /* ignore */ } },
  };
}
const upcomingEventsViewPref = makeViewPref("whmi_upcoming_events_view");
export const getEventCardViewDefault = upcomingEventsViewPref.get;
export const setEventCardViewDefault = upcomingEventsViewPref.set;

const dashboardUpNextViewPref = makeViewPref("whmi_dashboard_upnext_view");
export const getDashboardEventViewDefault = dashboardUpNextViewPref.get;
export const setDashboardEventViewDefault = dashboardUpNextViewPref.set;

/* Whether to show the plain-text "due soon" events list at the top of the Dashboard — a
 * personal display preference, not an admin setting, so it lives in localStorage rather than
 * the user's DB profile and applies immediately without a round-trip. */
const SHOW_DUE_SOON_KEY = "whmi_dashboard_show_due_soon";
export const getShowDueSoonDefault = () => {
  try { const v = localStorage.getItem(SHOW_DUE_SOON_KEY); return v === null ? true : v === "true"; } catch { return true; }
};
export const setShowDueSoonDefault = (value) => {
  try { localStorage.setItem(SHOW_DUE_SOON_KEY, String(value)); } catch { /* ignore */ }
};

/* Whether the due-soon list also spells out each event's literal date/time (in addition to the
 * relative countdown, which always shows) — off by default since the countdown already conveys
 * urgency and the literal date/time reads as clutter for most people. */
const SHOW_DUE_SOON_DATES_KEY = "whmi_dashboard_due_soon_dates";
export const getShowDueSoonDatesDefault = () => {
  try { const v = localStorage.getItem(SHOW_DUE_SOON_DATES_KEY); return v === "true"; } catch { return false; }
};
export const setShowDueSoonDatesDefault = (value) => {
  try { localStorage.setItem(SHOW_DUE_SOON_DATES_KEY, String(value)); } catch { /* ignore */ }
};

/* Whether an event has finished, independent of its admin-set status;
 * "Leave Feedback" eligibility follows wall-clock time, not manual lifecycle state. */
export function hasEventEnded(dateStr, endTime) {
  if (!dateStr || !endTime) return false;
  const end = new Date(`${dateStr}T${endTime}:00`);
  return new Date() > end;
}

/* True for the 24h grace window between an event ending and the complete-finished-events cron
 * actually flipping its status to Completed (see supabase/functions/complete-finished-events) —
 * during that window it still shows in Upcoming/Up Next, just stripped down to a "reflect and
 * get your certificate" prompt instead of the usual event details. */
export function isRecentlyCompleted(dateStr, endTime) {
  if (!dateStr || !endTime) return false;
  const end = new Date(`${dateStr}T${endTime}:00`);
  const hoursSinceEnd = (Date.now() - end.getTime()) / 3600000;
  return hoursSinceEnd >= 0 && hoursSinceEnd < 24;
}

/* Splits a raw event list into the "featured" set shown in HappeningNowSection (currently live,
 * or ended within the last 24h) versus everything else — shared by every dashboard that shows
 * that section (admin/owner Dashboard, MyCpd, ExternalDashboard) so "live" and "recently ended"
 * are defined in exactly one place. */
export function splitFeaturedEvents(events) {
  const liveEvents = events.filter(ev => eventCountdownText(ev.date, ev.start, ev.end)?.happening);
  const liveIds = new Set(liveEvents.map(ev => ev.id));
  const recentlyEndedEvents = events.filter(ev => !liveIds.has(ev.id) && isRecentlyCompleted(ev.date, ev.end));
  const featuredEvents = [...liveEvents, ...recentlyEndedEvents];
  const featuredIds = new Set(featuredEvents.map(ev => ev.id));
  return { liveEvents, liveIds, recentlyEndedEvents, featuredEvents, featuredIds };
}

/* A user's own certificates — externals match by recipient email (or name, for
 * manually-created certs before an account existed), internal viewers by name. */
export function myCertificates(certificates, user) {
  if (user.userType === "external") {
    return certificates.filter(c => c.recipientEmail?.toLowerCase() === user.email.toLowerCase() || c.staff === user.name);
  }
  return certificates.filter(c => c.staff === user.name);
}

export const ACTION_LABELS = {
  "user.login": "logged in",
  "user.logout": "logged out",
  "user.updated": "updated a user",
  "staff.created": "added a staff record",
  "staff.updated": "updated a staff record",
  "event.created": "created an event",
  "event.updated": "edited an event",
  "event.status_changed": "changed event status",
  "event.deleted": "deleted an event",
  "registration.created": "registered for",
  "registration.updated": "updated a registration",
  "registration.attendance_changed": "changed attendance status",
  "registration.deleted": "deleted a registration",
  "certificate.approved": "approved a certificate",
  "certificate.resent": "resent a certificate",
  "certificate.created_manual": "created a manual certificate",
  "certificate.deleted": "deleted a certificate",
  "cpd_type.created": "added a CPD type",
  "cpd_type.updated": "updated a CPD type",
  "cpd_type.deleted": "deleted a CPD type",
  "tag.created": "added a tag",
  "tag.updated": "updated a tag",
  "tag.deleted": "deleted a tag",
  "avatar_icon.created": "added an avatar icon",
  "avatar_icon.updated": "updated an avatar icon",
  "avatar_icon.deleted": "deleted an avatar icon",
  "avatar_color.created": "added an avatar colour",
  "avatar_color.updated": "updated an avatar colour",
  "avatar_color.deleted": "deleted an avatar colour",
  "reflection.reminder_sent": "sent a reflection reminder",
  "file.uploaded": "uploaded a file",
  "file.deleted": "deleted a file",
  "brainstorm_idea.created": "added a CPD Brainstorming idea",
  "brainstorm_idea.updated": "edited a CPD Brainstorming idea",
  "brainstorm_idea.deleted": "deleted a CPD Brainstorming idea",
};

// Best-effort human-readable name for the entity an activity-log entry refers to, drawn from
// whatever the action already stashed in `details` — used to name the specific event/idea/etc.
// in the Recent Activity feed instead of just "edited an event".
export function activityEntityName(action, details) {
  if (!details) return null;
  if (action === "event.created" || action === "event.updated" || action === "event.deleted") return details.title || null;
  if (action === "registration.created") return details.eventTitle || null;
  if (action === "brainstorm_idea.created" || action === "brainstorm_idea.deleted") {
    const content = details.content || "";
    return content.length > 40 ? `${content.slice(0, 40)}…` : content || null;
  }
  return null;
}

export function relativeTime(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

/* Every past send of a given email template to a given recipient, newest first - powers the
 * per-registrant "sent N times, last X ago" label + hover tooltip on individual send buttons.
 * `emailLog` is whatever fetchEmailLogForEvent() returned (already scoped to one event). */
export function sendHistoryFor(emailLog, email, templateKey) {
  const target = (email || "").trim().toLowerCase();
  if (!target) return [];
  return (emailLog || [])
    .filter(e => e.templateKey === templateKey && e.status === "sent" && (e.recipientEmail || "").trim().toLowerCase() === target)
    .sort((a, b) => (b.sentAt || "").localeCompare(a.sentAt || ""));
}

export function fmtDateTime(iso) {
  try {
    return new Date(iso).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return iso;
  }
}

/* Cert-based CPD hour totals for a user (works for both internal viewers and externals,
 * neither of which necessarily have a linked `staff` record with a pre-aggregated total). */
export function myCpdTotals(certificates, user, { year = new Date().getFullYear() } = {}) {
  const sent = myCertificates(certificates, user).filter(c => c.status === "Sent");
  const total = sent.reduce((sum, c) => sum + (c.cpdHours || 0), 0);
  const thisYear = sent
    .filter(c => c.date && new Date(`${c.date}T00:00:00`).getFullYear() === year)
    .reduce((sum, c) => sum + (c.cpdHours || 0), 0);
  return { total: Math.round(total * 10) / 10, thisYear: Math.round(thisYear * 10) / 10 };
}

/* Finished events this user registered for but hasn't reflected on yet — matches registrations
 * by userId or email so it works whether or not the registration has a linked account. */
export function outstandingReflectionsForUser(events, registrations, reflections, user) {
  const myRegisteredEventIds = new Set(
    (registrations || [])
      .filter(r => r.userId === user.id || r.email?.toLowerCase() === user.email?.toLowerCase())
      .map(r => r.eventId)
  );
  const myReflectedEventIds = new Set(
    (reflections || []).filter(r => r.email?.toLowerCase() === user.email?.toLowerCase()).map(r => r.eventId)
  );
  return (events || []).filter(e => myRegisteredEventIds.has(e.id) && hasEventEnded(e.date, e.end) && !myReflectedEventIds.has(e.id));
}

/* The event's "Promotional Flyer" file, if one's been uploaded and it's an image
 * (PDFs etc. have no visual banner to show). */
export function eventBannerFile(files, eventId) {
  return (files || []).find(f =>
    f.eventId === eventId && f.kind === "flyer" && f.url && /\.(jpe?g|png|webp|gif)$/i.test(f.storagePath || "")
  ) || null;
}
export function eventBannerUrl(files, eventId) {
  return eventBannerFile(files, eventId)?.url || null;
}

/* Exact CPD hours from event start/end, e.g. "09:00"-"12:30" -> 3.5. */
/* Everything after the hospital name in the "Hospital - Location (Level X, Room Y)" display
 * format — the hospital itself is rendered separately (bolded) by the caller. */
// Imaging-modality tags are shown as their own group ahead of everything else in the Topics
// picker, since they're the ones staff scan for first when tagging an event. Legacy fallback
// list, used only for tags whose `isModality` flag hasn't been set yet (pre-migration, or a
// brand new tag that hasn't been explicitly categorised).
const LEGACY_MODALITY_TAG_NAMES = ["X-Ray", "CT", "DSA", "MRI", "Ultrasound", "Nuclear medicine", "Nuclear medicine bone"];
const legacyIsModalityTag = (name) => LEGACY_MODALITY_TAG_NAMES.some(m => m.toLowerCase() === (name || "").toLowerCase());

// A tag's explicit `isModality` flag (set via Settings) always wins; only fall back to the
// legacy name list when the flag is undefined — i.e. the tag predates the is_modality column.
export function tagIsModality(tag) {
  return tag.isModality ?? legacyIsModalityTag(tag.name);
}

export function eventLocationSuffix(event) {
  const bracketParts = [];
  if (event.level) bracketParts.push(`Level ${event.level}`);
  if (event.room) bracketParts.push(`Room ${event.room}`);
  const bracket = bracketParts.length > 0 ? ` (${bracketParts.join(", ")})` : "";
  return `${event.location || ""}${bracket}`;
}

/* Presenters/organisers are stored as one free-text field; entry supports either newlines
 * (dot-pointed) or commas, so splitting on both keeps older comma-separated data working. */
export function splitPeopleList(str) {
  return (str || "").split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
}

/* A presenter/organiser entry may carry an optional job title appended after an em dash
 * ("Dr Jane Smith — Senior Radiographer"), entered via PeopleListField's two-field editor.
 * Splitting on " — " (em dash, spaced) rather than a plain hyphen means a hyphenated name or
 * title (e.g. "Mary-Anne", "Radiologist - Locum") is never mistaken for the separator. */
export function parsePerson(entry) {
  const idx = (entry || "").indexOf(" — ");
  if (idx === -1) return { name: (entry || "").trim(), title: "" };
  return { name: entry.slice(0, idx).trim(), title: entry.slice(idx + 3).trim() };
}
export function formatPerson(name, title) {
  const n = (name || "").trim();
  const t = (title || "").trim();
  return t ? `${n} — ${t}` : n;
}

export function eventCpdHours(start, end) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if ([sh, sm, eh, em].some(Number.isNaN)) return null;
  const minutes = (eh * 60 + em) - (sh * 60 + sm);
  if (minutes <= 0) return null;
  return Math.round((minutes / 60) * 100) / 100;
}
