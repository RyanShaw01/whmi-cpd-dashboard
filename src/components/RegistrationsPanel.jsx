import { useState, useMemo } from "react";
import { Search, Check, X, Ban, Pencil, UserPlus, Mic } from "lucide-react";
import StatusBadge from "./StatusBadge";
import DuplicateWarnings from "./DuplicateWarnings";
import RegistrationFormModal from "./RegistrationFormModal";
import { findDuplicates } from "../lib/duplicates";

// Manually-settable outcomes — "Registered"/"Waitlisted" stay automatic states driven by
// registration/capacity, shown read-only via StatusBadge when none of these three apply.
const ATTENDANCE_TICKS = [
  { id: "Attended", label: "Attended", icon: Check, color: "var(--accent-success)" },
  { id: "No Show", label: "No Show", icon: X, color: "#D9534F" },
  { id: "Cancelled", label: "Cancelled", icon: Ban, color: "var(--text-faint)" },
];

const SORT_OPTIONS = [
  { id: "date-desc", label: "Newest - Oldest" },
  { id: "date-asc", label: "Oldest - Newest" },
  { id: "alpha-asc", label: "Alphabetical (A - Z)" },
  { id: "alpha-desc", label: "Alphabetical (Z - A)" },
];

// Attendance ticks default to a single collapsed pill showing whichever outcome is already set
// (or all three side by side if none is set yet), rather than always showing all three - clicking
// the collapsed pill re-expands the row so a different outcome can be picked, or the same one
// clicked again to unmark it back to Registered/Waitlisted.
function AttendanceControl({ registration, onUpdateAttendanceStatus }) {
  const [expanded, setExpanded] = useState(false);
  const activeTick = ATTENDANCE_TICKS.find(t => t.id === registration.attendanceStatus);

  if (activeTick && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-semibold transition hover:brightness-110"
        style={{ background: activeTick.color + "22", color: activeTick.color, border: `1px solid ${activeTick.color}` }}
        title={`${activeTick.label} - click to change`}
      >
        <activeTick.icon size={11} />{activeTick.label}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {ATTENDANCE_TICKS.map(t => {
        const active = registration.attendanceStatus === t.id;
        return (
          <button
            key={t.id}
            onClick={() => { onUpdateAttendanceStatus(registration, active ? "Registered" : t.id); setExpanded(false); }}
            className={`flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-semibold transition ${active ? "hover:brightness-110" : "whmi-row-hover"}`}
            style={{ background: active ? t.color + "22" : "transparent", color: active ? t.color : "var(--text-faint)", border: `1px solid ${active ? t.color : "var(--border)"}` }}
            title={active ? `Click to unmark ${t.label}` : t.label}
          >
            <t.icon size={11} />{t.label}
          </button>
        );
      })}
    </div>
  );
}

// One row, shared by both the Presenters group and the regular Attendees group below - kept as
// its own component (rather than inlined in a .map()) purely so it can be reused for both groups
// without duplicating the markup.
function RegistrationRow({ r, event, canManage, onUpdate, onUpdateAttendanceStatus, highlightIds, onEdit }) {
  // Not a real <button> - the row already contains several (attendance ticks, the attending-type
  // toggle, the edit control), and a <button> can't nest another <button> without the browser
  // silently mis-parsing it. role="button" + keyboard handling keeps it accessible without that
  // restriction.
  const clickable = canManage && !!onUpdate;
  return (
    <div
      {...(clickable ? {
        onClick: () => onEdit(r), role: "button", tabIndex: 0,
        onKeyDown: e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onEdit(r); } },
      } : {})}
      className={`w-full p-2.5 rounded-lg text-left transition${clickable ? " whmi-row-hover cursor-pointer" : ""}`}
      style={{ background: "var(--surface-2)", outline: highlightIds?.has(r.id) ? "2px solid #D9534F" : "none", outlineOffset: 1 }}
    >
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
            <div onClick={e => e.stopPropagation()}>
              <AttendanceControl registration={r} onUpdateAttendanceStatus={onUpdateAttendanceStatus} />
            </div>
          ) : (
            <StatusBadge status={r.attendanceStatus || "Registered"} />
          )}
          {canManage && onUpdate && (
            <span onClick={e => { e.stopPropagation(); onEdit(r); }} className="whmi-btn-ghost !p-1.5" title="Edit registration"><Pencil size={13} /></span>
          )}
        </div>
      </div>

      {canManage && event.mode === "Hybrid" && onUpdate && (
        <div className="flex items-center gap-1.5 mt-2 ml-9.5" style={{ marginLeft: 38 }} onClick={e => e.stopPropagation()}>
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
  );
}

