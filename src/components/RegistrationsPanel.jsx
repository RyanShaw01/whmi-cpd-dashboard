import { useState, useMemo } from "react";
import { Search, Trash2 } from "lucide-react";
import StatusBadge from "./StatusBadge";
import DuplicateWarnings from "./DuplicateWarnings";
import { findDuplicates } from "../lib/duplicates";

const ATTENDANCE_STATUSES = ["Registered", "Attended", "No Show", "Cancelled", "Waitlisted"];

const SORT_OPTIONS = [
  { id: "date-desc", label: "Newest - Oldest" },
  { id: "date-asc", label: "Oldest - Newest" },
  { id: "alpha-asc", label: "Alphabetical (A - Z)" },
  { id: "alpha-desc", label: "Alphabetical (Z - A)" },
];

export default function RegistrationsPanel({ event, registrations, canManage, dismissedPairs, onDelete, onUpdate, onUpdateAttendanceStatus, onMerge, onDismissPair, highlightIds }) {
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const query = q.trim().toLowerCase();
  const searched = query === ""
    ? registrations
    : registrations.filter(r => [r.name, r.email, r.profession].filter(Boolean).some(v => v.toLowerCase().includes(query)));
  const filtered = useMemo(() => {
    const list = [...searched];
    list.sort((a, b) => {
      if (sortBy === "alpha-asc") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "alpha-desc") return (b.name || "").localeCompare(a.name || "");
      if (sortBy === "date-asc") return (a.createdAt || "").localeCompare(b.createdAt || "");
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    });
    return list;
  }, [searched, sortBy]);

  const pairs = canManage ? findDuplicates(registrations, dismissedPairs || new Set()) : [];

  const total = registrations.length;
  const externalCount = registrations.filter(r => r.isExternal).length;
  const staffCount = total - externalCount;

  if (registrations.length === 0) {
    return <div className="text-[12.5px] p-3" style={{ color: "var(--text-faint)" }}>No one has registered for this event yet.</div>;
  }

  return (
    <div className="space-y-2">
      {canManage && (
        <div className="whmi-card p-3 grid grid-cols-3 gap-2 text-center">
          <div><div className="disp text-[16px] font-extrabold">{total}</div><div className="text-[10px]" style={{ color: "var(--text-faint)" }}>Total Registered</div></div>
          <div><div className="disp text-[16px] font-extrabold">{staffCount}</div><div className="text-[10px]" style={{ color: "var(--text-faint)" }}>WH Staff</div></div>
          <div><div className="disp text-[16px] font-extrabold">{externalCount}</div><div className="text-[10px]" style={{ color: "var(--text-faint)" }}>External</div></div>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <div className="whmi-input flex items-center gap-2 px-2.5 py-1.5 flex-1">
          <Search size={13} style={{ color: "var(--text-faint)" }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search registrations..." className="bg-transparent outline-none w-full text-[12.5px]" style={{ color: "var(--text)" }} />
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="whmi-input px-2 py-1.5 text-[11.5px] shrink-0">
          {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </div>

      {canManage && <DuplicateWarnings pairs={pairs} onMerge={onMerge} onDismiss={onDismissPair} />}

      {filtered.length === 0 && <div className="text-[12px] p-2" style={{ color: "var(--text-faint)" }}>No matches.</div>}

      {filtered.map(r => (
        <div key={r.id} className="p-2.5 rounded-lg" style={{ background: "var(--surface-2)", outline: highlightIds?.has(r.id) ? "2px solid #D9534F" : "none", outlineOffset: 1 }}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: "var(--accent-secondary)" }}>
                {r.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="min-w-0">
                <div className="text-[12.5px] font-semibold truncate">{r.name}</div>
                <div className="text-[11px] truncate" style={{ color: "var(--text-faint)" }}>
                  {r.email}{r.profession ? ` · ${r.profession}` : ""}{r.campus ? ` · ${r.campus}` : ""}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {r.isExternal && <span className="whmi-badge" style={{ background: "var(--surface)", color: "var(--text-dim)" }}>External</span>}
              {canManage && onUpdateAttendanceStatus ? (
                <select
                  value={r.attendanceStatus || "Registered"}
                  onChange={e => onUpdateAttendanceStatus(r, e.target.value)}
                  className="whmi-input px-1.5 py-1 text-[10.5px]"
                >
                  {ATTENDANCE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <StatusBadge status={r.attendanceStatus || "Registered"} />
              )}
              {canManage && onDelete && (
                <button onClick={() => onDelete(r)} style={{ color: "#D9534F" }}><Trash2 size={13} /></button>
              )}
            </div>
          </div>

          {canManage && event.mode === "Hybrid" && onUpdate && (
            <div className="flex items-center gap-1.5 mt-2 ml-9.5" style={{ marginLeft: 38 }}>
              <span className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>Attending:</span>
              <button
                onClick={() => onUpdate(r, { attendanceType: "In-person" })}
                className="whmi-badge"
                style={{ background: r.attendanceType === "In-person" ? "var(--accent-primary)" : "var(--surface)", color: r.attendanceType === "In-person" ? "white" : "var(--text-dim)" }}
              >
                In-person
              </button>
              <button
                onClick={() => onUpdate(r, { attendanceType: "Online" })}
                className="whmi-badge"
                style={{ background: r.attendanceType === "Online" ? "var(--accent-primary)" : "var(--surface)", color: r.attendanceType === "Online" ? "white" : "var(--text-dim)" }}
              >
                Online
              </button>
            </div>
          )}

          {(r.dietary || r.accessibility || r.comments) && (
            <div className="mt-1.5 ml-9.5 text-[10.5px] space-y-0.5" style={{ marginLeft: 38, color: "var(--text-faint)" }}>
              {r.dietary && <div>Dietary: {r.dietary}</div>}
              {r.accessibility && <div>Accessibility: {r.accessibility}</div>}
              {r.comments && <div>Comments: {r.comments}</div>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
