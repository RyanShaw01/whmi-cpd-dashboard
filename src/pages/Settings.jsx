import { useState, useEffect } from "react";
import { Sun, Moon, ArrowUp, ArrowDown, Shield, Trash2, UserPlus, BellOff, Save, UserCircle2, History, Sparkles, ChevronDown, ChevronRight, BadgeCheck, Ban, RotateCcw, Award, Plus, Pencil, Eye } from "lucide-react";
import CharacterAvatar from "../components/CharacterAvatar";
import AvatarPicker from "../components/AvatarPicker";
import { BRAND_HEX, CHARACTERS, DASHBOARD_SECTIONS } from "../data/mockData";
import { fetchAuditLog } from "../lib/db";

const ACTION_LABELS = {
  "user.login": "Logged in",
  "user.updated": "Updated a user",
  "event.created": "Created an event",
  "event.updated": "Edited an event",
  "event.status_changed": "Changed event status",
  "event.deleted": "Deleted an event",
  "registration.updated": "Updated a registration",
  "registration.attendance_changed": "Changed attendance status",
  "registration.deleted": "Deleted a registration",
  "certificate.approved": "Approved a certificate",
  "certificate.deleted": "Deleted a certificate",
  "file.uploaded": "Uploaded a file",
  "file.deleted": "Deleted a file",
};

