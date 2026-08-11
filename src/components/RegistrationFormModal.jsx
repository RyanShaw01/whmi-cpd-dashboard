import { useState } from "react";
import { X, Trash2, UserCircle2 } from "lucide-react";

const ATTENDANCE_STATUSES = ["Registered", "Waitlisted", "Attended", "No Show", "Cancelled"];

// One modal for both "Add Registration" (registration=null) and "edit an existing registrant's
// details" (registration set) - the fields are the same either way, so keeping them in one
// component means the two flows can't drift apart in what they collect.
export default function RegistrationFormModal({
  event, registration, onClose, onSave, onDelete, matchedStaff, onViewStaffProfile,
}) {
  const isEdit = !!registration;
  const [name, setName] = useState(registration?.name || "");
  const [email, setEmail] = useState(registration?.email || "");
  const [profession, setProfession] = useState(registration?.profession || "");
  const [organisation, setOrganisation] = useState(registration?.organisation || "");
  const [attendanceType, setAttendanceType] = useState(registration?.attendanceType || "In-person");
  const [attendanceStatus, setAttendanceStatus] = useState(registration?.attendanceStatus || "Registered");
  const [dietary, setDietary] = useState(registration?.dietary || "");
  const [accessibility, setAccessibility] = useState(registration?.accessibility || "");
  const [comments, setComments] = useState(registration?.comments || "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const valid = name.trim() && email.trim();

  const submit = (e) => {
    e.preventDefault();
    if (!valid) return;
    onSave({
      name: name.trim(), email: email.trim(), profession: profession.trim(), organisation: organisation.trim(),
      attendanceType, attendanceStatus, dietary: dietary.trim(), accessibility: accessibility.trim(), comments: comments.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.5)" }} onClick={onClose}>
      <form onSubmit={submit} className="whmi-card w-full max-w-md max-h-[85vh] overflow-y-auto whmi-scroll whmi-fade-in p-5 space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="font-bold text-[15px]">{isEdit ? "Edit Registration" : "Add Registration"}</div>
          <button type="button" onClick={onClose} className="whmi-btn-ghost !p-1.5"><X size={15} /></button>
        </div>

        {matchedStaff && onViewStaffProfile && (
          <button
            type="button" onClick={() => onViewStaffProfile(matchedStaff)}
            className="w-full flex items-center gap-2 p-2.5 rounded-lg text-left whmi-row-hover transition"
            style={{ border: "1px solid var(--border)" }}
          >
            <UserCircle2 size={16} style={{ color: "var(--accent-secondary)" }} className="shrink-0" />
            <span className="text-[12px]" style={{ color: "var(--text-dim)" }}>Matches staff record <strong style={{ color: "var(--text)" }}>{matchedStaff.name}</strong> - view their profile</span>
          </button>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Name</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1" />
          </div>
          <div>
            <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Email</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Profession</label>
            <input value={profession} onChange={e => setProfession(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1" />
          </div>
          <div>
            <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Organisation</label>
            <input value={organisation} onChange={e => setOrganisation(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {event.mode === "Hybrid" && (
            <div>
              <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Attending</label>
              <select value={attendanceType} onChange={e => setAttendanceType(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1">
                <option value="In-person">In-person</option>
                <option value="Online">Online</option>
              </select>
            </div>
          )}
          {isEdit && (
            <div>
              <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Status</label>
              <select value={attendanceStatus} onChange={e => setAttendanceStatus(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1">
                {ATTENDANCE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
        </div>
        <div>
          <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Dietary requirements</label>
          <input value={dietary} onChange={e => setDietary(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1" />
        </div>
        <div>
          <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Accessibility needs</label>
          <input value={accessibility} onChange={e => setAccessibility(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1" />
        </div>
        <div>
          <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Comments</label>
          <textarea value={comments} onChange={e => setComments(e.target.value)} rows={2} className="whmi-input w-full px-2.5 py-2 mt-1 resize-none" />
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          {isEdit && onDelete ? (
            confirmingDelete ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>Delete this registration?</span>
                <button type="button" onClick={() => onDelete(registration)} className="whmi-btn-ghost !py-1 !px-2 text-[11.5px]" style={{ color: "#D9534F" }}>Confirm</button>
                <button type="button" onClick={() => setConfirmingDelete(false)} className="whmi-btn-ghost !py-1 !px-2 text-[11.5px]">Cancel</button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmingDelete(true)} className="whmi-btn-ghost flex items-center gap-1.5 text-[12.5px]" style={{ color: "#D9534F" }}>
                <Trash2 size={13} />Delete
              </button>
            )
          ) : <span />}
          <div className="flex items-center gap-2 ml-auto">
            <button type="button" onClick={onClose} className="whmi-btn-ghost">Cancel</button>
            <button type="submit" disabled={!valid} className="whmi-btn-primary" style={{ opacity: valid ? 1 : 0.5 }}>{isEdit ? "Save Changes" : "Add Registration"}</button>
          </div>
        </div>
      </form>
    </div>
  );
}
