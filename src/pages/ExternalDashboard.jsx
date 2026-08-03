import { Clock, Award, ChevronRight, Download, Video, ClipboardList, Link2 } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import PersonalStatsRow from "../components/PersonalStatsRow";
import { fmtDate, daysUntil, formatCountdown, canJoinMeeting, fmtTime12h } from "../lib/helpers";

// Landing page for external accounts (non @wh.org.au). Shows events they've registered for
// (past + upcoming, recordings, certificates) plus a "Browse & Register" section covering
// every event admins have opted into external visibility (events.open_to_external) — unlike
// the internal viewer catalog, this is deliberately scoped to only externally-open events.
export default function ExternalDashboard({ user, events, previousEvents, certificates, registrations, reflections, openEvent, onOpenRegister, onNavigatePage }) {
  const myRegisteredEventIds = new Set((registrations || []).filter(r => r.userId === user.id).map(r => r.eventId));
  const myUpcoming = events.filter(e => myRegisteredEventIds.has(e.id));
  const myPast = previousEvents.filter(e => myRegisteredEventIds.has(e.id));
  const myCerts = certificates.filter(c => c.recipientEmail?.toLowerCase() === user.email.toLowerCase() || c.staff === user.name);

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

      <div className="whmi-card p-4 text-[12px]" style={{ color: "var(--text-faint)" }}>
        Your account is marked as an external CPD participant. If this should be a Western Health staff account, contact the education team.
      </div>

      <PersonalStatsRow
        user={user} certificates={certificates} events={events} registrations={registrations} reflections={reflections}
        onNavigateCertificates={onNavigatePage ? () => onNavigatePage("mycertificates") : undefined}
      />

      <div className="whmi-card p-5">
        <h2 className="disp text-[15px] font-bold mb-3 flex items-center gap-1.5"><Clock size={16} style={{ color: "var(--accent-primary)" }} />Upcoming</h2>
        <div className="space-y-2">
          {myUpcoming.map(ev => (
            <button key={ev.id} onClick={() => openEvent(ev)} className="whmi-row-hover w-full flex items-center justify-between gap-3 p-3 rounded-xl text-left transition" style={{ border: "1px solid var(--border)" }}>
              <div className="min-w-0">
                <div className="font-semibold text-[13px] break-words">{ev.title}</div>
                <div className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>{fmtDate(ev.date)} · {fmtTime12h(ev.start)}</div>
              </div>
              <ChevronRight size={16} style={{ color: "var(--text-faint)" }} className="shrink-0" />
            </button>
          ))}
          {myUpcoming.length === 0 && <div className="text-[12.5px]" style={{ color: "var(--text-faint)" }}>No upcoming events registered.</div>}
        </div>
      </div>

      <div className="whmi-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="disp text-[15px] font-bold flex items-center gap-1.5"><ClipboardList size={16} style={{ color: "var(--accent-primary)" }} />Browse &amp; Register</h2>
          <span className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>{browsableEvents.length} available</span>
        </div>
        <div className="space-y-2">
          {browsableEvents.map(ev => (
            <div key={ev.id} className="flex items-center justify-between gap-3 p-3 rounded-xl flex-wrap" style={{ border: "1px solid var(--border)" }}>
              <button onClick={() => openEvent(ev)} className="min-w-0 text-left">
                <div className="font-semibold text-[13px] break-words">{ev.title}</div>
                <div className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>{fmtDate(ev.date)} · {fmtTime12h(ev.start)}</div>
              </button>
              <button onClick={() => onOpenRegister(ev.id)} className="whmi-btn-primary !py-1.5 !px-3 text-[12px] shrink-0">Register</button>
            </div>
          ))}
          {browsableEvents.length === 0 && <div className="text-[12.5px]" style={{ color: "var(--text-faint)" }}>No externally-open events available right now.</div>}
        </div>
      </div>

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

      <div className="whmi-card p-5">
        <h2 className="disp text-[15px] font-bold mb-3 flex items-center gap-1.5"><Award size={16} style={{ color: "var(--accent-success)" }} />My Certificates</h2>
        {myCerts.length === 0 && <div className="text-[12.5px]" style={{ color: "var(--text-faint)" }}>No certificates yet.</div>}
        <div className="space-y-2">
          {myCerts.map(c => (
            <div key={c.id} className="flex items-center justify-between gap-3 p-3 rounded-xl" style={{ border: "1px solid var(--border)" }}>
              <div className="min-w-0">
                <div className="font-semibold text-[13px] break-words">{c.event}</div>
                <div className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>{fmtDate(c.date)}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={c.status} />
                {c.status === "Sent" && c.pdfUrl && (
                  <a href={c.pdfUrl} target="_blank" rel="noreferrer" className="whmi-btn-ghost !p-2" title="Download PDF"><Download size={14} /></a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
