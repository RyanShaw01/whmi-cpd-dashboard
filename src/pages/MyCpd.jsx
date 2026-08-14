import { Link } from "react-router-dom";
import { ClipboardList, MessageSquareText, Lightbulb, Link2 } from "lucide-react";
import PersonalStatsRow from "../components/PersonalStatsRow";
import UpcomingEventsCards from "../components/UpcomingEventsCards";
import HappeningNowSection from "../components/HappeningNowSection";
import DueSoonRegisterBadge from "../components/DueSoonRegisterBadge";
import { fmtDate, hasEventEnded, daysUntil, formatCountdown, canJoinMeeting, splitFeaturedEvents, isViewerVisibleStatus } from "../lib/helpers";

export default function MyCpd({ user, staffDirectory, events, previousEvents, certificates, registrations, reflections, files, openEvent, onOpenRegister, onUnregister, onNavigatePage, onSuggestIdea }) {
  const staff = staffDirectory.find(s => s.id === user.staffId);
  const myPastEvents = staff?.attendedEventIds
    ? previousEvents.filter(ev => staff.attendedEventIds.includes(ev.id))
    : previousEvents;

  const myRegisteredEventIds = new Set((registrations || []).filter(r => r.userId === user.id).map(r => r.eventId));
  const myReflectedEventIds = new Set((reflections || []).filter(r => r.email?.toLowerCase() === user.email.toLowerCase()).map(r => r.eventId));
  const needsFeedback = events.filter(e => myRegisteredEventIds.has(e.id) && hasEventEnded(e.date, e.end) && !myReflectedEventIds.has(e.id));

  // Same plain-text "due soon" list admins see at the top of their Dashboard - events already
  // covered by HappeningNowSection (live, or ended within the last 24h) are excluded so they
  // aren't shown twice.
  const { featuredIds } = splitFeaturedEvents(events);
  const dueSoonEvents = events
    .filter(ev => !featuredIds.has(ev.id) && ev.status === "Registration Open")
    .map(ev => ({ ...ev, dayOffset: daysUntil(ev.date) }))
    .filter(ev => ev.dayOffset >= 0 && ev.dayOffset <= 14)
    .sort((a, b) => new Date(`${a.date}T${a.start}`) - new Date(`${b.date}T${b.start}`));

  return (
    <div className="whmi-fade-in p-6 max-w-[1000px] mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="disp text-[22px] font-extrabold">My CPD</h1>
          <p className="text-[13px]" style={{ color: "var(--text-dim)" }}>Your certificates, past CPD, and upcoming CPD.</p>
          {dueSoonEvents.length > 0 && (
            <ul className="mt-2 space-y-1 pl-5" style={{ listStyleType: "disc" }}>
              {dueSoonEvents.map(ev => {
                const registered = myRegisteredEventIds.has(ev.id);
                const joinable = ev.meetingUrl && registered && canJoinMeeting(ev.date, ev.start, ev.end);
                return (
                  <li key={ev.id} className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
                    <button onClick={() => openEvent(ev)} className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[13px] px-1 py-1 -mx-1 rounded-lg whmi-row-hover transition text-left">
                      <span className="font-medium" style={{ color: "var(--text)" }}>{ev.title}</span>
                      <span style={{ color: "var(--text-faint)" }}>·</span>
                      <span className="font-extrabold" style={{ color: "var(--accent-primary)" }}>{formatCountdown(ev.date, ev.start)}</span>
                    </button>
                    {onOpenRegister && (
                      <DueSoonRegisterBadge registered={registered} onClick={() => (registered ? openEvent(ev) : onOpenRegister(ev.id))} />
                    )}
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
        {onOpenRegister && (
          <button onClick={() => onOpenRegister()} className="whmi-btn-primary flex items-center gap-1.5"><ClipboardList size={15} />Register for a CPD Event</button>
        )}
      </div>

      <PersonalStatsRow
        user={user} certificates={certificates} events={events} registrations={registrations} reflections={reflections}
        onNavigateCertificates={onNavigatePage ? () => onNavigatePage("mycertificates") : undefined}
      />

      <HappeningNowSection
        events={events} files={files} registeredIds={myRegisteredEventIds} registrations={registrations}
        onOpenRegister={onOpenRegister} onUnregister={onUnregister} openEvent={openEvent}
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

      <UpcomingEventsCards
        title="Upcoming CPD" events={events.filter(e => isViewerVisibleStatus(e.status))} files={files} openEvent={openEvent}
        storageKey="whmi_mycpd_upcoming_view" mode="register" onOpenRegister={onOpenRegister} onUnregister={onUnregister} registeredIds={myRegisteredEventIds}
        emptyText="No upcoming CPD events open for registration."
      />
      {onSuggestIdea && (
        <div className="flex justify-center -mt-3">
          <button onClick={onSuggestIdea} className="whmi-btn-ghost flex items-center gap-1.5 text-[12.5px]">
            <Lightbulb size={14} />Suggest a CPD idea
          </button>
        </div>
      )}

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
    </div>
  );
}
