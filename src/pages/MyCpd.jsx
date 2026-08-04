import { Link } from "react-router-dom";
import { ChevronRight, Download, ClipboardList, MessageSquareText, Lightbulb } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import PersonalStatsRow from "../components/PersonalStatsRow";
import { fmtDate, hasEventEnded } from "../lib/helpers";

export default function MyCpd({ user, staffDirectory, events, previousEvents, certificates, registrations, reflections, openEvent, onOpenRegister, onNavigatePage, onSuggestIdea }) {
  const staff = staffDirectory.find(s => s.id === user.staffId);
  const myCerts = certificates.filter(c => c.staff === user.name);
  const myPastEvents = staff?.attendedEventIds
    ? previousEvents.filter(ev => staff.attendedEventIds.includes(ev.id))
    : previousEvents;

  const myRegisteredEventIds = new Set((registrations || []).filter(r => r.userId === user.id).map(r => r.eventId));
  const myReflectedEventIds = new Set((reflections || []).filter(r => r.email?.toLowerCase() === user.email.toLowerCase()).map(r => r.eventId));
  const needsFeedback = events.filter(e => myRegisteredEventIds.has(e.id) && hasEventEnded(e.date, e.end) && !myReflectedEventIds.has(e.id));

  return (
    <div className="whmi-fade-in p-6 max-w-[1000px] mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="disp text-[22px] font-extrabold">My CPD</h1>
          <p className="text-[13px]" style={{ color: "var(--text-dim)" }}>Your certificates, past CPD, and upcoming CPD.</p>
        </div>
        {onOpenRegister && (
          <button onClick={() => onOpenRegister()} className="whmi-btn-primary flex items-center gap-1.5"><ClipboardList size={15} />Register for a CPD Event</button>
        )}
      </div>

      <PersonalStatsRow
        user={user} certificates={certificates} events={events} registrations={registrations} reflections={reflections}
        onNavigateCertificates={onNavigatePage ? () => onNavigatePage("mycertificates") : undefined}
      />

      {needsFeedback.length > 0 && (
        <div className="whmi-card p-5" style={{ borderColor: "var(--accent-secondary)" }}>
          <h2 className="disp text-[15px] font-bold mb-1 flex items-center gap-1.5"><MessageSquareText size={16} style={{ color: "var(--accent-secondary)" }} />Needs Your Feedback</h2>
          <p className="text-[12px] mb-3" style={{ color: "var(--text-dim)" }}>These events have finished; leave your reflection to get your CPD certificate emailed to you.</p>
          <div className="space-y-2">
            {needsFeedback.map(ev => (
              <div key={ev.id} className="flex items-center justify-between gap-3 p-3 rounded-xl" style={{ border: "1px solid var(--border)" }}>
                <div className="min-w-0">
                  <div className="font-semibold text-[13px] break-words">{ev.title}</div>
                  <div className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>{fmtDate(ev.date)}</div>
                </div>
                <Link to={`/event/${ev.id}/reflect`} className="whmi-btn-primary !py-1.5 !px-3 text-[12px] shrink-0">Leave Feedback →</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="whmi-card p-5">
        <h2 className="disp text-[15px] font-bold mb-3">Upcoming CPD</h2>
        <div className="space-y-2">
          {events.filter(e => e.status === "Registration Open").map(ev => (
            <button key={ev.id} onClick={() => openEvent(ev)} className="whmi-row-hover w-full flex items-center justify-between gap-3 p-3 rounded-xl text-left transition" style={{ border: "1px solid var(--border)" }}>
              <div className="min-w-0">
                <div className="font-semibold text-[13px] break-words">{ev.title}</div>
                <div className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>{fmtDate(ev.date)} · {ev.start}</div>
              </div>
              <ChevronRight size={16} style={{ color: "var(--text-faint)" }} className="shrink-0" />
            </button>
          ))}
        </div>
        {onSuggestIdea && (
          <div className="flex justify-center pt-3">
            <button onClick={onSuggestIdea} className="whmi-btn-ghost flex items-center gap-1.5 text-[12.5px]">
              <Lightbulb size={14} />Suggest a CPD idea
            </button>
          </div>
        )}
      </div>

      <div className="whmi-card p-5">
        <h2 className="disp text-[15px] font-bold mb-3">Past CPD</h2>
        <div className="space-y-2">
          {myPastEvents.map(ev => (
            <div key={ev.id} className="flex items-center justify-between gap-3 p-3 rounded-xl" style={{ border: "1px solid var(--border)" }}>
              <div className="min-w-0">
                <div className="font-semibold text-[13px] break-words">{ev.title}</div>
                <div className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>{fmtDate(ev.date)}</div>
              </div>
              <span className="whmi-badge" style={{ background: "rgba(156,203,59,.15)", color: "#7CA82F" }}>★ {ev.feedback}</span>
            </div>
          ))}
          {myPastEvents.length === 0 && <div className="text-[12.5px]" style={{ color: "var(--text-faint)" }}>No past CPD recorded yet.</div>}
        </div>
      </div>

      <div className="whmi-card p-5">
        <h2 className="disp text-[15px] font-bold mb-3">My Certificates</h2>
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
