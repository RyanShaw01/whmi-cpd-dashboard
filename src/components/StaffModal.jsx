import { useState, useEffect } from "react";
import { X, Save, Download, Trash2 } from "lucide-react";
import { CAMPUS_OPTIONS, MODALITY_OPTIONS, GRADE_OPTIONS } from "../data/mockData";

export default function StaffModal({ staff, onClose, canEdit, onSave, onRequestDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(staff);
  useEffect(() => { setForm(staff); setEditing(false); }, [staff]);
  if (!staff) return null;

  const toggleCampus = (code) => setForm(f => ({ ...f, campuses: f.campuses.includes(code) ? f.campuses.filter(c => c !== code) : [...f.campuses, code] }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.5)" }} onClick={onClose}>
      <div className="whmi-card w-full max-w-md max-h-[85vh] overflow-y-auto whmi-scroll whmi-fade-in" onClick={e => e.stopPropagation()}>
        <div className="p-5 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-bold text-white shrink-0" style={{ background: "var(--accent-secondary)" }}>
            {staff.name.split(" ").map(n => n[0]).join("")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[15px] break-words">{staff.name}</div>
            <div className="text-[12px]" style={{ color: "var(--text-dim)" }}>{staff.profession}</div>
          </div>
          <button onClick={onClose} className="whmi-btn-ghost !p-2 shrink-0"><X size={14} /></button>
        </div>
        <div className="p-5 grid grid-cols-3 gap-3">
          <div className="whmi-card p-3 text-center"><div className="disp text-[18px] font-extrabold">{staff.hours}</div><div className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>CPD Hours</div></div>
          <div className="whmi-card p-3 text-center"><div className="disp text-[18px] font-extrabold">{staff.attended}</div><div className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>Attended</div></div>
          <div className="whmi-card p-3 text-center"><div className="disp text-[18px] font-extrabold">{staff.certificates}</div><div className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>Certificates</div></div>
        </div>

        <div className="px-5 pb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-[12.5px]">Record Details</div>
            {canEdit && !editing && <button onClick={() => setEditing(true)} className="whmi-btn-ghost !py-1 !px-2.5 text-[11.5px]">Edit</button>}
          </div>

          {!editing ? (
            <div className="space-y-2 text-[12.5px]">
              <div className="flex justify-between"><span style={{ color: "var(--text-faint)" }}>Qualified</span><span>{staff.qualifiedYear || "—"}</span></div>
              <div className="flex justify-between"><span style={{ color: "var(--text-faint)" }}>Modality</span><span>{staff.modality}</span></div>
              <div className="flex justify-between"><span style={{ color: "var(--text-faint)" }}>Grade</span><span>{staff.grade}</span></div>
              <div className="flex justify-between"><span style={{ color: "var(--text-faint)" }}>Campuses</span><span>{staff.campuses.join(", ")}</span></div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div>
                <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Qualified Year</label>
                <input type="number" value={form.qualifiedYear || ""} onChange={e => setForm(f => ({ ...f, qualifiedYear: e.target.value ? Number(e.target.value) : null }))} className="whmi-input w-full px-2.5 py-1.5 mt-1" />
              </div>
              <div>
                <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Modality</label>
                <select value={form.modality} onChange={e => setForm(f => ({ ...f, modality: e.target.value }))} className="whmi-input w-full px-2.5 py-1.5 mt-1">
                  {MODALITY_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Grade</label>
                <select value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} className="whmi-input w-full px-2.5 py-1.5 mt-1">
                  {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Campuses</label>
                <div className="flex gap-1.5 flex-wrap mt-1">
                  {CAMPUS_OPTIONS.map(c => (
                    <button key={c.code} type="button" onClick={() => toggleCampus(c.code)} className="whmi-badge" style={{ background: form.campuses.includes(c.code) ? "var(--accent-primary)" : "var(--surface-2)", color: form.campuses.includes(c.code) ? "white" : "var(--text-dim)" }}>
                      {c.code}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => { onSave(form); setEditing(false); }} className="whmi-btn-primary flex-1 flex items-center justify-center gap-1.5"><Save size={13} />Save</button>
                <button onClick={() => { setForm(staff); setEditing(false); }} className="whmi-btn-ghost flex-1">Cancel</button>
              </div>
              {canEdit && onRequestDelete && (
                <button onClick={() => onRequestDelete(staff)} className="whmi-btn-ghost w-full flex items-center justify-center gap-1.5 mt-2" style={{ color: "#D9534F" }}>
                  <Trash2 size={13} />Delete Staff Record
                </button>
              )}
            </div>
          )}
        </div>

        <div className="px-5 pb-5">
          <button className="whmi-btn-ghost w-full flex items-center justify-center gap-1.5"><Download size={14} />Download Certificate History</button>
        </div>
      </div>
    </div>
  );
}
