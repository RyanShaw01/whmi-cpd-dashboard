import { useState } from "react";
import { X, Trash2, Save, UserCircle2 } from "lucide-react";

export default function ExternalParticipantModal({ participant, onClose, onSave, onRequestDelete }) {
  const [name, setName] = useState(participant?.name || "");
  const [email, setEmail] = useState(participant?.email || "");
  if (!participant) return null;

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onSave(participant, { name: name.trim(), email: email.trim() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.5)" }} onClick={onClose}>
      <div className="whmi-card w-full max-w-sm whmi-fade-in" onClick={e => e.stopPropagation()}>
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="disp text-[16px] font-extrabold flex items-center gap-2"><UserCircle2 size={17} style={{ color: "var(--accent-primary)" }} />External Participant</h2>
          <button onClick={onClose} className="whmi-btn-ghost !p-2"><X size={14} /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3">
          <div>
            <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Name</label>
            <input required autoFocus value={name} onChange={e => setName(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1" />
          </div>
          <div>
            <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Email</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="whmi-btn-primary flex-1 flex items-center justify-center gap-1.5"><Save size={13} />Save</button>
            <button type="button" onClick={() => onRequestDelete(participant)} className="whmi-btn-ghost flex items-center justify-center gap-1.5" style={{ color: "#D9534F" }}><Trash2 size={13} />Delete</button>
          </div>
        </form>
      </div>
    </div>
  );
}
