import { useState, useMemo } from "react";
import { Search, ArrowUp, ArrowDown, Plus, ChevronDown, ChevronRight, Shield } from "lucide-react";
import StaffQuickStats from "../components/StaffQuickStats";
import CharacterAvatar from "../components/CharacterAvatar";

const SORT_OPTIONS = [
  { id: "name", label: "Name" },
  { id: "hours", label: "CPD Hours" },
  { id: "attended", label: "Attended" },
  { id: "certificates", label: "Certificates" },
];

export const blankStaff = () => ({
  isNew: true, id: null, name: "", profession: "", department: "", campuses: [],
  hours: 0, attended: 0, certificates: 0, modality: "General XR", grade: "Grade 1",
  qualifiedYear: null, hoursLast3Years: null, eventsThisYear: null, lastAttended: null, attendedEventIds: [],
});

export default function StaffDirectory({ openStaff, staffDirectory, canManage, externalParticipants = [], certificates = [], users = [] }) {
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [desc, setDesc] = useState(false);
  const [adminsExpanded, setAdminsExpanded] = useState(true);
  const adminOwnerUsers = useMemo(
    () => users.filter(u => !u.isTest && (u.role === "admin" || u.role === "owner")).sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [users]
  );
  const filtered = useMemo(() => {
    const list = staffDirectory.filter(s => s.name.toLowerCase().includes(q.toLowerCase()));
    list.sort((a, b) => {
      const av = sortBy === "name" ? a.name : a[sortBy];
      const bv = sortBy === "name" ? b.name : b[sortBy];
      if (typeof av === "string") return desc ? bv.localeCompare(av) : av.localeCompare(bv);
      return desc ? (bv ?? 0) - (av ?? 0) : (av ?? 0) - (bv ?? 0);
    });
    return list;
  }, [staffDirectory, q, sortBy, desc]);
  const manualCertRecipients = certificates.filter(c => c.isManual);
  return (
    <div className="whmi-fade-in p-6 max-w-[1400px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="disp text-[22px] font-extrabold">Staff Directory</h1>
          <p className="text-[13px]" style={{ color: "var(--text-dim)" }}>{staffDirectory.length} staff members across WHMI campuses.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="whmi-input flex items-center gap-2 px-3 py-2 w-56">
            <Search size={13} style={{ color: "var(--text-faint)" }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search staff..." className="bg-transparent outline-none w-full text-[13px]" style={{ color: "var(--text)" }} />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="whmi-input px-2 py-2 text-[12px]">
            {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <button onClick={() => setDesc(d => !d)} className="whmi-btn-ghost !p-2" title={desc ? "Descending" : "Ascending"}>
            {desc ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
          </button>
          {canManage && (
            <button onClick={() => openStaff(blankStaff())} className="whmi-btn-primary flex items-center gap-1.5"><Plus size={15} />Add Staff</button>
          )}
        </div>
      </div>

      {canManage && <StaffQuickStats staffDirectory={staffDirectory} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => (
          <button key={s.id} onClick={() => openStaff(s)} className="whmi-card p-4 text-left whmi-row-hover transition flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0" style={{ background: "var(--accent-secondary)" }}>
              {s.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-[13.5px] truncate">{s.name}</div>
              <div className="text-[11.5px] truncate" style={{ color: "var(--text-dim)" }}>{s.profession} · {s.campuses.join("/")}</div>
              <div className="text-[11px] mt-1" style={{ color: "var(--text-faint)" }}>{s.hours} CPD hrs · {s.certificates} certificates</div>
            </div>
          </button>
        ))}
      </div>

      {canManage && adminOwnerUsers.length > 0 && (
        <div className="whmi-card p-4">
          <button onClick={() => setAdminsExpanded(x => !x)} className="w-full flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              {adminsExpanded ? <ChevronDown size={13} style={{ color: "var(--text-faint)" }} /> : <ChevronRight size={13} style={{ color: "var(--text-faint)" }} />}
              <Shield size={15} style={{ color: "var(--accent-primary)" }} /><div className="font-semibold text-[13px]">Admins &amp; Owners</div>
            </div>
            <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>{adminOwnerUsers.length}</span>
          </button>
          {adminsExpanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
              {adminOwnerUsers.map(u => (
                <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: "var(--surface-2)" }}>
                  <CharacterAvatar avatarId={u.avatarId} color={u.avatarColor} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[12.5px] truncate">{u.name}</div>
                    <div className="text-[10.5px] truncate" style={{ color: "var(--text-faint)" }}>{u.email}</div>
                  </div>
                  <span className="whmi-badge shrink-0" style={{ background: "var(--surface)", color: "var(--text-dim)", textTransform: "capitalize" }}>{u.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {canManage && externalParticipants.length > 0 && (
        <div>
          <h2 className="disp text-[16px] font-bold mb-3">External Participants</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {externalParticipants.map(p => (
              <div key={p.id} className="whmi-card p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0" style={{ background: "var(--accent-success)" }}>
                  {p.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[13.5px] truncate">{p.name}</div>
                  <div className="text-[11.5px] truncate" style={{ color: "var(--text-dim)" }}>{p.email}</div>
                  <div className="text-[11px] mt-1" style={{ color: "var(--text-faint)" }}>External participant</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {canManage && manualCertRecipients.length > 0 && (
        <div>
          <h2 className="disp text-[16px] font-bold mb-3">Certificate Recipients</h2>
          <p className="text-[11.5px] mb-3" style={{ color: "var(--text-faint)" }}>People without an account who've been issued a certificate directly.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {manualCertRecipients.map(c => (
              <div key={c.id} className="whmi-card p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0" style={{ background: "var(--accent-secondary)" }}>
                  {c.staff.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[13.5px] truncate">{c.staff}</div>
                  <div className="text-[11.5px] truncate" style={{ color: "var(--text-dim)" }}>{c.recipientEmail}</div>
                  <div className="text-[11px] mt-1" style={{ color: "var(--text-faint)" }}>{c.event}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
