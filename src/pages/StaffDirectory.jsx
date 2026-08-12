import { useState, useMemo } from "react";
import { Search, ArrowUp, ArrowDown, Plus, Shield, ChevronDown, ChevronRight, BarChart3, Users, Award, UserCircle2 } from "lucide-react";
import StaffQuickStats from "../components/StaffQuickStats";
import CharacterAvatar from "../components/CharacterAvatar";
import ExternalParticipantModal from "../components/ExternalParticipantModal";

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

export default function StaffDirectory({
  openStaff, onOpenAdminStaff, staffDirectory: rawStaffDirectory, canManage, externalParticipants = [], certificates = [], users = [], fieldVisibility = {},
  onSaveExternalParticipant, onRequestDeleteExternalParticipant, onPatchUser, onSaveUserContact,
}) {
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [desc, setDesc] = useState(false);
  const [statsExpanded, setStatsExpanded] = useState(true);
  const [staffExpanded, setStaffExpanded] = useState(false);
  const [externalsExpanded, setExternalsExpanded] = useState(false);
  const [recipientsExpanded, setRecipientsExpanded] = useState(false);
  const [selectedExternal, setSelectedExternal] = useState(null);

  // Defends against genuine duplicate rows in the underlying staff data (e.g. "Add to Staff"
  // accidentally run twice for the same person before they had a staffId) — keep the first
  // (oldest) record per name so Quick Stats and the Staff grid never show the same person twice.
  const staffDirectory = useMemo(() => {
    const seen = new Set();
    return rawStaffDirectory.filter(s => {
      const key = s.name.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [rawStaffDirectory]);

  // Admins/owners already linked to a staff record just appear naturally via staffDirectory;
  // only unlinked ones need a synthetic tile so every admin/owner shows up in the one combined
  // list. Also skip anyone whose name already matches an existing staff record even if `staffId`
  // isn't set — e.g. someone bulk-added as an Owner who was already a staff member under a
  // separate record — otherwise they'd show up twice (their real card + a synthetic one).
  const unlinkedAdminOwnerUsers = useMemo(() => {
    const linkedStaffIds = new Set(staffDirectory.map(s => s.id));
    const staffNames = new Set(staffDirectory.map(s => s.name.trim().toLowerCase()));
    return users
      .filter(u => !u.isTest && (u.role === "admin" || u.role === "owner")
        && (!u.staffId || !linkedStaffIds.has(u.staffId))
        && !staffNames.has(u.name.trim().toLowerCase()))
      .map(u => ({
        id: `admin-${u.id}`, name: u.name, profession: u.role === "admin" ? "Admin" : "Owner", campuses: [],
        hours: 0, attended: 0, certificates: 0, isUnlinkedAdmin: true, user: u,
      }));
  }, [users, staffDirectory]);

  const combined = useMemo(() => [...staffDirectory, ...unlinkedAdminOwnerUsers], [staffDirectory, unlinkedAdminOwnerUsers]);

  const filtered = useMemo(() => {
    const list = combined.filter(s => s.name.toLowerCase().includes(q.toLowerCase()));
    list.sort((a, b) => {
      const av = sortBy === "name" ? a.name : a[sortBy];
      const bv = sortBy === "name" ? b.name : b[sortBy];
      if (typeof av === "string") return desc ? bv.localeCompare(av) : av.localeCompare(bv);
      return desc ? (bv ?? 0) - (av ?? 0) : (av ?? 0) - (bv ?? 0);
    });
    return list;
  }, [combined, q, sortBy, desc]);
  const manualCertRecipients = certificates.filter(c => c.isManual);
  const openStaffTile = (s) => s.isUnlinkedAdmin ? onOpenAdminStaff(s.user) : openStaff(s);

  // A manual certificate recipient should already have a matching staff/external_participants
  // record (create-manual-certificate files one server-side) - click through to whichever one
  // actually matches. Falls back to doing nothing for older certificates issued before
  // recipients were reliably filed, rather than opening a modal that can't save anywhere real.
  const findRecipientRecord = (c) => {
    const matchExternal = externalParticipants.find(p => p.email?.toLowerCase() === c.recipientEmail?.toLowerCase());
    if (matchExternal) return { kind: "external", record: matchExternal };
    const matchStaff = staffDirectory.find(s => s.name.trim().toLowerCase() === c.staff.trim().toLowerCase());
    if (matchStaff) return { kind: "staff", record: matchStaff };
    return null;
  };
  const openRecipient = (c) => {
    const found = findRecipientRecord(c);
    if (!found) return;
    if (found.kind === "external") setSelectedExternal(found.record);
    else openStaffTile(found.record);
  };
  return (
    <div className="whmi-fade-in p-6 max-w-[1400px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="disp text-[22px] font-extrabold">Staff Directory</h1>
          <p className="text-[13px]" style={{ color: "var(--text-dim)" }}>
            {combined.length} staff members{manualCertRecipients.length > 0 ? `, ${manualCertRecipients.length} external recipient${manualCertRecipients.length === 1 ? "" : "s"}` : ""}.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="whmi-input flex items-center gap-2 px-3 py-2 w-56">
            <Search size={13} style={{ color: "var(--text-faint)" }} />
            <input
              value={q}
              onChange={e => {
                const next = e.target.value;
                setQ(next);
                // Searching is pointless if the results are hidden behind a collapsed section —
                // open both the moment there's a query, so matches are visible immediately.
                if (next.trim()) { setStaffExpanded(true); setStatsExpanded(true); }
              }}
              placeholder="Search staff..." className="bg-transparent outline-none w-full text-[13px]" style={{ color: "var(--text)" }}
            />
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

      {canManage && (
        <div className="whmi-card p-4">
          <button onClick={() => setStatsExpanded(x => !x)} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              {statsExpanded ? <ChevronDown size={13} style={{ color: "var(--text-faint)" }} /> : <ChevronRight size={13} style={{ color: "var(--text-faint)" }} />}
              <BarChart3 size={15} style={{ color: "var(--accent-primary)" }} /><div className="font-semibold text-[13px]">Quick Stats</div>
            </div>
          </button>
          {statsExpanded && (
            <div className="mt-3">
              <StaffQuickStats
                staffDirectory={staffDirectory} onSelectStaff={openStaff} query={q}
                externalParticipants={externalParticipants} certificates={certificates} onSelectExternal={setSelectedExternal}
              />
            </div>
          )}
        </div>
      )}

      <div className="whmi-card p-4">
        <button onClick={() => setStaffExpanded(x => !x)} className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            {staffExpanded ? <ChevronDown size={13} style={{ color: "var(--text-faint)" }} /> : <ChevronRight size={13} style={{ color: "var(--text-faint)" }} />}
            <Users size={15} style={{ color: "var(--accent-primary)" }} /><div className="font-semibold text-[13px]">Staff</div>
          </div>
          <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>{filtered.length}</span>
        </button>
        {staffExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
            {filtered.map(s => (
              <button key={s.id} onClick={() => openStaffTile(s)} className="whmi-card p-4 text-left whmi-row-hover transition flex items-center gap-3">
                {s.isUnlinkedAdmin ? (
                  <CharacterAvatar avatarId={s.user.avatarId} color={s.user.avatarColor} size={44} />
                ) : (
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0" style={{ background: "var(--accent-secondary)" }}>
                    {s.name.split(" ").map(n => n[0]).join("")}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[13.5px] truncate flex items-center gap-1.5">
                    {s.name}
                    {s.isUnlinkedAdmin && <Shield size={12} style={{ color: "var(--accent-primary)" }} title={s.profession} />}
                  </div>
                  <div className="text-[11.5px] truncate" style={{ color: "var(--text-dim)" }}>
                    {fieldVisibility.profession !== false ? s.profession : ""}
                    {fieldVisibility.campuses !== false && s.campuses.length > 0 ? ` · ${s.campuses.join("/")}` : ""}
                  </div>
                  <div className="text-[11px] mt-1" style={{ color: "var(--text-faint)" }}>
                    {fieldVisibility.hours !== false ? `${s.hours} CPD hrs` : ""}
                    {fieldVisibility.hours !== false && fieldVisibility.certificates !== false ? " · " : ""}
                    {fieldVisibility.certificates !== false ? `${s.certificates} certificates` : ""}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {canManage && manualCertRecipients.length > 0 && (
        <div className="whmi-card p-4">
          <button onClick={() => setRecipientsExpanded(x => !x)} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              {recipientsExpanded ? <ChevronDown size={13} style={{ color: "var(--text-faint)" }} /> : <ChevronRight size={13} style={{ color: "var(--text-faint)" }} />}
              <Award size={15} style={{ color: "var(--accent-primary)" }} /><div className="disp text-[13px] font-semibold">External Certificate Recipients</div>
            </div>
            <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>{manualCertRecipients.length}</span>
          </button>
          {recipientsExpanded && (
            <>
              <p className="text-[11.5px] mt-2 mb-3" style={{ color: "var(--text-faint)" }}>People without an account who've been issued a certificate directly.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {manualCertRecipients.map(c => {
                  const clickable = !!findRecipientRecord(c);
                  const Tag = clickable ? "button" : "div";
                  return (
                    <Tag
                      key={c.id} {...(clickable ? { onClick: () => openRecipient(c) } : {})}
                      className={`whmi-card p-4 text-left flex items-center gap-3 transition${clickable ? " whmi-row-hover" : ""}`}
                    >
                      <div className="w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0" style={{ background: "var(--accent-secondary)" }}>
                        {c.staff.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-[13.5px] truncate">{c.staff}</div>
                        <div className="text-[11.5px] truncate" style={{ color: "var(--text-dim)" }}>{c.recipientEmail}</div>
                        <div className="text-[11px] mt-1" style={{ color: "var(--text-faint)" }}>{c.event}</div>
                      </div>
                    </Tag>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {canManage && externalParticipants.length > 0 && (
        <div className="whmi-card p-4">
          <button onClick={() => setExternalsExpanded(x => !x)} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              {externalsExpanded ? <ChevronDown size={13} style={{ color: "var(--text-faint)" }} /> : <ChevronRight size={13} style={{ color: "var(--text-faint)" }} />}
              <UserCircle2 size={15} style={{ color: "var(--accent-primary)" }} /><div className="disp text-[13px] font-semibold">External Participants</div>
            </div>
            <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>{externalParticipants.length}</span>
          </button>
          {externalsExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
            {externalParticipants.map(p => (
              <button key={p.id} onClick={() => setSelectedExternal(p)} className="whmi-card p-4 text-left whmi-row-hover transition flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0" style={{ background: "var(--accent-success)" }}>
                  {p.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[13.5px] truncate">{p.name}</div>
                  <div className="text-[11.5px] truncate" style={{ color: "var(--text-dim)" }}>{p.email}</div>
                  <div className="text-[11px] mt-1" style={{ color: "var(--text-faint)" }}>External participant</div>
                </div>
              </button>
            ))}
          </div>
          )}
        </div>
      )}

      <ExternalParticipantModal
        participant={selectedExternal}
        onClose={() => setSelectedExternal(null)}
        onSave={onSaveExternalParticipant}
        onRequestDelete={(p) => { onRequestDeleteExternalParticipant?.(p); setSelectedExternal(null); }}
        certificates={certificates} canManage={canManage} users={users} onPatchUser={onPatchUser} onSaveUserContact={onSaveUserContact}
      />
    </div>
  );
}
