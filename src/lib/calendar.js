// Add-to-calendar links for an event. Uses "floating" local date/times (no Z/TZID) since
// attendees are assumed to be in the event's own timezone — simplest thing that works
// correctly across Google/Outlook/Apple without a timezone database on the client.

function pad(n) { return String(n).padStart(2, "0"); }

// "2026-03-04" + "09:00" -> "20260304T090000"
function toIcsLocal(date, time) {
  const [h, m] = (time || "00:00").split(":");
  return `${date.replace(/-/g, "")}T${pad(h)}${pad(m)}00`;
}

function icsEscape(str) {
  return String(str || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function eventLocationText(event) {
  const parts = [event.campus, event.location].filter(Boolean);
  return parts.join(" - ");
}

export function buildIcsContent(event) {
  const start = toIcsLocal(event.date, event.start);
  const end = toIcsLocal(event.date, event.end);
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//WHMI CPD Dashboard//EN",
    "BEGIN:VEVENT",
    `UID:${event.id}@whmi-cpd-dashboard`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${icsEscape(event.title)}`,
    event.description ? `DESCRIPTION:${icsEscape(event.description)}` : "",
    eventLocationText(event) ? `LOCATION:${icsEscape(eventLocationText(event))}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n");
}

export function icsDownloadUrl(event) {
  const blob = new Blob([buildIcsContent(event)], { type: "text/calendar;charset=utf-8" });
  return URL.createObjectURL(blob);
}

export function googleCalendarUrl(event) {
  const start = toIcsLocal(event.date, event.start);
  const end = toIcsLocal(event.date, event.end);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    details: event.description || "",
    location: eventLocationText(event),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Outlook on the web uses UTC ("Z") ISO timestamps for its deep-link params — unlike the .ics
// file and Google link above, it doesn't accept a floating local time.
export function outlookWebUrl(event) {
  const startLocal = new Date(`${event.date}T${event.start || "00:00"}:00`);
  const endLocal = new Date(`${event.date}T${event.end || "00:00"}:00`);
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.title,
    startdt: startLocal.toISOString(),
    enddt: endLocal.toISOString(),
    body: event.description || "",
    location: eventLocationText(event),
  });
  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
}
