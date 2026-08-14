import { useState, useEffect } from "react";
import { X, Trash2, Save, UserCircle2, ArrowLeftRight } from "lucide-react";

export default function ExternalParticipantModal({
  participant, onClose, onSave, onRequestDelete, certificates = [], canManage, users = [], onPatchUser, onSaveUserContact, onMoveToStaff,
}) {
  const [name, setName] = useState(participant?.name || "");
  const [email, setEmail] = useState(participant?.email || "");
  const [emailDraft, setEmailDraft] = useState({ email: "", secondaryEmail: "" });
  useEffect(() => {
    setName(participant?.name || "");
    setEmail(participant?.email || "");
  }, [participant]);

  if (!participant) return null;

  // Certificate-based stats, same idea as StaffModal's - externals aren't tracked via
  // attendance/events like staff, so certificates issued to their email are the only signal.
  const myCerts = certificates.filter(c => c.recipientEmail?.toLowerCase() === participant.email.toLowerCase() && c.status === "Sent");
  const hours = Math.round(myCerts.reduce((sum, c) => sum + (c.cpdHours || 0), 0) * 10) / 10;

  // If this external participant also has a real login account (a "viewer" they signed up
  // themselves, or an admin created one for them), surface it here so admins/owners don't have to
  // go find them separately in Settings to see their email or move them between staff/external.
  const linkedUser = users.find(u => u.email.toLowerCase() === participant.email.toLowerCase() || u.secondaryEmail?.toLowerCase() === participant.email.toLowerCase());
  const draft = linkedUser ? (emailDraft.userId === linkedUser.id ? emailDraft : { userId: linkedUser.id, email: linkedUser.email, secondaryEmail: linkedUser.secondaryEmail || "" }) : null;
  const setDraft = (patch) => setEmailDraft({ userId: linkedUser.id, ...draft, ...patch });
  const emailDirty = draft && (draft.email !== linkedUser.email || draft.secondaryEmail !== (linkedUser.secondaryEmail || ""));
  const saveContact = () => {
    const patch = {};
    if (draft.email !== linkedUser.email) patch.email = draft.email;
    if (draft.secondaryEmail !== (linkedUser.secondaryEmail || "")) patch.secondaryEmail = draft.secondaryEmail || null;
    onSaveUserContact(linkedUser, patch);
    setEmailDraft({ email: "", secondaryEmail: "" });
  };

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onSave(participant, { name: name.trim(), email: email.trim() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.5)" }} onClick={onClose}>
      <div className="whmi-card w-full max-w-sm max-h-[85vh] overflow-y-auto whmi-scroll whmi-fade-in" onClick={e => e.stopPropagation()}>
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="disp text-[16px] font-extrabold flex items-center gap-2"><UserCircle2 size={17} style={{ color: "var(--accent-primary)" }} />External Participant</h2>
          <button onClick={onClose} className="whmi-btn-ghost !p-2"><X size={14} /></button>
        </div>

        {myCerts.length > 0 && (
          <div className="p-5 grid grid-cols-2 gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="whmi-card p-3 text-center"><div className="disp text-[18px] font-extrabold">{hours}</div><div className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>CPD Hours</div></div>
            <div className="whmi-card p-3 text-center"><div className="disp text-[18px] font-extrabold">{myCerts.length}</div><div className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>Certificates</div></div>
          </div>
        )}

        {canManage && linkedUser && (
          <div className="p-5 space-y-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="font-semibold text-[12.5px] flex items-center gap-1.5">Linked Account <span className="whmi-badge" style={{ background: "var(--surface-2)", color: "var(--text-dim)" }}>{linkedUser.role}</span></div>
            <div>
              <label className="text-[10.5px] font-semibold" style={{ color: "var(--text-faint)" }}>Account type</label>
              <select value={linkedUser.userType || "internal"} onChange={e => onPatchUser(linkedUser.id, { userType: e.target.value })} className="whmi-input w-full px-2.5 py-1.5 mt-1 text-[12px]">
                <option value="internal">Internal (Western Health staff)</option>
                <option value="external">External</option>
              </select>
            </div>
            <div>
              <label className="text-[10.5px] font-semibold" style={{ color: "var(--text-faint)" }}>Primary email</label>
              <input value={draft.email} onChange={e => setDraft({ email: e.target.value })} className="whmi-input w-full px-2.5 py-1.5 mt-1 text-[12px]" />
            </div>
            <div>
              <label className="text-[10.5px] font-semibold" style={{ color: "var(--text-faint)" }}>Secondary email</label>
              <input value={draft.secondaryEmail} onChange={e => setDraft({ secondaryEmail: e.target.value })} placeholder="jane.doe@othermail.com" className="whmi-input w-full px-2.5 py-1.5 mt-1 text-[12px]" />
            </div>
            {emailDirty && (
              <button onClick={saveContact} className="whmi-btn-primary w-full flex items-center justify-center gap-1.5 text-[12px]"><Save size={12} />Save Account Email</button>
            )}
          </div>
        )}

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
          {canManage && onMoveToStaff && (
            <button type="button" onClick={() => onMoveToStaff(participant)} className="whmi-btn-ghost w-full flex items-center justify-center gap-1.5">
              <ArrowLeftRight size={13} />Move to Internal Staff
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