// Best-effort link from a registrant to a staff directory record: prefer the reliable
// registration.userId -> users.staffId chain (set whenever the registrant was signed in when
// they registered), falling back to a same-name match for admin-added/anonymous registrants.
function findMatchedStaff(reg, users, staffDirectory) {
  if (!staffDirectory?.length) return null;
  const user = reg.userId ? users?.find(u => u.id === reg.userId) : null;
  if (user?.staffId) {
    const byId = staffDirectory.find(s => s.id === user.staffId);
    if (byId) return byId;
  }
  return staffDirectory.find(s => s.name.trim().toLowerCase() === (reg.name || "").trim().toLowerCase()) || null;
}

export default function RegistrationsPanel({
  event, registrations, canManage, dismissedPairs, onDelete, onUpdate, onUpdateAttendanceStatus, onMerge, onDismissPair, highlightIds,
  onAdd, users, staffDirectory, onViewStaffProfile,
}) {
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [editingReg, setEditingReg] = useState(null); // registration object, or "new" to add
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
  // Presenters get their own group at the top, physically separated from regular attendees
  // rather than just badged inline, so they're easy to scan for at a glance.
  const presenters = filtered.filter(r => r.isPresenter);
  const attendees = filtered.filter(r => !r.isPresenter);

  const pairs = canManage ? findDuplicates(registrations, dismissedPairs || new Set()) : [];

  const total = registrations.length;
  const externalCount = registrations.filter(r => r.isExternal).length;
  const staffCount = total - externalCount;

  const closeEditor = () => setEditingReg(null);
  const saveEdit = (patch) => {
    if (editingReg === "new") onAdd?.(patch);
    else onUpdate?.(editingReg, patch);
    closeEditor();
  };
  const deleteFromEditor = (reg) => {
    onDelete?.(reg);
    closeEditor();
  };
  const matchedStaffFor = (reg) => findMatchedStaff(reg, users, staffDirectory);

  return (
    <div className="space-y-2">
      {canManage && (
        <div className="whmi-card p-3 grid grid-cols-3 gap-2 text-center">
          <div><div className="disp text-[16px] font-extrabold">{total}</div><div className="text-[10px]" style={{ color: "var(--text-faint)" }}>Total Registered</div></div>
          <div><div className="disp text-[16px] font-extrabold">{staffCount}</div><div className="text-[10px]" style={{ color: "var(--text-faint)" }}>WH Staff</div></div>
          <div><div className="disp text-[16px] font-extrabold">{externalCount}</div><div className="text-[10px]" style={{ color: "var(--text-faint)" }}>External</div></div>
        </div>
      )}

      {canManage && onAdd && (
        <button onClick={() => setEditingReg("new")} className="whmi-btn-ghost w-full flex items-center justify-center gap-1.5">
          <UserPlus size={14} />Add Registration
        </button>
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

      {registrations.length === 0 && <div className="text-[12.5px] p-3" style={{ color: "var(--text-faint)" }}>No one has registered for this event yet.</div>}
      {registrations.length > 0 && filtered.length === 0 && <div className="text-[12px] p-2" style={{ color: "var(--text-faint)" }}>No matches.</div>}

      {presenters.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10.5px] font-bold uppercase tracking-wide px-0.5 flex items-center gap-1" style={{ color: "var(--accent-secondary)" }}>
            <Mic size={11} />Presenters ({presenters.length})
          </div>
          {presenters.map(r => (
            <RegistrationRow key={r.id} r={r} event={event} canManage={canManage} onUpdate={onUpdate} onUpdateAttendanceStatus={onUpdateAttendanceStatus} highlightIds={highlightIds} onEdit={setEditingReg} />
          ))}
        </div>
      )}

      {attendees.length > 0 && (
        <div className="space-y-1.5">
          {presenters.length > 0 && (
            <div className="text-[10.5px] font-bold uppercase tracking-wide px-0.5 pt-1" style={{ color: "var(--text-faint)" }}>Attendees ({attendees.length})</div>
          )}
          {attendees.map(r => (
            <RegistrationRow key={r.id} r={r} event={event} canManage={canManage} onUpdate={onUpdate} onUpdateAttendanceStatus={onUpdateAttendanceStatus} highlightIds={highlightIds} onEdit={setEditingReg} />
          ))}
        </div>
      )}

      {editingReg && (
        <RegistrationFormModal
          event={event}
          registration={editingReg === "new" ? null : editingReg}
          onClose={closeEditor}
          onSave={saveEdit}
          onDelete={editingReg !== "new" && onDelete ? deleteFromEditor : undefined}
          matchedStaff={editingReg !== "new" ? matchedStaffFor(editingReg) : null}
          onViewStaffProfile={onViewStaffProfile ? (staff) => { closeEditor(); onViewStaffProfile(staff); } : undefined}
        />
      )}
    </div>
  );
}
