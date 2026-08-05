import { useState, useMemo } from "react";
import { Search, Layers, LayoutList } from "lucide-react";
import RegistrationsPanel from "./RegistrationsPanel";
import { fmtDate } from "../lib/helpers";

const SORT_OPTIONS = [
  { id: "date-desc", label: "Newest - Oldest" },
  { id: "date-asc", label: "Oldest - Newest" },
  { id: "alpha-asc", label: "Alphabetical (A - Z)" },
  { id: "alpha-desc", label: "Alphabetical (Z - A)" },
  { id: "event", label: "By Event" },
];

export default function AllRegistrationsPanel({
  events, registrations, canManage, onDelete, onUpdate, onUpdateAttendanceStatus,
  onMerge, onDismissPair, dismissedPairs,
}) {
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [separate, setSeparate] = useState(false);

  const eventById = useMemo(() => new Map(events.map(e => [e.id, e])), [events]);
  const eventRegs = useMemo(() => registrations.filter(r => eventById.has(r.eventId)), [registrations, eventById]);

  const query = q.trim().toLowerCase();
  const searched = query === ""
    ? eventRegs
    : eventRegs.filter(r => [r.name, r.email, r.profession, eventById.get(r.eventId)?.title].filter(Boolean).some(v => v.toLowerCase().includes(query)));

  const sorted = useMemo(() => {
    const list = [...searched];
    list.sort((a, b) => {
      if (sortBy === "alpha-asc") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "alpha-desc") return (b.name || "").localeCompare(a.name || "");
      if (sortBy === "event") {
        const et = (eventById.get(a.eventId)?.title || "").localeCompare(eventById.get(b.eventId)?.title || "");
        return et !== 0 ? et : (a.name || "").localeCompare(b.name || "");
      }
      if (sortBy === "date-asc") return (a.createdAt || "").localeCompare(b.createdAt || "");
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    });
    return list;
  }, [searched, sortBy, eventById]);

  const eventGroups = useMemo(() => {
    const groups = new Map();
    for (const ev of events) groups.set(ev.id, { event: ev, regs: [] });
    for (const r of searched) {
      if (!groups.has(r.eventId)) continue;
      groups.get(r.eventId).regs.push(r);
    }
    return [...groups.values()]
      .filter(g => g.regs.length > 0)
      .sort((a, b) => sortBy === "alpha-desc" ? b.event.title.localeCompare(a.event.title) : a.event.title.localeCompare(b.event.title));
  }, [events, searched, sortBy]);

  return (
    <div className="whmi-card p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="disp text-[15px] font-bold">All Current Registrations</h2>
          <p className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>{eventRegs.length} registration{eventRegs.length === 1 ? "" : "s"} across {events.length} open event{events.length === 1 ? "" : "s"}.</p>
        </div>
        <button
          onClick={() => setSeparate(s => !s)}
          className="whmi-btn-ghost flex items-center gap-1.5 text-[12px]"
          title={separate ? "Show as one combined list" : "Show as separate lists per event"}
        >
          {separate ? <LayoutList size={14} /> : <Layers size={14} />}
          {separate ? "Combine List" : "Separate by Event"}
        </button>
      </div>

      {!separate && (
        <div className="flex items-center gap-1.5 mb-3">
          <div className="whmi-input flex items-center gap-2 px-2.5 py-1.5 flex-1">
            <Search size={13} style={{ color: "var(--text-faint)" }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search all registrations..." className="bg-transparent outline-none w-full text-[12.5px]" style={{ color: "var(--text)" }} />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="whmi-input px-2 py-1.5 text-[11.5px] shrink-0">
            {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </div>
      )}

      {eventRegs.length === 0 ? (
        <div className="text-[12.5px] p-3 text-center" style={{ color: "var(--text-faint)" }}>No one is registered for an open event yet.</div>
      ) : separate ? (
        <div className="space-y-4">
          {eventGroups.map(({ event, regs }) => (
            <div key={event.id} className="whmi-card p-4" style={{ background: "var(--surface-2)" }}>
              <div className="mb-2">
                <div className="font-semibold text-[13px]">{event.title}</div>
                <div className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>{fmtDate(event.date)}</div>
              </div>
              <RegistrationsPanel
                event={event} registrations={regs} canManage={canManage}
                onDelete={onDelete} onUpdate={onUpdate} onUpdateAttendanceStatus={onUpdateAttendanceStatus}
                dismissedPairs={dismissedPairs} onMerge={onMerge} onDismissPair={onDismissPair}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.length === 0 && <div className="text-[12px] p-2" style={{ color: "var(--text-faint)" }}>No matches.</div>}
          {sorted.map(r => {
            const ev = eventById.get(r.eventId);
            return (
              <div key={r.id} className="p-2.5 rounded-lg" style={{ background: "var(--surface-2)" }}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-semibold truncate">{r.name}</div>
                    <div className="text-[11px] truncate" style={{ color: "var(--text-faint)" }}>
                      {r.email}{r.profession ? ` · ${r.profession}` : ""}{r.organisation ? ` · ${r.organisation}` : ""}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11.5px] font-semibold" style={{ color: "var(--accent-primary)" }}>{ev?.title || "—"}</div>
                    <div className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>{ev ? fmtDate(ev.date) : ""}</div>
                  </div>
                </div>
                {(r.dietary || r.accessibility) && (
                  <div className="mt-1.5 text-[10.5px] space-y-0.5" style={{ color: "var(--text-faint)" }}>
                    {r.dietary && <div>Dietary: {r.dietary}</div>}
                    {r.accessibility && <div>Accessibility: {r.accessibility}</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
