import { useState, useEffect } from "react";
import { X, Save, Download, Trash2 } from "lucide-react";
import { CAMPUS_OPTIONS, MODALITY_OPTIONS, GRADE_OPTIONS } from "../data/mockData";

export default function StaffModal({
  staff, onClose, canEdit, onSave, onCreate, onRequestDelete, linkableUsers = [], fieldVisibility = {},
  allUsers = [], onPatchUser, onSaveUserContact,
}) {
  const isNew = !!staff?.isNew;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(staff);
  const [linkedUserId, setLinkedUserId] = useState("");
  const [emailDraft, setEmailDraft] = useState({ userId: null, email: "", secondaryEmail: "" });
  useEffect(() => { setForm(staff); setEditing(isNew); setLinkedUserId(""); setEmailDraft({ userId: null, email: "", secondaryEmail: "" }); }, [staff]);
  // `form` is seeded from `staff` at mount time and only resynced by the effect above, which
  // runs AFTER this render commits. Since StaffModal stays mounted with staff=null until the
  // first click, the very first open of any session hits a render where `staff` is already the
  // clicked record but `form` is still the stale null from mount — guard both, not just `staff`,
  // or `form.name`/`form.campuses` below throw and take down the whole tree (blank screen).
  if (!staff || !form) return null;

  const show = (id) => fieldVisibility[id] !== false;

  // If this staff record has a real login account attached (any role, not just admin/owner),
  // surface it here so admins/owners can see their email and move them between staff/external
  // without a separate trip to Settings. Guarded on !isNew - a brand-new record's id is null,
  // same as every unlinked user's staffId, which would otherwise "match" the first one found.
  const linkedUser = !isNew ? allUsers.find(u => u.staffId === staff.id) : null;
  const contactDraft = linkedUser && emailDraft.userId === linkedUser.id ? emailDraft : { userId: linkedUser?.id, email: linkedUser?.email || "", secondaryEmail: linkedUser?.secondaryEmail || "" };
  const setContactDraft = (patch) => setEmailDraft({ ...contactDraft, ...patch });
  const contactDirty = linkedUser && (contactDraft.email !== linkedUser.email || contactDraft.secondaryEmail !== (linkedUser.secondaryEmail || ""));
  const saveContact = () => {
    const patch = {};
    if (contactDraft.email !== linkedUser.email) patch.email = contactDraft.email;
    if (contactDraft.secondaryEmail !== (linkedUser.secondaryEmail || "")) patch.secondaryEmail = contactDraft.secondaryEmail || null;
    onSaveUserContact(linkedUser, patch);
    setEmailDraft({ userId: null, email: "", secondaryEmail: "" });
  };

  const toggleCampus = (code) => setForm(f => ({ ...f, campuses: f.campuses.includes(code) ? f.campuses.filter(c => c !== code) : [...f.campuses, code] }));

  const handleLinkUser = (userId) => {
    setLinkedUserId(userId);
    const u = linkableUsers.find(u => u.id === userId);
    if (u) setForm(f => ({ ...f, name: u.name }));
  };

  const save = () => {
    if (isNew) {
      if (!form.name.trim() || (show("profession") && !form.profession.trim())) return;
      onCreate({ ...form, id: "s" + Date.now() }, linkedUserId || null);
    } else {
      onSave(form);
      setEditing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.5)" }} onClick={onClose}>
      <div className="whmi-card w-full max-w-md max-h-[85vh] overflow-y-auto whmi-scroll whmi-fade-in" onClick={e => e.stopPropagation()}>
        <div className="p-5 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-bold text-white shrink-0" style={{ background: "var(--accent-secondary)" }}>
            {(form.name || staff.name || "?").split(" ").filter(Boolean).map(n => n[0]).join("")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[15px] break-words">{isNew ? "New Staff Member" : staff.name}</div>
            <div className="text-[12px]" style={{ color: "var(--text-dim)" }}>{isNew ? "Add a record" : (show("profession") ? staff.profession : "")}</div>
          </div>
          <button onClick={onClose} className="whmi-btn-ghost !p-2 shrink-0"><X size={14} /></button>
        </div>

        {isNew && linkableUsers.length > 0 && (
          <div className="px-5 pt-4">
            <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Link to an existing admin/owner account (optional)</label>
            <select value={linkedUserId} onChange={e => handleLinkUser(e.target.value)} className="whmi-input w-full px-2.5 py-1.5 mt-1">
              <option value="">No account, standalone staff record</option>
              {linkableUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
          </div>
        )}

        {!isNew && (show("hours") || show("attended") || show("certificates")) && (
          <div className="p-5 grid grid-cols-3 gap-3">
            {show("hours") && <div className="whmi-card p-3 text-center"><div className="disp text-[18px] font-extrabold">{staff.hours}</div><div className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>CPD Hours</div></div>}
            {show("attended") && <div className="whmi-card p-3 text-center"><div className="disp text-[18px] font-extrabold">{staff.attended}</div><div className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>Attended</div></div>}
            {show("certificates") && <div className="whmi-card p-3 text-center"><div className="disp text-[18px] font-extrabold">{staff.certificates}</div><div className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>Certificates</div></div>}
          </div>
        )}

        {!isNew && canEdit && linkedUser && onSaveUserContact && (
          <div className="px-5 pb-5 space-y-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
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
              <input value={contactDraft.email} onChange={e => setContactDraft({ email: e.target.value })} className="whmi-input w-full px-2.5 py-1.5 mt-1 text-[12px]" />
            </div>
            <div>
              <label className="text-[10.5px] font-semibold" style={{ color: "var(--text-faint)" }}>Secondary email</label>
              <input value={contactDraft.secondaryEmail} onChange={e => setContactDraft({ secondaryEmail: e.target.value })} placeholder="jane.doe@othermail.com" className="whmi-input w-full px-2.5 py-1.5 mt-1 text-[12px]" />
            </div>
            {contactDirty && (
              <button onClick={saveContact} className="whmi-btn-primary w-full flex items-center justify-center gap-1.5 text-[12px]"><Save size={12} />Save Account Email</button>
            )}
          </div>
        )}

        <div className="px-5 pb-3 pt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-[12.5px]">Record Details</div>
            {canEdit && !isNew && !editing && <button onClick={() => setEditing(true)} className="whmi-btn-ghost !py-1 !px-2.5 text-[11.5px]">Edit</button>}
          </div>

          {!editing ? (
            <div className="space-y-2 text-[12.5px]">
              {show("qualifiedYear") && <div className="flex justify-between"><span style={{ color: "var(--text-faint)" }}>Qualified</span><span>{staff.qualifiedYear || "—"}</span></div>}
              {show("modality") && <div className="flex justify-between"><span style={{ color: "var(--text-faint)" }}>Modality</span><span>{staff.modality}</span></div>}
              {show("grade") && <div className="flex justify-between"><span style={{ color: "var(--text-faint)" }}>Grade</span><span>{staff.grade}</span></div>}
              {show("department") && <div className="flex justify-between"><span style={{ color: "var(--text-faint)" }}>Department</span><span>{staff.department || "—"}</span></div>}
              {show("campuses") && <div className="flex justify-between"><span style={{ color: "var(--text-faint)" }}>Campuses</span><span>{staff.campuses.join(", ") || "—"}</span></div>}
              {show("hoursLast3Years") && <div className="flex justify-between"><span style={{ color: "var(--text-faint)" }}>CPD Hours (Past 3 Years)</span><span>{staff.hoursLast3Years ?? "—"}</span></div>}
              {show("eventsThisYear") && <div className="flex justify-between"><span style={{ color: "var(--text-faint)" }}>Events This Year</span><span>{staff.eventsThisYear ?? "—"}</span></div>}
            </div>
          ) : (
            <div className="space-y-2.5">
              {isNew && (
                <>
                  <div>
                    <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Name</label>
                    <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} disabled={!!linkedUserId} className="whmi-input w-full px-2.5 py-1.5 mt-1" />
                  </div>
                  {show("profession") && (
                    <div>
                      <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Profession</label>
                      <input required value={form.profession} onChange={e => setForm(f => ({ ...f, profession: e.target.value }))} className="whmi-input w-full px-2.5 py-1.5 mt-1" />
                    </div>
                  )}
                  {show("department") && (
                    <div>
                      <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Department</label>
                      <input value={form.department || ""} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} className="whmi-input w-full px-2.5 py-1.5 mt-1" />
                    </div>
                  )}
                </>
              )}
              {show("qualifiedYear") && (
                <div>
                  <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Qualified Year</label>
                  <input type="number" value={form.qualifiedYear || ""} onChange={e => setForm(f => ({ ...f, qualifiedYear: e.target.value ? Number(e.target.value) : null }))} className="whmi-input w-full px-2.5 py-1.5 mt-1" />
                </div>
              )}
              {show("modality") && (
                <div>
                  <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Modality</label>
                  <select value={form.modality} onChange={e => setForm(f => ({ ...f, modality: e.target.value }))} className="whmi-input w-full px-2.5 py-1.5 mt-1">
                    {MODALITY_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              )}
              {show("grade") && (
                <div>
                  <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Grade</label>
                  <select value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} className="whmi-input w-full px-2.5 py-1.5 mt-1">
                    {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              )}
              {show("campuses") && (
                <div>
                  <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Campuses</label>
                  <div className="flex gap-1.5 flex-wrap mt-1">
                    {CAMPUS_OPTIONS.map(c => (
                      <button key={c.code} type="button" onClick={() => toggleCampus(c.code)} className="whmi-badge" style={{ background: form.campuses.includes(c.code) ? "var(--accent-primary)" : "var(--surface-2)", color: form.campuses.includes(c.code) ? "white" : "var(--text-dim)" }}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button onClick={save} className="whmi-btn-primary flex-1 flex items-center justify-center gap-1.5"><Save size={13} />{isNew ? "Add Staff" : "Save"}</button>
                <button onClick={() => { if (isNew) { onClose(); } else { setForm(staff); setEditing(false); } }} className="whmi-btn-ghost flex-1">Cancel</button>
              </div>
              {canEdit && !isNew && onRequestDelete && (
                <button onClick={() => onRequestDelete(staff)} className="whmi-btn-ghost w-full flex items-center justify-center gap-1.5 mt-2" style={{ color: "#D9534F" }}>
                  <Trash2 size={13} />Delete Staff Record
                </button>
              )}
            </div>
          )}
        </div>

        {!isNew && (
          <div className="px-5 pb-5">
            <button className="whmi-btn-ghost w-full flex items-center justify-center gap-1.5"><Download size={14} />Download Certificate History</button>
          </div>
        )}
      </div>
    </div>
  );
}
