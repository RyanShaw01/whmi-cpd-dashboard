import { useState } from "react";
import { X, UserPlus } from "lucide-react";

export default function AddMemberModal({ open, onClose, onAdd }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userType, setUserType] = useState("internal");
  const [isEducationTeam, setIsEducationTeam] = useState(false);
  const [email, setEmail] = useState("");
  const [secondaryEmail, setSecondaryEmail] = useState("");

  if (!open) return null;

  const reset = () => {
    setFirstName(""); setLastName(""); setUserType("internal");
    setIsEducationTeam(false); setEmail(""); setSecondaryEmail("");
  };
  const close = () => { reset(); onClose(); };

  const submit = (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) return;
    onAdd({ firstName: firstName.trim(), lastName: lastName.trim(), userType, isEducationTeam, email: email.trim(), secondaryEmail: secondaryEmail.trim() });
    close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.5)" }} onClick={close}>
      <div className="whmi-card w-full max-w-md whmi-fade-in" onClick={e => e.stopPropagation()}>
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="disp text-[16px] font-extrabold flex items-center gap-2"><UserPlus size={17} style={{ color: "var(--accent-primary)" }} />Add Member</h2>
          <button onClick={close} className="whmi-btn-ghost !p-2"><X size={14} /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>First Name</label>
              <input required autoFocus value={firstName} onChange={e => setFirstName(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1" />
            </div>
            <div>
              <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Last Name</label>
              <input required value={lastName} onChange={e => setLastName(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Email Address</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1" />
          </div>
          <div>
            <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Secondary Email (optional)</label>
            <input type="email" value={secondaryEmail} onChange={e => setSecondaryEmail(e.target.value)} placeholder="jane.doe@othermail.com" className="whmi-input w-full px-2.5 py-2 mt-1" />
          </div>
          <div>
            <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Account Type</label>
            <div className="flex gap-2 mt-1">
              <button type="button" onClick={() => setUserType("internal")} className={userType === "internal" ? "whmi-btn-primary flex-1" : "whmi-btn-ghost flex-1"}>Internal (WH Staff)</button>
              <button type="button" onClick={() => setUserType("external")} className={userType === "external" ? "whmi-btn-primary flex-1" : "whmi-btn-ghost flex-1"}>External</button>
            </div>
          </div>
          <label className="flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer" style={{ background: "var(--surface-2)" }}>
            <input type="checkbox" checked={isEducationTeam} onChange={e => setIsEducationTeam(e.target.checked)} />
            <div>
              <div className="text-[12.5px] font-semibold">Education Team</div>
              <div className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>Automatically given the Owner role, with full management access.</div>
            </div>
          </label>
          <button type="submit" className="whmi-btn-primary w-full flex items-center justify-center gap-1.5"><UserPlus size={14} />Add Member</button>
        </form>
      </div>
    </div>
  );
}
