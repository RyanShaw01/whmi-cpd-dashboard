import { Video, Link2, Lightbulb } from "lucide-react";
import PersonalStatsRow from "../components/PersonalStatsRow";
import UpcomingEventsCards from "../components/UpcomingEventsCards";
import { fmtDate, daysUntil, formatCountdown, canJoinMeeting } from "../lib/helpers";

// Landing page for external accounts (non @wh.org.au). Shows events they've registered for
// (past + upcoming, recordings, certificates) plus a "Browse & Register" section covering
// every event admins have opted into external visibility (events.open_to_external) — unlike
// the internal viewer catalog, this is deliberately scoped to only externally-open events.
export default function ExternalDashboard({ user, events, previousEvents, certificates, registrations, reflections, files, openEvent, onOpenRegister, onUnregister, onNavigatePage, onSuggestIdea }) {
  const myRegisteredEventIds = new Set((registrations || []).filter(r => r.userId === user.id).map(r => r.eventId));
  const myUpcoming = events.filter(e => myRegisteredEventIds.has(e.id));
  const myPast = previousEvents.filter(e => myRegisteredEventIds.has(e.id));

  const externallyOpenEvents = events.filter(e => e.status === "Registration Open" && e.openToExternal !== false);
  const dueSoonEvents = externallyOpenEvents
    .map(ev => ({ ...ev, dayOffset: daysUntil(ev.date) }))
    .filter(ev => ev.dayOffset >= 0 && ev.dayOffset <= 14)
    .sort((a, b) => new Date(`${a.date}T${a.start}`) - new Date(`${b.date}T${b.start}`));
  const browsableEvents = externallyOpenEvents.filter(e => !myRegisteredEventIds.has(e.id));

  return (
    <div className="whmi-fade-in p-6 max-w-[1000px] mx-auto space-y-6">
      <div>
        <h1 className="disp text-[22px] font-extrabold">My CPD</h1>
        <p className="text-[13px]" style={{ color: "var(--text-dim)" }}>Events you've registered for, recordings, and certificates.</p>
        {dueSoonEvents.length > 0 && (
          <ul className="mt-2 space-y-1 pl-5" style={{ listStyleType: "disc" }}>
            {dueSoonEvents.map(ev => {
              const joinable = ev.meetingUrl && myRegisteredEventIds.has(ev.id) && canJoinMeeting(ev.date, ev.start, ev.end);
              return (
                <li key={ev.id} className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[13px]">
                  <button onClick={() => openEvent(ev)} className="font-medium underline-offset-2 hover:underline" style={{ color: "var(--text)" }}>{ev.title}</button>
                  <span style={{ color: "var(--text-faint)" }}>·</span>
                  <span className="font-extrabold" style={{ color: "var(--accent-primary)" }}>{formatCountdown(ev.date, ev.start)}</span>
                  {joinable && (
                    <a href={ev.meetingUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[12px] font-semibold" style={{ color: "var(--accent-secondary)" }}>
                      <Link2 size={12} />Join meeting here
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <PersonalStatsRow
        user={user} certificates={certificates} events={events} registrations={registrations} reflections={reflections}
        onNavigateCertificates={onNavigatePage ? () => onNavigatePage("mycertificates") : undefined}
      />

      <UpcomingEventsCards
        title="Upcoming" events={myUpcoming} files={files} openEvent={openEvent}
        storageKey="whmi_external_upcoming_view" mode="register" onOpenRegister={onOpenRegister} onUnregister={onUnregister}
        registeredIds={myRegisteredEventIds} viewerUserType={user.userType}
        emptyText="No upcoming events registered."
      />

      <UpcomingEventsCards
        title="Browse & Register" events={browsableEvents} files={files} openEvent={openEvent}
        storageKey="whmi_external_browse_view" mode="register" onOpenRegister={onOpenRegister}
        viewerUserType={user.userType}
        emptyText="No externally-open events available right now."
      />
      {onSuggestIdea && (
        <div className="flex justify-center -mt-3">
          <button onClick={onSuggestIdea} className="whmi-btn-ghost flex items-center gap-1.5 text-[12.5px]">
            <Lightbulb size={14} />Suggest a CPD idea
          </button>
        </div>
      )}

      <div className="whmi-card p-5">
        <h2 className="disp text-[15px] font-bold mb-3 flex items-center gap-1.5"><Video size={16} style={{ color: "var(--accent-secondary)" }} />Past CPD &amp; Recordings</h2>
        <div className="space-y-2">
          {myPast.map(ev => (
            <div key={ev.id} className="flex items-center justify-between gap-3 p-3 rounded-xl flex-wrap" style={{ border: "1px solid var(--border)" }}>
              <div className="min-w-0">
                <div className="font-semibold text-[13px] break-words">{ev.title}</div>
                <div className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>{fmtDate(ev.date)}</div>
              </div>
              {ev.recordingUrl ? (
                <a href={ev.recordingUrl} target="_blank" rel="noreferrer" className="whmi-btn-ghost !py-1.5 !px-3 text-[12px] flex items-center gap-1.5 shrink-0"><Video size={13} />Watch Recording</a>
              ) : (
                <span className="text-[11px] shrink-0" style={{ color: "var(--text-faint)" }}>No recording available</span>
              )}
            </div>
          ))}
          {myPast.length === 0 && <div className="text-[12.5px]" style={{ color: "var(--text-faint)" }}>No past CPD recorded yet.</div>}
        </div>
      </div>

      <div className="whmi-card p-4 text-[12px]" style={{ color: "var(--text-faint)" }}>
        Your account is marked as an external CPD participant. If this should be a Western Health staff account, contact the education team.
      </div>
    </div>
  );
}
