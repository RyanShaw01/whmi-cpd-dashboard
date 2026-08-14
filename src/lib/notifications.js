import { fmtDate, isViewerVisibleStatus } from "./helpers";

// Notification groups are derived fresh from live app state every render; nothing is
// "created"; a group simply stops existing once the underlying condition resolves
// (event un-drafted, cert approved, registration acknowledged, etc).
export function buildNotificationGroups({ events, certificates, registrations, acknowledged }) {
  const groups = [];

  const draftEvents = events.filter(e => e.status === "Draft" && !acknowledged.has(`event-draft-${e.id}`));
  if (draftEvents.length) {
    groups.push({
      id: "event-draft",
      label: `${draftEvents.length} draft event${draftEvents.length === 1 ? "" : "s"} need${draftEvents.length === 1 ? "s" : ""} more detail`,
      items: draftEvents,
      ackKeys: draftEvents.map(e => `event-draft-${e.id}`),
      page: "upcoming",
    });
  }

  const pendingEvents = events.filter(e => e.status === "Awaiting Approval" && !acknowledged.has(`event-approval-${e.id}`));
  if (pendingEvents.length) {
    groups.push({
      id: "event-approval",
      label: `${pendingEvents.length} event${pendingEvents.length === 1 ? "" : "s"} awaiting approval`,
      items: pendingEvents,
      ackKeys: pendingEvents.map(e => `event-approval-${e.id}`),
      page: "upcoming",
    });
  }

  const pendingCerts = certificates.filter(c => c.status === "Awaiting Approval" && !acknowledged.has(`cert-${c.id}`));
  if (pendingCerts.length) {
    groups.push({
      id: "cert-approval",
      label: `${pendingCerts.length} CPD certificate${pendingCerts.length === 1 ? "" : "s"} awaiting approval`,
      items: pendingCerts,
      ackKeys: pendingCerts.map(c => `cert-${c.id}`),
      page: "certificates",
    });
  }

  const newRegs = registrations.filter(r => !acknowledged.has(`reg-${r.id}`));
  if (newRegs.length) {
    groups.push({
      id: "registration",
      label: `${newRegs.length} new event registration${newRegs.length === 1 ? "" : "s"}`,
      items: newRegs,
      ackKeys: newRegs.map(r => `reg-${r.id}`),
      page: "upcoming",
    });
  }

  return groups;
}

// Same idea, scoped to what a viewer (staff or external) actually cares about: their own
// outstanding reflections, and newly-opened events they're eligible to see.
export function buildViewerNotificationGroups({ session, visibleEvents, previousEvents, registrations, reflections, acknowledged }) {
  if (!session) return [];
  const groups = [];
  const myEmail = (session.email || "").toLowerCase();

  const reflectedEventIds = new Set(
    (reflections || []).filter(r => (r.email || "").toLowerCase() === myEmail).map(r => r.eventId)
  );
  const pastEventIds = new Set((previousEvents || []).map(e => e.id));
  const outstanding = (registrations || []).filter(r =>
    r.userId === session.id && pastEventIds.has(r.eventId)
    && (r.attendanceStatus === "Registered" || r.attendanceStatus === "Attended")
    && !reflectedEventIds.has(r.eventId)
    && !acknowledged.has(`viewer-reflection-${r.eventId}`)
  );
  if (outstanding.length) {
    groups.push({
      id: "viewer-reflection-pending",
      label: `${outstanding.length} reflection${outstanding.length === 1 ? "" : "s"} outstanding`,
      items: outstanding,
      ackKeys: outstanding.map(r => `viewer-reflection-${r.eventId}`),
      page: "reflection",
    });
  }

  (visibleEvents || [])
    .filter(e => isViewerVisibleStatus(e.status) && !acknowledged.has(`viewer-event-${e.id}`))
    .forEach(e => {
      groups.push({
        id: `viewer-event-${e.id}`,
        label: `New event: ${e.title} — ${fmtDate(e.date)}`,
        items: [e],
        ackKeys: [`viewer-event-${e.id}`],
        page: "upcoming",
      });
    });

  return groups;
}
