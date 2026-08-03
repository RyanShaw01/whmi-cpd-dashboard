import { useState, useEffect, useRef } from "react";
import { Plus, Calendar, MapPin, UserCircle2, Link2, Trash2, ClipboardList } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import ModeBadge from "../components/ModeBadge";
import { fmtDate, canJoinMeeting, fmtTimeRange12h } from "../lib/helpers";

export default function UpcomingEvents({ events, openEvent, canManage, onRequestDelete, highlightId, onOpenRegister, onCreateEvent }) {
  const [filter, setFilter] = useState("All");
  const statuses = ["All", "Registration Open", "Draft", "Awaiting Approval"];
  const filtered = filter === "All" ? events : events.filter(e => e.status === filter);
  const highlightRef = useRef(null);

  useEffect(() => {
    if (!highlightId) return;
    const ev = events.find(e => e.id === highlightId);
    if (ev) setFilter(ev.status);
  }, [highlightId, events]);

  useEffect(() => {
    if (highlightId && highlightRef.current) highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightId, filter]);

  return (
    <div className="whmi-fade-in p-6 max-w-[1400px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="disp text-[22px] font-extrabold">Upcoming Events</h1>
          <p className="text-[13px]" style={{ color: "var(--text-dim)" }}>Only "Registration Open" events are visible to staff.</p>
        </div>
        <div className="flex gap-2">
          {onOpenRegister && (
            <button onClick={() => onOpenRegister()} className="whmi-btn-ghost flex items-center gap-1.5"><ClipboardList size={15} />Register for a CPD Event</button>
          )}
          {canManage && <button onClick={onCreateEvent} className="whmi-btn-primary flex items-center gap-1.5"><Plus size={15} />New Event</button>}
        </div>
      </div>

      <div className="flex items-center gap-2 whmi-scroll overflow-x-auto pb-1">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)} className="whmi-nav-btn" style={{ background: filter === s ? "var(--surface-2)" : "transparent", color: filter === s ? "var(--text)" : "var(--text-dim)", border: "1px solid " + (filter === s ? "var(--border)" : "transparent") }}>
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(ev => {
          const joinable = ev.meetingUrl && canJoinMeeting(ev.date, ev.start, ev.end);
          const needsAttention = canManage && (ev.status === "Draft" || ev.status === "Awaiting Approval");
          return (
            <div
              key={ev.id}
              ref={ev.id === highlightId ? highlightRef : null}
              className="whmi-card whmi-event-card p-4 text-left transition relative"
              style={{ outline: ev.id === highlightId ? "2px solid #D9534F" : "none", outlineOffset: 2 }}
            >
              {needsAttention && (
                <button
                  onClick={(e) => { e.stopPropagation(); openEvent(ev); }}
                  className="absolute top-3 left-3 z-10 w-2.5 h-2.5 rounded-full"
                  style={{ background: "#D9534F" }}
                  title="Needs attention"
                />
              )}
              {canManage && onRequestDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRequestDelete(ev); }}
                  className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,.35)" }}
                  title="Delete event"
                >
                  <Trash2 size={13} color="white" />
                </button>
              )}
              <button onClick={() => openEvent(ev)} className="w-full text-left whmi-row-hover transition rounded-lg -m-1 p-1">
                <div className="h-20 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden" style={{ background: "var(--accent-primary)" }}>
                  <span className="text-white font-bold text-[13px] disp z-10 px-3 text-center break-words">{ev.topic}</span>
                </div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <StatusBadge status={ev.status} />
                  <ModeBadge mode={ev.mode} />
                </div>
                <div className="font-bold text-[14px] leading-snug mb-1.5 break-words">{ev.title}</div>
                <div className="text-[12px] space-y-1" style={{ color: "var(--text-dim)" }}>
                  <div className="flex items-center gap-1.5"><Calendar size={12} className="shrink-0" /><span className="break-words">{fmtDate(ev.date)} · {fmtTimeRange12h(ev.start, ev.end)}</span></div>
                  <div className="flex items-center gap-1.5"><MapPin size={12} className="shrink-0" /><span className="break-words">{ev.location}</span></div>
                  <div className="flex items-center gap-1.5"><UserCircle2 size={12} className="shrink-0" /><span className="break-words">{ev.presenter}</span></div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] mb-1" style={{ color: "var(--text-faint)" }}>
                    <span>{ev.registered} registered{ev.waitlist ? ` · ${ev.waitlist} waitlisted` : ""}</span>
                    <span>{ev.capacity == null ? "Unlimited" : `${Math.round((ev.registered / ev.capacity) * 100)}%`}</span>
                  </div>
                  {ev.capacity != null && (
                    <div className="h-1.5 rounded-full" style={{ background: "var(--surface-2)" }}>
                      <div className="h-1.5 rounded-full whmi-accent-bar" style={{ width: `${Math.min(100, (ev.registered / ev.capacity) * 100)}%` }} />
                    </div>
                  )}
                </div>
              </button>
              <div className="flex items-center justify-between gap-2 mt-2">
                {joinable ? (
                  <a href={ev.meetingUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: "var(--accent-secondary)" }}>
                    <Link2 size={12} />Join meeting here
                  </a>
                ) : <span />}
                {onOpenRegister && ev.status === "Registration Open" && (
                  <button onClick={(e) => { e.stopPropagation(); onOpenRegister(ev.id); }} className="text-[12px] font-semibold" style={{ color: "var(--accent-primary)" }}>
                    Register →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
