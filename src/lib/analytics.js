/*
 * Shared, pure aggregation functions consumed by both Dashboard.jsx and Reports.jsx so
 * the two pages never compute the same stat two different ways. Every function takes
 * already-fetched arrays (events/previousEvents/registrations/reflections/certificates)
 * and returns plain numbers/arrays, no side effects, no fetching.
 */
import { eventCpdHours, hasEventEnded } from "./helpers";

const ACTIVE_STATUSES = new Set(["Registered", "Attended"]);

export function eventAttendedCount(eventId, registrations) {
  return registrations.filter(r => r.eventId === eventId && r.attendanceStatus === "Attended").length;
}

export function eventAvgRating(eventId, reflections) {
  const ratings = reflections.filter(r => r.eventId === eventId && r.rating != null).map(r => r.rating);
  if (ratings.length === 0) return null;
  return Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
}

function lastNMonths(n) {
  const now = new Date();
  const months = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString("en-AU", { month: "short" }) });
  }
  return months;
}
function inMonth(dateStr, year, month) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.getFullYear() === year && d.getMonth() === month;
}

export function cpdHoursDelivered(previousEvents, { year = new Date().getFullYear() } = {}) {
  return previousEvents
    .filter(ev => new Date(`${ev.date}T00:00:00`).getFullYear() === year)
    .reduce((sum, ev) => sum + (eventCpdHours(ev.start, ev.end) || 0), 0);
}

export function monthlyHours(previousEvents, months = 6) {
  return lastNMonths(months).map(({ year, month, label }) => ({
    month: label,
    hours: Math.round(previousEvents.filter(ev => inMonth(ev.date, year, month)).reduce((sum, ev) => sum + (eventCpdHours(ev.start, ev.end) || 0), 0) * 10) / 10,
  }));
}

export function attendanceTrend(previousEvents, registrations, months = 6) {
  return lastNMonths(months).map(({ year, month, label }) => {
    const eventIds = new Set(previousEvents.filter(ev => inMonth(ev.date, year, month)).map(ev => ev.id));
    const regs = registrations.filter(r => eventIds.has(r.eventId));
    const attended = regs.filter(r => r.attendanceStatus === "Attended").length;
    const noShow = regs.filter(r => r.attendanceStatus === "No Show").length;
    const denom = attended + noShow;
    return { month: label, rate: denom === 0 ? null : Math.round((attended / denom) * 100) };
  });
}

export function topicPopularity(previousEvents, tags, { year = new Date().getFullYear() } = {}) {
  const inYear = previousEvents.filter(ev => new Date(`${ev.date}T00:00:00`).getFullYear() === year);
  return tags.map(t => ({ topic: t.name, events: inYear.filter(ev => ev.topic === t.name).length }));
}

export function modeSplit(previousEvents) {
  const online = previousEvents.filter(ev => ev.mode === "Online").length;
  const inPerson = previousEvents.length - online;
  const total = previousEvents.length || 1;
  return [
    { name: "In-person", value: Math.round((inPerson / total) * 100) },
    { name: "Online", value: Math.round((online / total) * 100) },
  ];
}

// Registrants (not cancelled/waitlisted) for events that have already ended, with no
// reflection matching their email yet; mirrors the per-user "needs feedback" check in
// MyCpd.jsx, but summed globally for the admin-facing dashboard stat.
export function outstandingReflections(events, registrations, reflections) {
  const endedEventIds = new Set(events.filter(ev => hasEventEnded(ev.date, ev.end)).map(ev => ev.id));
  const reflectedKeys = new Set(reflections.map(r => `${r.eventId}::${(r.email || "").toLowerCase()}`));
  const outstanding = registrations.filter(r =>
    endedEventIds.has(r.eventId) &&
    ACTIVE_STATUSES.has(r.attendanceStatus) &&
    !reflectedKeys.has(`${r.eventId}::${(r.email || "").toLowerCase()}`)
  );
  return { count: outstanding.length, eventCount: new Set(outstanding.map(r => r.eventId)).size };
}

// Average feedback rating per month (by reflection submission date), for the Reports
// month-to-month feedback trend chart. Mirrors monthlyHours/attendanceTrend's shape.
export function feedbackTrend(reflections, months = 12) {
  return lastNMonths(months).map(({ year, month, label }) => {
    const ratings = reflections.filter(r => r.rating != null && r.submittedAt && inMonth(r.submittedAt.slice(0, 10), year, month)).map(r => r.rating);
    return { month: label, rating: ratings.length === 0 ? null : Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 };
  });
}

// Average rating across the most recent `limit` events that have any reflections
// (event-level averages first, then averaged across events; not a flat reflection average).
export function avgFeedback(reflections, { limit = 6 } = {}) {
  const byEvent = new Map();
  reflections.forEach(r => {
    if (r.rating == null) return;
    if (!byEvent.has(r.eventId)) byEvent.set(r.eventId, { sum: 0, count: 0, latest: r.submittedAt });
    const e = byEvent.get(r.eventId);
    e.sum += r.rating; e.count += 1;
    if (r.submittedAt > e.latest) e.latest = r.submittedAt;
  });
  const events = [...byEvent.values()].sort((a, b) => new Date(b.latest) - new Date(a.latest)).slice(0, limit);
  if (events.length === 0) return null;
  const avg = events.reduce((sum, e) => sum + e.sum / e.count, 0) / events.length;
  return Math.round(avg * 10) / 10;
}
