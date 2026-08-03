import { useState } from "react";
import { Search } from "lucide-react";
import StaffQuickStats from "../components/StaffQuickStats";

export default function StaffDirectory({ openStaff, staffDirectory, canManage, externalParticipants = [], certificates = [] }) {
  const [q, setQ] = useState("");
  const filtered = staffDirectory.filter(s => s.name.toLowerCase().includes(q.toLowerCase()));
  const manualCertRecipients = certificates.filter(c => c.isManual);
  return (
    <div className="whmi-fade-in p-6 max-w-[1400px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="disp text-[22px] font-extrabold">Staff Directory</h1>
          <p className="text-[13px]" style={{ color: "var(--text-dim)" }}>{staffDirectory.length} staff members across WHMI campuses.</p>
        </div>
        <div className="whmi-input flex items-center gap-2 px-3 py-2 w-56">
          <Search size={13} style={{ color: "var(--text-faint)" }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search staff..." className="bg-transparent outline-none w-full text-[13px]" style={{ color: "var(--text)" }} />
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
