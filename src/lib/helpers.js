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

function ordinal(n) {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
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
 * Countdown to an event's start time. Events under a week away show the exact
 * day, date, and start time ("on Thursday 12th at 4pm"); further out shows a
 * whole-day count.
 */
export function formatCountdown(dateStr, startTime) {
  const target = new Date(`${dateStr}T${startTime}:00`);
  const now = new Date();
  const diffMs = target - now;

  if (diffMs <= 0) return "Now";

  if (diffMs < 7 * 86400000) {
    const weekday = target.toLocaleDateString("en-AU", { weekday: "long" });
    return `on ${weekday} ${ordinal(target.getDate())} at ${fmtTime12h(startTime)}`;
  }

  const days = Math.round(diffMs / 86400000);
  return `in ${days} days`;
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

/* Whether an event has finished, independent of its admin-set status;
 * "Leave Feedback" eligibility follows wall-clock time, not manual lifecycle state. */
export function hasEventEnded(dateStr, endTime) {
  if (!dateStr || !endTime) return false;
  const end = new Date(`${dateStr}T${endTime}:00`);
  return new Date() > end;
}

/* Exact CPD hours from event start/end, e.g. "09:00"-"12:30" -> 3.5. */
export function eventCpdHours(start, end) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if ([sh, sm, eh, em].some(Number.isNaN)) return null;
  const minutes = (eh * 60 + em) - (sh * 60 + sm);
  if (minutes <= 0) return null;
  return Math.round((minutes / 60) * 100) / 100;
}
