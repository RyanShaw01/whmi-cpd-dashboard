import { useState, useMemo } from "react";
import { Table2, CalendarDays, Plus, Pencil, Trash2, CheckSquare, Square } from "lucide-react";
import YearCalendar from "../components/YearCalendar";
import { fmtDate, fmtTimeRange12h } from "../lib/helpers";

const SORT_OPTIONS = [
  { id: "date-desc", label: "Date (Newest - Oldest)" },
  { id: "date-asc", label: "Date (Oldest - Newest)" },
  { id: "name-asc", label: "Name (A - Z)" },
  { id: "name-desc", label: "Name (Z - A)" },
];

export default function PreviousEvents({ previousEvents, onOpenArchive, canManage, onCreatePreviousEvent, onRequestDelete, onRequestDeleteMultiple }) {
  const years = [...new Set(previousEvents.map(ev => new Date(`${ev.date}T00:00:00`).getFullYear()))].sort((a, b) => b - a);
  const currentYear = new Date().getFullYear();
  const [view, setView] = useState("table");
  const [year, setYear] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const calendarYear = year === "all" ? (years.includes(currentYear) ? currentYear : (years[0] || currentYear)) : year;
  const toggleSelected = (id) => setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const exitSelecting = () => { setSelecting(false); setSelectedIds(new Set()); };

  const filteredEvents = useMemo(() => {
    const list = year === "all" ? previousEvents : previousEvents.filter(ev => new Date(`${ev.date}T00:00:00`).getFullYear() === year);
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sortBy === "name-asc") return (a.title || "").localeCompare(b.title || "");
      if (sortBy === "name-desc") return (b.title || "").localeCompare(a.title || "");
      if (sortBy === "date-asc") return (a.date || "").localeCompare(b.date || "");
      return (b.date || "").localeCompare(a.date || "");
    });
    return sorted;
  }, [previousEvents, year, sortBy]);

  return (
    <div className="whmi-fade-in p-6 max-w-[1400px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="disp text-[22px] font-extrabold">Previous Events</h1>
          <p className="text-[13px]" style={{ color: "var(--text-dim)" }}>Archive of completed WHMI CPD activities.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {years.length > 0 && (
            <select
              value={view === "calendar" ? calendarYear : year}
              onChange={e => setYear(view === "table" && e.target.value === "all" ? "all" : Number(e.target.value))}
              className="whmi-input px-2.5 py-2 text-[12.5px]"
            >
              {view === "table" && <option value="all">All Years</option>}
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
          {/* Kept mounted (just hidden) in calendar view rather than unrendered, so the
              Table/Calendar toggle and Add Past Event button to its right don't shift position
              when switching views. */}
          <div className="flex items-center gap-1.5" style={{ visibility: view === "table" ? "visible" : "hidden" }}>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="whmi-input px-2.5 py-2 text-[12.5px]" tabIndex={view === "table" ? 0 : -1}>
              {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <button onClick={() => setView("table")} className="px-2.5 py-2 flex items-center gap-1.5 text-[12px] font-semibold" style={{ background: view === "table" ? "var(--accent-primary)" : "transparent", color: view === "table" ? "white" : "var(--text-dim)" }}>
              <Table2 size={13} />Table
            </button>
            <button onClick={() => setView("calendar")} className="px-2.5 py-2 flex items-center gap-1.5 text-[12px] font-semibold" style={{ background: view === "calendar" ? "var(--accent-primary)" : "transparent", color: view === "calendar" ? "white" : "var(--text-dim)" }}>
              <CalendarDays size={13} />Calendar
            </button>
          </div>
          {canManage && onRequestDeleteMultiple && (
            <div style={{ visibility: view === "table" ? "visible" : "hidden" }} className="flex items-center gap-2">
              {selecting ? (
                <>
                  <button
                    onClick={() => { if (selectedIds.size) onRequestDeleteMultiple(previousEvents.filter(ev => selectedIds.has(ev.id))); exitSelecting(); }}
                    disabled={selectedIds.size === 0}
                    className="whmi-btn-ghost flex items-center gap-1.5"
                    style={{ color: "#D9534F", opacity: selectedIds.size === 0 ? 0.5 : 1 }}
                  >
                    <Trash2 size={14} />Delete {selectedIds.size > 0 ? `(${selectedIds.size})` : "Selected"}
                  </button>
                  <button onClick={exitSelecting} className="whmi-btn-ghost">Cancel</button>
                </>
              ) : (
                <button onClick={() => setSelecting(true)} className="whmi-btn-ghost flex items-center gap-1.5"><CheckSquare size={14} />Select</button>
              )}
            </div>
          )}
          {canManage && onCreatePreviousEvent && (
            <button onClick={onCreatePreviousEvent} className="whmi-btn-primary flex items-center gap-1.5"><Plus size={15} />Add Past Event</button>
          )}
        </div>
      </div>

      {view === "table" ? (
        <div className="whmi-card overflow-x-auto whmi-scroll">
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {[...(selecting ? [""] : []), "Event", "Date", "Time", "Location", "Presenter", "Attendance", "Feedback", ...(canManage ? [""] : [])].map((h, i) => (
                  <th key={h || `col-${i}`} className="text-left px-4 py-3 font-semibold text-[11.5px] uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map(ev => (
                <tr
                  key={ev.id} className="whmi-row-hover cursor-pointer" style={{ borderBottom: "1px solid var(--border)" }}
                  onClick={() => selecting ? toggleSelected(ev.id) : onOpenArchive(ev)}
                >
                  {selecting && (
                    <td className="px-4 py-3" onClick={e => { e.stopPropagation(); toggleSelected(ev.id); }}>
                      {selectedIds.has(ev.id) ? <CheckSquare size={16} style={{ color: "var(--accent-primary)" }} /> : <Square size={16} style={{ color: "var(--text-faint)" }} />}
                    </td>
                  )}
                  <td className="px-4 py-3 font-semibold break-words max-w-[260px]">{ev.title}<div className="text-[11px] font-normal mt-0.5" style={{ color: "var(--text-faint)" }}>{ev.topic}</div></td>
                  <td className="px-4 py-3" style={{ color: "var(--text-dim)" }}>{fmtDate(ev.date)}</td>
                  <td className="px-4 py-3" style={{ color: "var(--text-dim)" }}>{fmtTimeRange12h(ev.start, ev.end)}</td>
                  <td className="px-4 py-3 break-words max-w-[180px]" style={{ color: "var(--text-dim)" }}>{ev.location}</td>
                  <td className="px-4 py-3" style={{ color: "var(--text-dim)" }}>{ev.presenter}</td>
                  <td className="px-4 py-3">{ev.attendance}/{ev.capacity}</td>
                  <td className="px-4 py-3">
                    <button onClick={(e) => { e.stopPropagation(); onOpenArchive(ev, "feedback"); }} className="whmi-badge" style={{ background: "rgba(156,203,59,.15)", color: "#7CA82F" }} title="View feedback">★ {ev.feedback}</button>
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <button onClick={(e) => { e.stopPropagation(); onOpenArchive(ev, null, true); }} className="whmi-btn-ghost !p-1.5" title="Edit event (delete is available inside)">
                        <Pencil size={13} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        years.length === 0 ? (
          <div className="whmi-card p-6 text-center text-[12.5px]" style={{ color: "var(--text-faint)" }}>No completed events yet.</div>
        ) : (
          <YearCalendar year={calendarYear} events={previousEvents} onSelectEvent={onOpenArchive} />
        )
      )}
    </div>
  );
}
