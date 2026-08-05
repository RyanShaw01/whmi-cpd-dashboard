import { useState, useEffect, useRef, useMemo } from "react";
import { Plus, Calendar, Clock, MapPin, UserCircle2, Link2, Trash2, ClipboardList, Lightbulb, LayoutGrid, List } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import ModeBadge from "../components/ModeBadge";
import { fmtDate, canJoinMeeting, fmtTimeRange12h, eventBannerUrl, eventLocationSuffix } from "../lib/helpers";

const SORT_OPTIONS = [
  { id: "date-asc", label: "Date (Closest - Furthest Away)" },
  { id: "date-desc", label: "Date (Furthest Away - Closest)" },
  { id: "name-asc", label: "Name (A - Z)" },
  { id: "name-desc", label: "Name (Z - A)" },
];

export default function UpcomingEvents({ events, openEvent, canManage, onRequestDelete, highlightId, onOpenRegister, onCreateEvent, files, onGoBrainstorm, onSuggestIdea }) {
  const [filter, setFilter] = useState("All");
  const [view, setView] = useState("grid");
  const [sortBy, setSortBy] = useState("date-asc");
  const statuses = ["All", "Registration Open", "Draft", "Awaiting Approval"];
  const filteredUnsorted = filter === "All" ? events : events.filter(e => e.status === filter);
  const filtered = useMemo(() => {
    const list = [...filteredUnsorted];
    list.sort((a, b) => {
      if (sortBy === "name-asc") return (a.title || "").localeCompare(b.title || "");
      if (sortBy === "name-desc") return (b.title || "").localeCompare(a.title || "");
      if (sortBy === "date-desc") return (b.date || "").localeCompare(a.date || "");
      return (a.date || "").localeCompare(b.date || "");
    });
    return list;
  }, [filteredUnsorted, sortBy]);
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

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 whmi-scroll overflow-x-auto pb-1">
          {statuses.map(s => (
            <button key={s} onClick={() => setFilter(s)} className="whmi-nav-btn" style={{ background: filter === s ? "var(--surface-2)" : "transparent", color: filter === s ? "var(--text)" : "var(--text-dim)", border: "1px solid " + (filter === s ? "var(--border)" : "transparent") }}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="whmi-input px-2.5 py-2 text-[12.5px]">
            {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <button onClick={() => setView("grid")} className="px-2.5 py-2 flex items-center gap-1.5 text-[12px] font-semibold" style={{ background: view === "grid" ? "var(--accent-primary)" : "transparent", color: view === "grid" ? "white" : "var(--text-dim)" }} title="Grid view">
              <LayoutGrid size={13} />
            </button>
            <button onClick={() => setView("list")} className="px-2.5 py-2 flex items-center gap-1.5 text-[12px] font-semibold" style={{ background: view === "list" ? "var(--accent-primary)" : "transparent", color: view === "list" ? "white" : "var(--text-dim)" }} title="List view">
              <List size={13} />
            </button>
          </div>
        </div>
      </div>

      {view === "list" ? (
        <div className="whmi-card overflow-x-auto whmi-scroll">
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Event", "Status", "Date", "Time", "Location", "Presenter", "Registered", ...(canManage && onRequestDelete ? [""] : [])].map((h, i) => (
                  <th key={h || `col-${i}`} className="text-left px-4 py-3 font-semibold text-[11.5px] uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(ev => (
                <tr
                  key={ev.id} ref={ev.id === highlightId ? highlightRef : null}
                  className="whmi-row-hover cursor-pointer" onClick={() => openEvent(ev)}
                  style={{ borderBottom: "1px solid var(--border)", outline: ev.id === highlightId ? "2px solid #D9534F" : "none", outlineOffset: -2 }}
                >
                  <td className="px-4 py-3 font-semibold break-words max-w-[260px]">{ev.title}<div className="text-[11px] font-normal mt-0.5" style={{ color: "var(--text-faint)" }}>{ev.topic}</div></td>
                  <td className="px-4 py-3"><StatusBadge status={ev.status} /></td>
                  <td className="px-4 py-3" style={{ color: "var(--text-dim)" }}>{fmtDate(ev.date)}</td>
                  <td className="px-4 py-3" style={{ color: "var(--text-dim)" }}>{fmtTimeRange12h(ev.start, ev.end)}</td>
                  <td className="px-4 py-3 break-words max-w-[180px]" style={{ color: "var(--text-dim)" }}>{ev.campus && <strong>{ev.campus}</strong>}{ev.campus && eventLocationSuffix(ev) ? " - " : ""}{eventLocationSuffix(ev)}</td>
                  <td className="px-4 py-3" style={{ color: "var(--text-dim)" }}>{ev.presenter}</td>
                  <td className="px-4 py-3">{ev.capacity == null ? ev.registered : `${ev.registered}/${ev.capacity}`}</td>
                  {canManage && onRequestDelete && (
                    <td className="px-4 py-3">
                      <button onClick={(e) => { e.stopPropagation(); onRequestDelete(ev); }} className="whmi-btn-ghost !p-1.5" style={{ color: "#D9534F" }} title="Delete event">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(ev => {
          const joinable = ev.meetingUrl && canJoinMeeting(ev.date, ev.start, ev.end);
          const needsAttention = canManage && (ev.status === "Draft" || ev.status === "Awaiting Approval");
          const bannerUrl = eventBannerUrl(files, ev.id);
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
                <div className="h-20 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden" style={!bannerUrl ? { background: "var(--accent-primary)" } : undefined}>
                  {bannerUrl ? (
                    <img
                      src={bannerUrl} alt="" className="w-full h-full object-cover"
                      style={{
                        objectPosition: `${ev.bannerFocalX ?? 50}% ${ev.bannerFocalY ?? 50}%`,
                        transform: `scale(${ev.bannerZoom ?? 1})`, transformOrigin: `${ev.bannerFocalX ?? 50}% ${ev.bannerFocalY ?? 50}%`,
                      }}
                    />
                  ) : (
                    <span className="text-white font-bold text-[13px] disp z-10 px-3 text-center break-words">{ev.topic}</span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <StatusBadge status={ev.status} />
                  <ModeBadge mode={ev.mode} />
                </div>
                <div className="font-bold text-[14px] leading-snug mb-1.5 break-words">{ev.title}</div>
                <div className="text-[12px] grid grid-cols-2 gap-x-3 gap-y-1.5" style={{ color: "var(--text-dim)" }}>
                  <div className="flex items-center gap-1.5"><Calendar size={12} className="shrink-0" /><span className="break-words">{fmtDate(ev.date)}</span></div>
                  <div className="flex items-center gap-1.5"><Clock size={12} className="shrink-0" /><span className="break-words">{fmtTimeRange12h(ev.start, ev.end)}</span></div>
                  <div className="flex items-start gap-1.5"><MapPin size={12} className="shrink-0 mt-0.5" /><span className="break-words">{ev.campus && <strong>{ev.campus}</strong>}{ev.campus && eventLocationSuffix(ev) ? " - " : ""}{eventLocationSuffix(ev)}</span></div>
                  <div className="flex items-start gap-1.5"><UserCircle2 size={12} className="shrink-0 mt-0.5" /><span className="break-words">{ev.presenter}</span></div>
                </div>
              </button>
              <div className="mt-3">
                {canManage ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); openEvent(ev, "registrations"); }}
                    className="w-full text-left rounded-lg -mx-1 px-1 py-0.5 whmi-row-hover transition"
                    title="View registrations"
                  >
                    <div className="flex justify-between text-[11px] mb-1" style={{ color: "var(--text-faint)" }}>
                      <span>{ev.capacity == null ? `Registered: ${ev.registered}` : `Registered ${ev.registered}/${ev.capacity}`}{ev.waitlist ? ` · ${ev.waitlist} waitlisted` : ""}</span>
                      {ev.capacity != null && <span>{Math.round((ev.registered / ev.capacity) * 100)}%</span>}
                    </div>
                    {ev.capacity != null && (
                      <div className="h-1.5 rounded-full" style={{ background: "var(--surface-2)" }}>
                        <div className="h-1.5 rounded-full whmi-accent-bar" style={{ width: `${Math.min(100, (ev.registered / ev.capacity) * 100)}%` }} />
                      </div>
                    )}
                  </button>
                ) : (
                  <div>
                    <div className="flex justify-between text-[11px] mb-1" style={{ color: "var(--text-faint)" }}>
                      <span>{ev.capacity == null ? `Registered: ${ev.registered}` : `Registered ${ev.registered}/${ev.capacity}`}{ev.waitlist ? ` · ${ev.waitlist} waitlisted` : ""}</span>
                      {ev.capacity != null && <span>{Math.round((ev.registered / ev.capacity) * 100)}%</span>}
                    </div>
                    {ev.capacity != null && (
                      <div className="h-1.5 rounded-full" style={{ background: "var(--surface-2)" }}>
                        <div className="h-1.5 rounded-full whmi-accent-bar" style={{ width: `${Math.min(100, (ev.registered / ev.capacity) * 100)}%` }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 mt-2">
                {joinable ? (
                  <a href={ev.meetingUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: "var(--accent-secondary)" }}>
                    <Link2 size={12} />Join meeting here
                  </a>
                ) : <span />}
                {onOpenRegister && ev.status === "Registration Open" && (
                  <button onClick={(e) => { e.stopPropagation(); onOpenRegister(ev.id); }} className="text-[12px] font-semibold px-1.5 py-0.5 -mx-1.5 rounded-lg whmi-row-hover transition flex items-center gap-1" style={{ color: "var(--accent-primary)" }}>
                    Register <span className="transition-transform">→</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {(onSuggestIdea || (canManage && onGoBrainstorm)) && (
        <div className="flex justify-center items-center gap-2 pt-2 flex-wrap">
          {onSuggestIdea && (
            <button onClick={onSuggestIdea} className="whmi-btn-ghost flex items-center gap-1.5 text-[12.5px]">
              <Lightbulb size={14} />Suggest a CPD idea
            </button>
          )}
          {canManage && onGoBrainstorm && (
            <button onClick={onGoBrainstorm} className="whmi-btn-ghost flex items-center gap-1.5 text-[12.5px]">
              <Lightbulb size={14} />Go to CPD Brainstorming →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