function relativeTime(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function Settings({
  dark, setDark, role, session, onProfileSave, users, onUsersChange, colorPrefs, onColorChange, layoutOrder, onLayoutChange, onRequestDelete,
  redDotsEnabled, onToggleRedDots, onReplayTour, onRevokeSession, cpdTypes = [], onSaveCpdType, onDeleteCpdType,
  previewSession, onPreviewAs, onCreateTestAccount, onSaveUserContact,
}) {
  const [toggles, setToggles] = useState({ emailReminders: true, autoWaitlist: true, autoApproveCerts: false, weeklyDigest: true });
  const [devMode, setDevMode] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [profileName, setProfileName] = useState(session?.name || "");
  const [profileAvatarId, setProfileAvatarId] = useState(session?.avatarId || CHARACTERS[0].id);
  const [profileAvatarColor, setProfileAvatarColor] = useState(session?.avatarColor || "blue");
  const canManageUsers = role === "admin" || role === "owner";
  const [auditLog, setAuditLog] = useState([]);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [sessionActionStatus, setSessionActionStatus] = useState({});
  const [editingCpdTypeId, setEditingCpdTypeId] = useState(null); // null | "new" | <id>
  const [cpdTypeName, setCpdTypeName] = useState("");
  const [cpdTypeCode, setCpdTypeCode] = useState("");
  const [emailDrafts, setEmailDrafts] = useState({}); // { [userId]: { email, secondaryEmail } }

  const visibleUsers = users.filter(u => !u.isTest);
  const testAccounts = users.filter(u => u.isTest);

  const startAddCpdType = () => { setEditingCpdTypeId("new"); setCpdTypeName(""); setCpdTypeCode(""); };
  const startEditCpdType = (t) => { setEditingCpdTypeId(t.id); setCpdTypeName(t.name); setCpdTypeCode(t.appellationCode); };
  const cancelCpdTypeEdit = () => setEditingCpdTypeId(null);
  const saveCpdType = () => {
    if (!cpdTypeName.trim() || !cpdTypeCode.trim()) return;
    const isNew = editingCpdTypeId === "new";
    const cpdType = { id: isNew ? "cpd" + Date.now() : editingCpdTypeId, name: cpdTypeName.trim(), appellationCode: cpdTypeCode.trim() };
    onSaveCpdType(cpdType, isNew);
    setEditingCpdTypeId(null);
  };

  useEffect(() => {
    if (canManageUsers) fetchAuditLog(50).then(setAuditLog);
  }, [canManageUsers]);

  useEffect(() => {
    setProfileName(session?.name || "");
    setProfileAvatarId(session?.avatarId || CHARACTERS[0].id);
    setProfileAvatarColor(session?.avatarColor || "blue");
  }, [session]);

  const t = (k, label, desc) => (
    <div className="flex items-center justify-between p-4 gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="min-w-0">
        <div className="font-semibold text-[13px]">{label}</div>
        <div className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>{desc}</div>
      </div>
      <button onClick={() => setToggles(s => ({ ...s, [k]: !s[k] }))} className="w-10 h-6 rounded-full relative transition shrink-0" style={{ background: toggles[k] ? "var(--accent-success)" : "var(--surface-2)", border: "1px solid var(--border)" }}>
        <span className="absolute top-0.5 rounded-full bg-white transition" style={{ left: toggles[k] ? "20px" : "3px", width: 18, height: 18 }} />
      </button>
    </div>
  );

  const moveSection = (idx, dir) => {
    const newOrder = [...layoutOrder];
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= newOrder.length) return;
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    onLayoutChange(newOrder);
  };

  const addUser = () => {
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    const brandColors = Object.keys(BRAND_HEX);
    const isWh = inviteEmail.trim().toLowerCase().endsWith("@wh.org.au");
    const newUser = {
      id: "u" + Date.now(), name: inviteName.trim(), email: inviteEmail.trim(), role: inviteRole, staffId: null,
      avatarId: CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)].id, avatarColor: brandColors[Math.floor(Math.random() * brandColors.length)],
      userType: isWh ? "internal" : "external", verified: isWh, onboarded: false,
    };
    onUsersChange([...users, newUser]);
    setInviteName(""); setInviteEmail("");
  };

  const patchUser = (id, patch) => onUsersChange(users.map(x => x.id === id ? { ...x, ...patch } : x));

  const doRevoke = async (u, action) => {
    setSessionActionStatus(s => ({ ...s, [u.id]: "working" }));
    const result = await onRevokeSession(u, action);
    setSessionActionStatus(s => ({ ...s, [u.id]: result.ok ? (action === "restore" ? "restored" : "revoked") : "error" }));
  };

  return (
    <div className="whmi-fade-in p-6 max-w-[900px] mx-auto space-y-5">
      <div>
        <h1 className="disp text-[22px] font-extrabold">Settings</h1>
        <p className="text-[13px]" style={{ color: "var(--text-dim)" }}>Preferences for your WHMI Education Team account.</p>
      </div>

      <div className="whmi-card p-4">
        <div className="flex items-center gap-2 mb-3"><UserCircle2 size={15} style={{ color: "var(--accent-primary)" }} /><div className="font-semibold text-[13px]">Your Profile</div></div>
        <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Display name</label>
        <input value={profileName} onChange={e => setProfileName(e.target.value)} className="whmi-input w-full px-2.5 py-1.5 mt-1 mb-3" />
        <AvatarPicker
          avatarId={profileAvatarId} avatarColor={profileAvatarColor}
          onChangeAvatar={id => { setProfileAvatarId(id); onProfileSave({ avatarId: id, avatarColor: profileAvatarColor }); }}
          onChangeColor={color => { setProfileAvatarColor(color); onProfileSave({ avatarId: profileAvatarId, avatarColor: color }); }}
        />
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onProfileSave({ name: profileName, avatarId: profileAvatarId, avatarColor: profileAvatarColor })}
            disabled={profileName === (session?.name || "")}
            className="whmi-btn-primary flex items-center justify-center gap-1.5"
          >
            <Save size={13} />Save Profile
          </button>
          <button onClick={onReplayTour} className="whmi-btn-ghost flex items-center justify-center gap-1.5">
            <Sparkles size={13} />Replay Onboarding Tour
          </button>
        </div>
      </div>

      <div className="whmi-card p-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="font-semibold text-[13px]">Appearance</div>
          <div className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>Switch between light and dark mode</div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setDark(false)} className={!dark ? "whmi-btn-primary flex items-center gap-1.5" : "whmi-btn-ghost flex items-center gap-1.5"}><Sun size={14} />Light</button>
          <button onClick={() => setDark(true)} className={dark ? "whmi-btn-primary flex items-center gap-1.5" : "whmi-btn-ghost flex items-center gap-1.5"}><Moon size={14} />Dark</button>
        </div>
      </div>

      <div className="whmi-card p-4 space-y-3">
        <div>
          <div className="font-semibold text-[13px] mb-1">Brand Colours</div>
          <div className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>Choose which Western Health brand colour is used for icons and highlighted sections.</div>
        </div>
        {[["primary", "Primary accent"], ["secondary", "Secondary accent"], ["success", "Positive / success"]].map(([key, label]) => (
          <div key={key} className="flex items-center justify-between gap-3">
            <span className="text-[12.5px] font-semibold">{label}</span>
            <div className="flex gap-2">
              {Object.entries(BRAND_HEX).map(([name, hex]) => (
                <button key={name} onClick={() => onColorChange({ ...colorPrefs, [key]: name })} title={name} className="w-7 h-7 rounded-full" style={{ background: hex, outline: colorPrefs[key] === name ? "2px solid var(--text)" : "1px solid var(--border)", outlineOffset: 2 }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="whmi-card p-4">
        <div className="font-semibold text-[13px] mb-1">Dashboard Layout</div>
        <div className="text-[11.5px] mb-3" style={{ color: "var(--text-faint)" }}>Reorder your dashboard sections, saved automatically.</div>
        <div className="space-y-1.5">
          {layoutOrder.map((id, idx) => {
            const sec = DASHBOARD_SECTIONS.find(s => s.id === id);
            if (!sec) return null;
            return (
              <div key={id} className="flex items-center justify-between p-2.5 rounded-lg gap-2" style={{ background: "var(--surface-2)" }}>
                <span className="text-[12.5px] font-semibold">{sec.label}</span>
                <div className="flex gap-1">
                  <button onClick={() => moveSection(idx, -1)} disabled={idx === 0} className="whmi-btn-ghost !p-1.5" style={{ opacity: idx === 0 ? 0.4 : 1 }}><ArrowUp size={13} /></button>
                  <button onClick={() => moveSection(idx, 1)} disabled={idx === layoutOrder.length - 1} className="whmi-btn-ghost !p-1.5" style={{ opacity: idx === layoutOrder.length - 1 ? 0.4 : 1 }}><ArrowDown size={13} /></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="whmi-card overflow-hidden">
        {t("emailReminders", "Automated Email Reminders", "One-week, one-day, and one-hour reminders before events")}
        {t("autoWaitlist", "Automatic Waitlist Promotion", "Move waitlisted staff to confirmed when a place opens")}
        {t("autoApproveCerts", "Auto-approve Certificates", "Skip manual approval once reflection is confirmed")}
        {t("weeklyDigest", "Weekly Digest", "Summary email of CPD activity every Monday")}
      </div>

      {canManageUsers && (
        <div className="whmi-card p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <BellOff size={15} style={{ color: "var(--accent-primary)" }} className="shrink-0" />
            <div className="min-w-0">
              <div className="font-semibold text-[13px]">Red Dot Notifications</div>
              <div className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>Show red dot badges on the sidebar and event/certificate rows that need action.</div>
            </div>
          </div>
          <button onClick={onToggleRedDots} className="w-10 h-6 rounded-full relative transition shrink-0" style={{ background: redDotsEnabled ? "var(--accent-success)" : "var(--surface-2)", border: "1px solid var(--border)" }}>
            <span className="absolute top-0.5 rounded-full bg-white transition" style={{ left: redDotsEnabled ? "20px" : "3px", width: 18, height: 18 }} />
          </button>
        </div>
      )}

      {canManageUsers && (
        <div className="whmi-card p-4">
          <div className="flex items-center gap-2 mb-1"><Shield size={15} style={{ color: "var(--accent-primary)" }} /><div className="font-semibold text-[13px]">Team Access</div></div>
          <div className="text-[11.5px] mb-3" style={{ color: "var(--text-faint)" }}>Admins have full rights. Owners can do everything except change code. Viewers can only see their own certificates and CPD history.</div>
          <div className="space-y-1.5 mb-3">
            {visibleUsers.map(u => {
              const expanded = expandedUserId === u.id;
              const status = sessionActionStatus[u.id];
              const banned = status === "revoked";
              const draft = emailDrafts[u.id] || { email: u.email, secondaryEmail: u.secondaryEmail || "" };
              const setDraft = (patch) => setEmailDrafts(s => ({ ...s, [u.id]: { ...draft, ...patch } }));
              const emailDirty = draft.email !== u.email || draft.secondaryEmail !== (u.secondaryEmail || "");
              const saveContact = () => {
                const patch = {};
                if (draft.email !== u.email) patch.email = draft.email;
                if (draft.secondaryEmail !== (u.secondaryEmail || "")) patch.secondaryEmail = draft.secondaryEmail || null;
                onSaveUserContact(u, patch);
                setEmailDrafts(s => { const next = { ...s }; delete next[u.id]; return next; });
              };
              return (
                <div key={u.id} className="rounded-lg overflow-hidden" style={{ background: "var(--surface-2)" }}>
                  <div className="flex items-center justify-between p-2.5 gap-2 flex-wrap">
                    <button onClick={() => setExpandedUserId(expanded ? null : u.id)} className="flex items-center gap-2.5 min-w-0 flex-1 text-left">
                      {expanded ? <ChevronDown size={13} style={{ color: "var(--text-faint)" }} className="shrink-0" /> : <ChevronRight size={13} style={{ color: "var(--text-faint)" }} className="shrink-0" />}
                      <CharacterAvatar avatarId={u.avatarId} color={u.avatarColor} size={28} />
                      <div className="min-w-0">
                        <div className="text-[12.5px] font-semibold truncate flex items-center gap-1">
                          {u.name}
                          {u.userType === "external" && <span className="whmi-badge" style={{ background: "rgba(217,83,79,.12)", color: "#D9534F" }}>External</span>}
                          {u.verified && <BadgeCheck size={12} style={{ color: "var(--accent-success)" }} title="Verified" />}
                        </div>
                        <div className="text-[10.5px] truncate" style={{ color: "var(--text-faint)" }}>{u.email}</div>
                      </div>
                    </button>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <select value={u.role} onChange={e => patchUser(u.id, { role: e.target.value })} className="whmi-input px-2 py-1 text-[11.5px]">
                        <option value="admin">Admin</option>
                        <option value="owner">Owner</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button onClick={() => onRequestDelete(u)} className="whmi-btn-ghost !p-1.5" style={{ color: "#D9534F" }}><Trash2 size={13} /></button>
                    </div>
                  </div>

                  {expanded && (
                    <div className="p-3 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10.5px] font-semibold" style={{ color: "var(--text-faint)" }}>Account type</label>
                          <select value={u.userType || "internal"} onChange={e => patchUser(u.id, { userType: e.target.value })} className="whmi-input w-full px-2 py-1 mt-1 text-[12px]">
                            <option value="internal">Internal (Western Health staff)</option>
                            <option value="external">External</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10.5px] font-semibold" style={{ color: "var(--text-faint)" }}>Verified</label>
                          <button onClick={() => patchUser(u.id, { verified: !u.verified })} className="w-full mt-1 whmi-btn-ghost flex items-center justify-center gap-1.5 text-[12px]" style={u.verified ? { background: "rgba(156,203,59,.15)", color: "#7CA82F", border: "1px solid rgba(156,203,59,.4)" } : {}}>
                            <BadgeCheck size={13} />{u.verified ? "Verified" : "Not verified"}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10.5px] font-semibold" style={{ color: "var(--text-faint)" }}>Primary email</label>
                          <input
                            value={draft.email} onChange={e => setDraft({ email: e.target.value })}
                            className="whmi-input w-full px-2.5 py-1.5 mt-1 text-[12px]"
                          />
                        </div>
                        <div>
                          <label className="text-[10.5px] font-semibold" style={{ color: "var(--text-faint)" }}>Secondary email (login &amp; certificate delivery)</label>
                          <input
                            value={draft.secondaryEmail} placeholder="jane.doe@othermail.com"
                            onChange={e => setDraft({ secondaryEmail: e.target.value })}
                            className="whmi-input w-full px-2.5 py-1.5 mt-1 text-[12px]"
                          />
                        </div>
                      </div>
                      {u.secondaryEmail && (
                        <div className="flex items-center gap-3">
                          <span className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>Send certificates to:</span>
                          <label className="flex items-center gap-1 text-[11px]"><input type="radio" checked={(u.certEmailPreference || "primary") === "primary"} onChange={() => patchUser(u.id, { certEmailPreference: "primary" })} />Primary</label>
                          <label className="flex items-center gap-1 text-[11px]"><input type="radio" checked={u.certEmailPreference === "secondary"} onChange={() => patchUser(u.id, { certEmailPreference: "secondary" })} />Secondary</label>
                        </div>
                      )}
                      {emailDirty && (
                        <div className="flex justify-end">
                          <button onClick={saveContact} className="whmi-btn-primary text-[11.5px] flex items-center gap-1.5"><Save size={12} />Save Contact Details</button>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>
                          {u.authId ? "This account has signed in for real at least once." : "This account hasn't completed a real login yet; nothing to revoke."}
                        </span>
                        {u.authId && (
                          banned ? (
                            <button onClick={() => doRevoke(u, "restore")} disabled={status === "working"} className="whmi-btn-ghost flex items-center gap-1.5 text-[11.5px]">
                              <RotateCcw size={13} />{status === "working" ? "Restoring…" : "Restore Access"}
                            </button>
                          ) : (
                            <button onClick={() => doRevoke(u, "revoke")} disabled={status === "working"} className="whmi-btn-ghost flex items-center gap-1.5 text-[11.5px]" style={{ color: "#D9534F" }}>
                              <Ban size={13} />{status === "working" ? "Revoking…" : "Revoke Session"}
                            </button>
                          )
                        )}
                      </div>
                      {status === "error" && <div className="text-[11px] font-semibold" style={{ color: "#D9534F" }}>Something went wrong. Please try again.</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <input placeholder="Name" value={inviteName} onChange={e => setInviteName(e.target.value)} className="whmi-input px-2.5 py-1.5 flex-1 min-w-[100px]" />
            <input placeholder="Email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="whmi-input px-2.5 py-1.5 flex-1 min-w-[140px]" />
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="whmi-input px-2 py-1.5">
              <option value="viewer">Viewer</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
            </select>
            <button onClick={addUser} className="whmi-btn-primary flex items-center gap-1.5"><UserPlus size={13} />Add</button>
          </div>
        </div>
      )}

      {canManageUsers && (
        <div className="whmi-card p-4">
          <div className="flex items-center gap-2 mb-1"><Eye size={15} style={{ color: "var(--accent-primary)" }} /><div className="font-semibold text-[13px]">Preview As</div></div>
          <div className="text-[11.5px] mb-3" style={{ color: "var(--text-faint)" }}>See the app as a staff (internal) or external viewer would, without logging out. Test accounts are hidden from Team Access above.</div>
          <div className="space-y-1.5 mb-3">
            {testAccounts.map(t => (
              <div key={t.id} className="flex items-center justify-between p-2.5 rounded-lg gap-2" style={{ background: "var(--surface-2)" }}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <CharacterAvatar avatarId={t.avatarId} color={t.avatarColor} size={28} />
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-semibold truncate">{t.name}</div>
                    <div className="text-[10.5px] truncate" style={{ color: "var(--text-faint)" }}>{t.userType === "external" ? "External viewer" : "Internal viewer"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {previewSession?.id === t.id ? (
                    <button onClick={() => onPreviewAs(null)} className="whmi-btn-ghost text-[11.5px]">Exit preview</button>
                  ) : (
                    <button onClick={() => onPreviewAs(t)} className="whmi-btn-primary text-[11.5px] flex items-center gap-1.5"><Eye size={12} />Preview</button>
                  )}
                  <button onClick={() => onRequestDelete(t)} className="whmi-btn-ghost !p-1.5" style={{ color: "#D9534F" }}><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
            {testAccounts.length === 0 && <div className="text-[12px]" style={{ color: "var(--text-faint)" }}>No test accounts yet.</div>}
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => onCreateTestAccount("internal")} className="whmi-btn-ghost flex items-center gap-1.5 text-[11.5px]"><Plus size={12} />Test Staff Account</button>
            <button onClick={() => onCreateTestAccount("external")} className="whmi-btn-ghost flex items-center gap-1.5 text-[11.5px]"><Plus size={12} />Test External Account</button>
          </div>
        </div>
      )}

      {canManageUsers && (
        <div className="whmi-card p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2"><Award size={15} style={{ color: "var(--accent-primary)" }} /><div className="font-semibold text-[13px]">CPD Types &amp; Appellation Codes</div></div>
            {editingCpdTypeId === null && (
              <button onClick={startAddCpdType} className="whmi-btn-ghost flex items-center gap-1.5 text-[11.5px]"><Plus size={13} />Add Type</button>
            )}
          </div>
          <div className="text-[11.5px] mb-3" style={{ color: "var(--text-faint)" }}>Used on the event form to select which ASMIRT-endorsed certificate applies. Adding, editing, and deleting is restricted to admins and owners, and asks for confirmation.</div>

          <div className="space-y-1.5">
            {cpdTypes.map(t => (
              editingCpdTypeId === t.id ? (
                <div key={t.id} className="p-2.5 rounded-lg space-y-2" style={{ background: "var(--surface-2)" }}>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input value={cpdTypeName} onChange={e => setCpdTypeName(e.target.value)} placeholder="CPD type name" className="whmi-input px-2.5 py-1.5 text-[12px]" />
                    <input value={cpdTypeCode} onChange={e => setCpdTypeCode(e.target.value)} placeholder="Appellation code" className="whmi-input px-2.5 py-1.5 text-[12px]" />
                  </div>
                  <div className="flex gap-1.5 justify-end">
                    <button onClick={cancelCpdTypeEdit} className="whmi-btn-ghost text-[11.5px]">Cancel</button>
                    <button onClick={saveCpdType} className="whmi-btn-primary text-[11.5px] flex items-center gap-1.5"><Save size={12} />Save</button>
                  </div>
                </div>
              ) : (
                <div key={t.id} className="flex items-center justify-between p-2.5 rounded-lg gap-2" style={{ background: "var(--surface-2)" }}>
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-semibold truncate">{t.name}</div>
                    <div className="text-[10.5px] truncate" style={{ color: "var(--text-faint)" }}>{t.appellationCode}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => startEditCpdType(t)} className="whmi-btn-ghost !p-1.5"><Pencil size={13} /></button>
                    <button onClick={() => onDeleteCpdType(t)} className="whmi-btn-ghost !p-1.5" style={{ color: "#D9534F" }}><Trash2 size={13} /></button>
                  </div>
                </div>
              )
            ))}
            {cpdTypes.length === 0 && editingCpdTypeId !== "new" && <div className="text-[12px]" style={{ color: "var(--text-faint)" }}>No CPD types added yet.</div>}
            {editingCpdTypeId === "new" && (
              <div className="p-2.5 rounded-lg space-y-2" style={{ background: "var(--surface-2)" }}>
                <div className="grid grid-cols-2 gap-1.5">
                  <input autoFocus value={cpdTypeName} onChange={e => setCpdTypeName(e.target.value)} placeholder="CPD type name" className="whmi-input px-2.5 py-1.5 text-[12px]" />
                  <input value={cpdTypeCode} onChange={e => setCpdTypeCode(e.target.value)} placeholder="Appellation code" className="whmi-input px-2.5 py-1.5 text-[12px]" />
                </div>
                <div className="flex gap-1.5 justify-end">
                  <button onClick={cancelCpdTypeEdit} className="whmi-btn-ghost text-[11.5px]">Cancel</button>
                  <button onClick={saveCpdType} className="whmi-btn-primary text-[11.5px] flex items-center gap-1.5"><Save size={12} />Add</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {canManageUsers && (
        <div className="whmi-card p-4">
          <div className="flex items-center gap-2 mb-1"><History size={15} style={{ color: "var(--accent-primary)" }} /><div className="font-semibold text-[13px]">Audit Log</div></div>
          <div className="text-[11.5px] mb-3" style={{ color: "var(--text-faint)" }}>Recent event, registration, certificate, file, and account activity, last 50 entries.</div>
          {auditLog.length === 0 && <div className="text-[12px]" style={{ color: "var(--text-faint)" }}>No activity recorded yet.</div>}
          <div className="space-y-1 max-h-80 overflow-y-auto whmi-scroll">
            {auditLog.map(a => {
              const actor = users.find(u => u.id === a.actorId);
              return (
                <div key={a.id} className="flex items-center justify-between gap-2 p-2 rounded-lg text-[12px]" style={{ background: "var(--surface-2)" }}>
                  <div className="min-w-0">
                    <span className="font-semibold">{actor?.name || "Unknown"}</span>
                    <span style={{ color: "var(--text-faint)" }}>, {ACTION_LABELS[a.action] || a.action}</span>
                  </div>
                  <span className="text-[10.5px] shrink-0" style={{ color: "var(--text-faint)" }}>{relativeTime(a.createdAt)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="whmi-card p-4 flex items-center justify-between gap-3">
        <div>
          <div className="font-semibold text-[13px]">Developer Mode</div>
          <div className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>{role === "admin" ? "Admin-only access to code-level configuration." : "Admins only, owners cannot change code."}</div>
        </div>
        <button onClick={() => role === "admin" && setDevMode(d => !d)} disabled={role !== "admin"} className="w-10 h-6 rounded-full relative transition shrink-0" style={{ background: devMode ? "var(--accent-success)" : "var(--surface-2)", border: "1px solid var(--border)", opacity: role === "admin" ? 1 : 0.5, cursor: role === "admin" ? "pointer" : "not-allowed" }}>
          <span className="absolute top-0.5 rounded-full bg-white transition" style={{ left: devMode ? "20px" : "3px", width: 18, height: 18 }} />
        </button>
      </div>

      <div className="whmi-card p-4">
        <div className="font-semibold text-[13px] mb-1">Role</div>
        <div className="text-[12.5px] capitalize" style={{ color: "var(--text-dim)" }}>{role} · {role === "admin" ? "Full access to all functions" : role === "owner" ? "Full access except code-level changes" : "Can view own certificates and CPD only"}</div>
      </div>
    </div>
  );
}
