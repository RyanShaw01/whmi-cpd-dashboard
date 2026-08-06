import { useState, useEffect } from "react";
import { Sun, Moon, MoonStar, ArrowUp, ArrowDown, Shield, Trash2, UserPlus, BellOff, Save, UserCircle2, History, Sparkles, ChevronDown, ChevronRight, BadgeCheck, Ban, RotateCcw, Award, Plus, Pencil, Eye, Image, Palette, Upload, Users, SlidersHorizontal } from "lucide-react";
import CharacterAvatar from "../components/CharacterAvatar";
import AvatarPicker from "../components/AvatarPicker";
import AddMemberModal from "../components/AddMemberModal";
import { getSeparateWhDefault, setSeparateWhDefault } from "./Reflection";
import { BRAND_HEX, CHARACTERS, DASHBOARD_SECTIONS, STAFF_FIELD_DEFS } from "../data/mockData";
import { relativeTime, ACTION_LABELS } from "../lib/helpers";

const CPD_CATEGORIES = [
  "Audit & QA", "Skill Development/ Workplace Learning", "Skill Development",
  "Professional Activity/ Organised Program", "Organised Program", "Self-Directed Learning",
];

// Admin/owner Settings has grown into a long list of cards; this groups related ones under a
// single collapsible section (collapsed by default) so the page reads as a handful of
// categories instead of a wall of cards. Purely a display wrapper — none of the cards inside
// change their own behaviour.
function SettingsGroup({ title, description, icon: Icon, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between gap-3 py-2.5 px-3 -mx-1 rounded-xl whmi-row-hover transition text-left" style={{ border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2.5 min-w-0">
          {open ? <ChevronDown size={14} style={{ color: "var(--text-faint)" }} className="shrink-0" /> : <ChevronRight size={14} style={{ color: "var(--text-faint)" }} className="shrink-0" />}
          {Icon && <Icon size={16} style={{ color: "var(--accent-primary)" }} className="shrink-0" />}
          <div className="min-w-0">
            <div className="font-bold text-[13.5px]">{title}</div>
            {description && <div className="text-[11px] truncate" style={{ color: "var(--text-faint)" }}>{description}</div>}
          </div>
        </div>
      </button>
      {open && <div className="mt-3 space-y-3">{children}</div>}
    </div>
  );
}

export default function Settings({
  theme, setTheme, mainTheme, setMainTheme, cardTheme, setCardTheme, role, session, onProfileSave, showToast, users, onUsersChange, colorPrefs, onColorChange, layoutOrder, onLayoutChange, onRequestDelete,
  redDotsEnabled, onToggleRedDots, onReplayTour, onRevokeSession, cpdTypes = [], onSaveCpdType, onDeleteCpdType, onReorderCpdTypes,
  previewSession, onPreviewAs, onCreateTestAccount, onSaveUserContact,
  tags = [], onSaveTag, onDeleteTag, onReorderTags, onBackfillStaffLinks, auditLog = [],
  avatarIcons = [], onSaveAvatarIcon, onDeleteAvatarIcon, onReorderAvatarIcons, onUploadAvatarIconImage,
  avatarColors = [], onSaveAvatarColor, onDeleteAvatarColor, onReorderAvatarColors,
  staffFieldVisibility = {}, onToggleStaffField,
}) {
  const [toggles, setToggles] = useState({ emailReminders: true, autoWaitlist: true, autoApproveCerts: false, weeklyDigest: true });
  const [devMode, setDevMode] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [staffFieldsExpanded, setStaffFieldsExpanded] = useState(false);
  const [separateWhReflections, setSeparateWhReflectionsState] = useState(getSeparateWhDefault);
  const toggleSeparateWhReflections = () => {
    const next = !separateWhReflections;
    setSeparateWhReflectionsState(next);
    setSeparateWhDefault(next);
  };
  const [profileName, setProfileName] = useState(session?.name || "");
  const [profileAvatarId, setProfileAvatarId] = useState(session?.avatarId || CHARACTERS[0].id);
  const [profileAvatarColor, setProfileAvatarColor] = useState(session?.avatarColor || "blue");
  const canManageUsers = role === "admin" || role === "owner";
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [editingTagId, setEditingTagId] = useState(null); // null | "new" | <id>
  const [tagName, setTagName] = useState("");
  const [tagError, setTagError] = useState("");

  const startAddTag = () => { setEditingTagId("new"); setTagName(""); setTagError(""); };
  const startEditTag = (t) => { setEditingTagId(t.id); setTagName(t.name); setTagError(""); };
  const cancelTagEdit = () => { setEditingTagId(null); setTagError(""); };
  const saveTag = () => {
    if (!tagName.trim()) { setTagError("Please enter a tag name."); return; }
    const isNew = editingTagId === "new";
    onSaveTag({ id: isNew ? "tag" + Date.now() : editingTagId, name: tagName.trim(), sortOrder: isNew ? tags.length : tags.find(t => t.id === editingTagId)?.sortOrder ?? 0 }, isNew);
    setEditingTagId(null);
    setTagError("");
  };
  const moveTag = (index, dir) => {
    const next = [...tags];
    const swapWith = index + dir;
    if (swapWith < 0 || swapWith >= next.length) return;
    [next[index], next[swapWith]] = [next[swapWith], next[index]];
    onReorderTags(next);
  };
  const alphabetizeTags = () => onReorderTags([...tags].sort((a, b) => a.name.localeCompare(b.name)));

  const [avatarIconsExpanded, setAvatarIconsExpanded] = useState(false);
  const [editingAvatarIconId, setEditingAvatarIconId] = useState(null); // null | "new" | <id>
  const [avatarIconLabel, setAvatarIconLabel] = useState("");
  const [avatarIconScale, setAvatarIconScale] = useState(55);
  const [avatarIconFile, setAvatarIconFile] = useState(null);
  const [avatarIconError, setAvatarIconError] = useState("");
  const [avatarIconUploading, setAvatarIconUploading] = useState(false);
  const [avatarIconFilePreviewUrl, setAvatarIconFilePreviewUrl] = useState(null);

  useEffect(() => {
    if (!avatarIconFile) { setAvatarIconFilePreviewUrl(null); return; }
    const url = URL.createObjectURL(avatarIconFile);
    setAvatarIconFilePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarIconFile]);

  const startAddAvatarIcon = () => { setEditingAvatarIconId("new"); setAvatarIconLabel(""); setAvatarIconScale(55); setAvatarIconFile(null); setAvatarIconError(""); };
  const startEditAvatarIcon = (icon) => { setEditingAvatarIconId(icon.id); setAvatarIconLabel(icon.label); setAvatarIconScale(icon.iconScale); setAvatarIconFile(null); setAvatarIconError(""); };
  const cancelAvatarIconEdit = () => { setEditingAvatarIconId(null); setAvatarIconError(""); };
  const saveAvatarIcon = async () => {
    if (!avatarIconLabel.trim()) { setAvatarIconError("Please add a label."); return; }
    const isNew = editingAvatarIconId === "new";
    if (isNew && !avatarIconFile) { setAvatarIconError("Please choose a PNG image."); return; }
    const existing = !isNew ? avatarIcons.find(i => i.id === editingAvatarIconId) : null;
    let imagePath = existing?.imagePath || null;
    let kind = existing?.kind || "image";
    let iconKey = existing?.iconKey || null;
    if (avatarIconFile) {
      setAvatarIconUploading(true);
      const uploaded = await onUploadAvatarIconImage(avatarIconFile);
      setAvatarIconUploading(false);
      if (!uploaded) { setAvatarIconError("Upload failed, please try again."); return; }
      imagePath = uploaded; kind = "image"; iconKey = null;
    }
    const icon = { id: isNew ? "avicon" + Date.now() : editingAvatarIconId, kind, iconKey, imagePath, label: avatarIconLabel.trim(), iconScale: avatarIconScale };
    onSaveAvatarIcon(icon, isNew);
    setEditingAvatarIconId(null);
    setAvatarIconError("");
  };
  const moveAvatarIcon = (index, dir) => {
    const next = [...avatarIcons];
    const swapWith = index + dir;
    if (swapWith < 0 || swapWith >= next.length) return;
    [next[index], next[swapWith]] = [next[swapWith], next[index]];
    onReorderAvatarIcons(next);
  };

  const [avatarColorsExpanded, setAvatarColorsExpanded] = useState(false);
  const [editingAvatarColorId, setEditingAvatarColorId] = useState(null); // null | "new" | <id>
  const [avatarColorName, setAvatarColorName] = useState("");
  const [avatarColorHex, setAvatarColorHex] = useState("#35A8DD");
  const [avatarColorError, setAvatarColorError] = useState("");

  const startAddAvatarColor = () => { setEditingAvatarColorId("new"); setAvatarColorName(""); setAvatarColorHex("#35A8DD"); setAvatarColorError(""); };
  const startEditAvatarColor = (c) => { setEditingAvatarColorId(c.id); setAvatarColorName(c.name); setAvatarColorHex(c.hex); setAvatarColorError(""); };
  const cancelAvatarColorEdit = () => { setEditingAvatarColorId(null); setAvatarColorError(""); };
  const saveAvatarColor = () => {
    if (!avatarColorName.trim() || !avatarColorHex.trim()) { setAvatarColorError("Please add both a name and a colour."); return; }
    const isNew = editingAvatarColorId === "new";
    const color = { id: isNew ? "avcolor" + Date.now() : editingAvatarColorId, name: avatarColorName.trim(), hex: avatarColorHex.trim() };
    onSaveAvatarColor(color, isNew);
    setEditingAvatarColorId(null);
    setAvatarColorError("");
  };
  const moveAvatarColor = (index, dir) => {
    const next = [...avatarColors];
    const swapWith = index + dir;
    if (swapWith < 0 || swapWith >= next.length) return;
    [next[index], next[swapWith]] = [next[swapWith], next[index]];
    onReorderAvatarColors(next);
  };
  const [auditLogExpanded, setAuditLogExpanded] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [sessionActionStatus, setSessionActionStatus] = useState({});
  const [cpdTypesExpanded, setCpdTypesExpanded] = useState(false);
  const [editingCpdTypeId, setEditingCpdTypeId] = useState(null); // null | "new" | <id>
  const [cpdTypeName, setCpdTypeName] = useState("");
  const [cpdTypeCode, setCpdTypeCode] = useState("");
  const [cpdTypeCategory, setCpdTypeCategory] = useState("");
  const [cpdTypeError, setCpdTypeError] = useState("");
  const [emailDrafts, setEmailDrafts] = useState({}); // { [userId]: { email, secondaryEmail } }

  const visibleUsers = users.filter(u => !u.isTest);
  const testAccounts = users.filter(u => u.isTest);

  const [teamSort, setTeamSort] = useState("firstName"); // firstName | lastName | recent
  const [teamGroupsExpanded, setTeamGroupsExpanded] = useState({ adminOwner: false, internal: false, external: false });
  const toggleTeamGroup = (key) => setTeamGroupsExpanded(s => ({ ...s, [key]: !s[key] }));
  const sortUsers = (list) => {
    const sorted = [...list];
    if (teamSort === "firstName") sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    else if (teamSort === "lastName") sorted.sort((a, b) => (a.name || "").split(" ").slice(-1)[0].localeCompare((b.name || "").split(" ").slice(-1)[0]));
    else if (teamSort === "recent") sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return sorted;
  };
  const adminOwnerUsers = sortUsers(visibleUsers.filter(u => u.role === "admin" || u.role === "owner"));
  const internalViewerUsers = sortUsers(visibleUsers.filter(u => u.role === "viewer" && u.userType !== "external"));
  const externalViewerUsers = sortUsers(visibleUsers.filter(u => u.role === "viewer" && u.userType === "external"));

  const startAddCpdType = () => { setEditingCpdTypeId("new"); setCpdTypeName(""); setCpdTypeCode(""); setCpdTypeCategory(""); setCpdTypeError(""); };
  const startEditCpdType = (t) => { setEditingCpdTypeId(t.id); setCpdTypeName(t.name); setCpdTypeCode(t.appellationCode); setCpdTypeCategory(t.category || ""); setCpdTypeError(""); };
  const cancelCpdTypeEdit = () => { setEditingCpdTypeId(null); setCpdTypeError(""); };
  const saveCpdType = () => {
    if (!cpdTypeName.trim() || !cpdTypeCode.trim()) {
      setCpdTypeError("Please add both a name and an appellation code for this CPD type.");
      return;
    }
    const isNew = editingCpdTypeId === "new";
    const cpdType = {
      id: isNew ? "cpd" + Date.now() : editingCpdTypeId, name: cpdTypeName.trim(), appellationCode: cpdTypeCode.trim(), category: cpdTypeCategory.trim(),
      sortOrder: isNew ? cpdTypes.length : cpdTypes.find(t => t.id === editingCpdTypeId)?.sortOrder ?? 0,
    };
    onSaveCpdType(cpdType, isNew);
    setEditingCpdTypeId(null);
    setCpdTypeError("");
  };
  const moveCpdType = (index, dir) => {
    const next = [...cpdTypes];
    const swapWith = index + dir;
    if (swapWith < 0 || swapWith >= next.length) return;
    [next[index], next[swapWith]] = [next[swapWith], next[index]];
    onReorderCpdTypes(next);
  };

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

  const handleAddMember = ({ firstName, lastName, userType, isEducationTeam, email, secondaryEmail }) => {
    const brandColors = Object.keys(BRAND_HEX);
    const role = isEducationTeam ? "owner" : "viewer";
    const name = `${firstName} ${lastName}`.trim();
    const newUser = {
      id: "u" + Date.now(), name, email, secondaryEmail: secondaryEmail || null, role, staffId: null,
      avatarId: CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)].id, avatarColor: brandColors[Math.floor(Math.random() * brandColors.length)],
      userType, verified: userType === "internal", onboarded: false,
    };
    onUsersChange([...users, newUser]);
    showToast(`${name} added${role === "owner" ? " as Owner" : ""}.`);
  };

  const patchUser = (id, patch) => onUsersChange(users.map(x => x.id === id ? { ...x, ...patch } : x));

  const doRevoke = async (u, action) => {
    setSessionActionStatus(s => ({ ...s, [u.id]: "working" }));
    const result = await onRevokeSession(u, action);
    setSessionActionStatus(s => ({ ...s, [u.id]: result.ok ? (action === "restore" ? "restored" : "revoked") : "error" }));
  };

  const renderUserRow = (u) => {
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
            onClick={() => { onProfileSave({ name: profileName, avatarId: profileAvatarId, avatarColor: profileAvatarColor }); showToast?.("Profile saved"); }}
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

      <div className="whmi-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="font-semibold text-[13px]">Appearance — Sidebar &amp; Header</div>
            <div className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>Choose light, dark, or navy for the sidebar and top header bar.</div>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <button onClick={() => setTheme("light")} className={theme === "light" ? "whmi-btn-primary flex items-center gap-1.5" : "whmi-btn-ghost flex items-center gap-1.5"}><Sun size={14} />Light</button>
            <button onClick={() => setTheme("dark")} className={theme === "dark" ? "whmi-btn-primary flex items-center gap-1.5" : "whmi-btn-ghost flex items-center gap-1.5"}><Moon size={14} />Dark</button>
            <button onClick={() => setTheme("navy")} className={theme === "navy" ? "whmi-btn-primary flex items-center gap-1.5" : "whmi-btn-ghost flex items-center gap-1.5"}><MoonStar size={14} />Navy</button>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          <div>
            <div className="font-semibold text-[13px]">Appearance — Main Page</div>
            <div className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>Set the main content area's theme separately, or leave it matching the sidebar and header.</div>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <button onClick={() => setMainTheme(null)} className={mainTheme == null ? "whmi-btn-primary flex items-center gap-1.5" : "whmi-btn-ghost flex items-center gap-1.5"}>Match</button>
            <button onClick={() => setMainTheme("light")} className={mainTheme === "light" ? "whmi-btn-primary flex items-center gap-1.5" : "whmi-btn-ghost flex items-center gap-1.5"}><Sun size={14} />Light</button>
            <button onClick={() => setMainTheme("dark")} className={mainTheme === "dark" ? "whmi-btn-primary flex items-center gap-1.5" : "whmi-btn-ghost flex items-center gap-1.5"}><Moon size={14} />Dark</button>
            <button onClick={() => setMainTheme("navy")} className={mainTheme === "navy" ? "whmi-btn-primary flex items-center gap-1.5" : "whmi-btn-ghost flex items-center gap-1.5"}><MoonStar size={14} />Navy</button>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          <div>
            <div className="font-semibold text-[13px]">Appearance — Cards, Forms &amp; Popups</div>
            <div className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>Set the colour of cards, forms, and popups (events, modals, panels) separately, or leave them matching the page.</div>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <button onClick={() => setCardTheme(null)} className={cardTheme == null ? "whmi-btn-primary flex items-center gap-1.5" : "whmi-btn-ghost flex items-center gap-1.5"}>Match</button>
            <button onClick={() => setCardTheme("light")} className={cardTheme === "light" ? "whmi-btn-primary flex items-center gap-1.5" : "whmi-btn-ghost flex items-center gap-1.5"}><Sun size={14} />Light</button>
            <button onClick={() => setCardTheme("dark")} className={cardTheme === "dark" ? "whmi-btn-primary flex items-center gap-1.5" : "whmi-btn-ghost flex items-center gap-1.5"}><Moon size={14} />Dark</button>
            <button onClick={() => setCardTheme("navy")} className={cardTheme === "navy" ? "whmi-btn-primary flex items-center gap-1.5" : "whmi-btn-ghost flex items-center gap-1.5"}><MoonStar size={14} />Navy</button>
          </div>
        </div>
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
        {canManageUsers && t("autoWaitlist", "Automatic Waitlist Promotion", "Move waitlisted staff to confirmed when a place opens")}
        {canManageUsers && t("autoApproveCerts", "Auto-approve Certificates", "Skip manual approval once reflection is confirmed")}
        {canManageUsers && t("weeklyDigest", "Weekly Digest", "Summary email of CPD activity every Monday")}
        {canManageUsers && (
          <div className="flex items-center justify-between p-4 gap-3">
            <div className="min-w-0">
              <div className="font-semibold text-[13px]">Keep Western Health CPD Separate</div>
              <div className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>In the Reflection tab, keep Western Health CPD reflections in their own section, separate from other activities you've added.</div>
            </div>
            <button onClick={toggleSeparateWhReflections} className="w-10 h-6 rounded-full relative transition shrink-0" style={{ background: separateWhReflections ? "var(--accent-success)" : "var(--surface-2)", border: "1px solid var(--border)" }}>
              <span className="absolute top-0.5 rounded-full bg-white transition" style={{ left: separateWhReflections ? "20px" : "3px", width: 18, height: 18 }} />
            </button>
          </div>
        )}
      </div>

      {canManageUsers && (
      <SettingsGroup title="Team & Access" description="Brand colours, staff/viewer accounts, preview-as, notification badges" icon={Users}>
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

        <div className="whmi-card p-4">
          <div className="flex items-center gap-2 mb-1"><Shield size={15} style={{ color: "var(--accent-primary)" }} /><div className="font-semibold text-[13px]">Team Access</div></div>
          <div className="text-[11.5px] mb-3" style={{ color: "var(--text-faint)" }}>Admins have full rights. Owners can do everything except change code. Viewers can only see their own certificates and CPD history.</div>
          {(() => {
            const unlinkedCount = users.filter(u => ["admin", "owner"].includes(u.role) && !u.staffId).length;
            return unlinkedCount > 0 && (
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg mb-3" style={{ background: "var(--surface-2)" }}>
                <span className="text-[11.5px]">{unlinkedCount} admin/owner{unlinkedCount === 1 ? "" : "s"} not yet in the Staff Directory.</span>
                <button onClick={onBackfillStaffLinks} className="whmi-btn-ghost !py-1 !px-2.5 text-[11.5px] shrink-0">Add to Staff</button>
              </div>
            );
          })()}
          <div className="flex items-center justify-end gap-2 mb-2">
            <label className="text-[10.5px] font-semibold" style={{ color: "var(--text-faint)" }}>Sort by</label>
            <select value={teamSort} onChange={e => setTeamSort(e.target.value)} className="whmi-input px-2 py-1 text-[11.5px]">
              <option value="firstName">First name</option>
              <option value="lastName">Last name</option>
              <option value="recent">Most recently added</option>
            </select>
          </div>
          {[
            { key: "adminOwner", label: "Admins & Owners", list: adminOwnerUsers },
            { key: "internal", label: "WH Staff", list: internalViewerUsers },
            { key: "external", label: "External", list: externalViewerUsers },
          ].map(group => (
            <div key={group.key} className="mb-3">
              <button onClick={() => toggleTeamGroup(group.key)} className="w-full flex items-center justify-between mb-1.5 py-1 px-1 -mx-1 rounded-lg whmi-row-hover transition">
                <div className="flex items-center gap-2">
                  {teamGroupsExpanded[group.key] ? <ChevronDown size={13} style={{ color: "var(--text-faint)" }} /> : <ChevronRight size={13} style={{ color: "var(--text-faint)" }} />}
                  <span className="text-[12px] font-semibold">{group.label}</span>
                </div>
                <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>{group.list.length}</span>
              </button>
              {teamGroupsExpanded[group.key] && (
                <div className="space-y-1.5">
                  {group.list.length === 0 ? (
                    <div className="text-[11.5px] px-1 pb-1" style={{ color: "var(--text-faint)" }}>No one in this group yet.</div>
                  ) : (
                    group.list.map(renderUserRow)
                  )}
                </div>
              )}
            </div>
          ))}
          <div className="flex justify-end">
            <button onClick={() => setAddMemberOpen(true)} className="whmi-btn-primary flex items-center gap-1.5"><UserPlus size={13} />Add Member</button>
          </div>
        </div>

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
      </SettingsGroup>
      )}

      {canManageUsers && (
      <SettingsGroup title="CPD Configuration" description="CPD types & appellation codes, staff information fields, tags" icon={SlidersHorizontal}>
        <div className="whmi-card p-4">
          <button onClick={() => setCpdTypesExpanded(x => !x)} className="w-full flex items-center justify-between mb-1 px-1 -mx-1 py-1 rounded-lg whmi-row-hover transition">
            <div className="flex items-center gap-2">
              {cpdTypesExpanded ? <ChevronDown size={13} style={{ color: "var(--text-faint)" }} /> : <ChevronRight size={13} style={{ color: "var(--text-faint)" }} />}
              <Award size={15} style={{ color: "var(--accent-primary)" }} /><div className="font-semibold text-[13px]">CPD Types &amp; Appellation Codes</div>
            </div>
            <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>{cpdTypes.length}</span>
          </button>
          {cpdTypesExpanded && (
            <>
              <div className="text-[11.5px] mb-3" style={{ color: "var(--text-faint)" }}>Used on the event form to select which ASMIRT-endorsed certificate applies. Adding, editing, and deleting is restricted to admins and owners, and asks for confirmation. Use the arrows to rearrange the order they appear in on the event form.</div>
              <datalist id="cpd-categories">
                {CPD_CATEGORIES.map(c => <option key={c} value={c} />)}
              </datalist>
              <div className="flex gap-1.5 mb-2">
                {editingCpdTypeId === null && (
                  <button onClick={startAddCpdType} className="whmi-btn-ghost flex items-center gap-1.5 text-[11.5px]"><Plus size={13} />Add Type</button>
                )}
              </div>

              <div className="space-y-1.5">
                {cpdTypes.map((t, i) => (
                  editingCpdTypeId === t.id ? (
                    <div key={t.id} className="p-2.5 rounded-lg space-y-2" style={{ background: "var(--surface-2)" }}>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input value={cpdTypeName} onChange={e => setCpdTypeName(e.target.value)} placeholder="CPD type name" className="whmi-input px-2.5 py-1.5 text-[12px]" />
                        <input value={cpdTypeCode} onChange={e => setCpdTypeCode(e.target.value)} placeholder="Appellation code (required)" className="whmi-input px-2.5 py-1.5 text-[12px]" />
                      </div>
                      <input list="cpd-categories" value={cpdTypeCategory} onChange={e => setCpdTypeCategory(e.target.value)} placeholder="Category" className="whmi-input w-full px-2.5 py-1.5 text-[12px]" />
                      {cpdTypeError && <div className="text-[11px] font-semibold" style={{ color: "#D9534F" }}>{cpdTypeError}</div>}
                      <div className="flex gap-1.5 justify-end">
                        <button onClick={cancelCpdTypeEdit} className="whmi-btn-ghost text-[11.5px]">Cancel</button>
                        <button onClick={saveCpdType} className="whmi-btn-primary text-[11.5px] flex items-center gap-1.5"><Save size={12} />Save</button>
                      </div>
                    </div>
                  ) : (
                    <div key={t.id} className="flex items-center justify-between p-2.5 rounded-lg gap-2" style={{ background: "var(--surface-2)" }}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="flex flex-col shrink-0">
                          <button onClick={() => moveCpdType(i, -1)} disabled={i === 0} className="whmi-btn-ghost !p-0.5" style={{ opacity: i === 0 ? 0.3 : 1 }}><ArrowUp size={12} /></button>
                          <button onClick={() => moveCpdType(i, 1)} disabled={i === cpdTypes.length - 1} className="whmi-btn-ghost !p-0.5" style={{ opacity: i === cpdTypes.length - 1 ? 0.3 : 1 }}><ArrowDown size={12} /></button>
                        </div>
                        <div className="min-w-0">
                          <div className="text-[12.5px] font-semibold truncate">{t.name}</div>
                          <div className="text-[10.5px] truncate" style={{ color: "var(--text-faint)" }}>{t.appellationCode}{t.category ? ` · ${t.category}` : ""}</div>
                        </div>
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
                      <input value={cpdTypeCode} onChange={e => setCpdTypeCode(e.target.value)} placeholder="Appellation code (required)" className="whmi-input px-2.5 py-1.5 text-[12px]" />
                    </div>
                    <input list="cpd-categories" value={cpdTypeCategory} onChange={e => setCpdTypeCategory(e.target.value)} placeholder="Category" className="whmi-input w-full px-2.5 py-1.5 text-[12px]" />
                    {cpdTypeError && <div className="text-[11px] font-semibold" style={{ color: "#D9534F" }}>{cpdTypeError}</div>}
                    <div className="flex gap-1.5 justify-end">
                      <button onClick={cancelCpdTypeEdit} className="whmi-btn-ghost text-[11.5px]">Cancel</button>
                      <button onClick={saveCpdType} className="whmi-btn-primary text-[11.5px] flex items-center gap-1.5"><Save size={12} />Add</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="whmi-card p-4">
          <button onClick={() => setStaffFieldsExpanded(x => !x)} className="w-full flex items-center justify-between mb-1 px-1 -mx-1 py-1 rounded-lg whmi-row-hover transition">
            <div className="flex items-center gap-2">
              {staffFieldsExpanded ? <ChevronDown size={13} style={{ color: "var(--text-faint)" }} /> : <ChevronRight size={13} style={{ color: "var(--text-faint)" }} />}
              <UserCircle2 size={15} style={{ color: "var(--accent-primary)" }} /><div className="font-semibold text-[13px]">Staff Information Fields</div>
            </div>
          </button>
          {staffFieldsExpanded && (
            <>
              <div className="text-[11.5px] mb-3" style={{ color: "var(--text-faint)" }}>Choose which fields show on staff records across the Staff Directory. Name is always shown.</div>
              <div className="space-y-1.5">
                {STAFF_FIELD_DEFS.map(f => {
                  const visible = staffFieldVisibility[f.id] !== false;
                  return (
                    <div key={f.id} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: "var(--surface-2)" }}>
                      <span className="text-[12.5px] font-semibold">{f.label}</span>
                      <button type="button" onClick={() => onToggleStaffField?.(f.id, !visible)} className="w-10 h-6 rounded-full relative transition shrink-0" style={{ background: visible ? "var(--accent-success)" : "var(--surface)", border: "1px solid var(--border)" }}>
                        <span className="absolute top-0.5 rounded-full bg-white transition" style={{ left: visible ? "20px" : "3px", width: 18, height: 18 }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="whmi-card p-4">
          <button onClick={() => setTagsExpanded(x => !x)} className="w-full flex items-center justify-between mb-1 px-1 -mx-1 py-1 rounded-lg whmi-row-hover transition">
            <div className="flex items-center gap-2">
              {tagsExpanded ? <ChevronDown size={13} style={{ color: "var(--text-faint)" }} /> : <ChevronRight size={13} style={{ color: "var(--text-faint)" }} />}
              <BadgeCheck size={15} style={{ color: "var(--accent-primary)" }} /><div className="font-semibold text-[13px]">Tags</div>
            </div>
            <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>{tags.length}</span>
          </button>
          {tagsExpanded && (
            <>
              <div className="text-[11.5px] mb-3" style={{ color: "var(--text-faint)" }}>The Topics chips shown on the event form. New tags typed there are added here automatically; reorder, rename, or delete them below.</div>
              <div className="flex gap-1.5 mb-2">
                {editingTagId === null && (
                  <button onClick={startAddTag} className="whmi-btn-ghost flex items-center gap-1.5 text-[11.5px]"><Plus size={13} />Add Tag</button>
                )}
                <button onClick={alphabetizeTags} className="whmi-btn-ghost text-[11.5px]">Sort Alphabetically</button>
              </div>
              <div className="space-y-1.5">
                {tags.map((t, i) => (
                  editingTagId === t.id ? (
                    <div key={t.id} className="p-2.5 rounded-lg space-y-2" style={{ background: "var(--surface-2)" }}>
                      <input autoFocus value={tagName} onChange={e => setTagName(e.target.value)} placeholder="Tag name" className="whmi-input w-full px-2.5 py-1.5 text-[12px]" />
                      {tagError && <div className="text-[11px] font-semibold" style={{ color: "#D9534F" }}>{tagError}</div>}
                      <div className="flex gap-1.5 justify-end">
                        <button onClick={cancelTagEdit} className="whmi-btn-ghost text-[11.5px]">Cancel</button>
                        <button onClick={saveTag} className="whmi-btn-primary text-[11.5px] flex items-center gap-1.5"><Save size={12} />Save</button>
                      </div>
                    </div>
                  ) : (
                    <div key={t.id} className="flex items-center justify-between p-2.5 rounded-lg gap-2" style={{ background: "var(--surface-2)" }}>
                      <div className="text-[12.5px] font-semibold truncate">{t.name}</div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => moveTag(i, -1)} disabled={i === 0} className="whmi-btn-ghost !p-1.5" style={{ opacity: i === 0 ? 0.4 : 1 }}><ArrowUp size={13} /></button>
                        <button onClick={() => moveTag(i, 1)} disabled={i === tags.length - 1} className="whmi-btn-ghost !p-1.5" style={{ opacity: i === tags.length - 1 ? 0.4 : 1 }}><ArrowDown size={13} /></button>
                        <button onClick={() => startEditTag(t)} className="whmi-btn-ghost !p-1.5"><Pencil size={13} /></button>
                        <button onClick={() => onDeleteTag(t)} className="whmi-btn-ghost !p-1.5" style={{ color: "#D9534F" }}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  )
                ))}
                {tags.length === 0 && editingTagId !== "new" && <div className="text-[12px]" style={{ color: "var(--text-faint)" }}>No tags added yet.</div>}
                {editingTagId === "new" && (
                  <div className="p-2.5 rounded-lg space-y-2" style={{ background: "var(--surface-2)" }}>
                    <input autoFocus value={tagName} onChange={e => setTagName(e.target.value)} placeholder="Tag name" className="whmi-input w-full px-2.5 py-1.5 text-[12px]" />
                    {tagError && <div className="text-[11px] font-semibold" style={{ color: "#D9534F" }}>{tagError}</div>}
                    <div className="flex gap-1.5 justify-end">
                      <button onClick={cancelTagEdit} className="whmi-btn-ghost text-[11.5px]">Cancel</button>
                      <button onClick={saveTag} className="whmi-btn-primary text-[11.5px] flex items-center gap-1.5"><Save size={12} />Add</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </SettingsGroup>
      )}

      {canManageUsers && (
      <SettingsGroup title="Avatars" description="Avatar icons and colours people can choose for their profile" icon={Image}>
        <div className="whmi-card p-4">
          <button onClick={() => setAvatarIconsExpanded(x => !x)} className="w-full flex items-center justify-between mb-1 px-1 -mx-1 py-1 rounded-lg whmi-row-hover transition">
            <div className="flex items-center gap-2">
              {avatarIconsExpanded ? <ChevronDown size={13} style={{ color: "var(--text-faint)" }} /> : <ChevronRight size={13} style={{ color: "var(--text-faint)" }} />}
              <Image size={15} style={{ color: "var(--accent-primary)" }} /><div className="font-semibold text-[13px]">Avatar Icons</div>
            </div>
            <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>{avatarIcons.length}</span>
          </button>
          {avatarIconsExpanded && (
            <>
              <div className="text-[11.5px] mb-3" style={{ color: "var(--text-faint)" }}>The pictures people can choose for their profile avatar. Upload a PNG and adjust its size within the circle.</div>
              {editingAvatarIconId === null && (
                <button onClick={startAddAvatarIcon} className="whmi-btn-ghost flex items-center gap-1.5 text-[11.5px] mb-2"><Plus size={13} />Add Icon</button>
              )}
              <div className="space-y-1.5">
                {avatarIcons.map((icon, i) => (
                  editingAvatarIconId === icon.id ? (
                    <div key={icon.id} className="p-2.5 rounded-lg space-y-2" style={{ background: "var(--surface-2)" }}>
                      <div className="flex items-center gap-2.5">
                        <CharacterAvatar avatarId={icon.id} color="grey" size={40} previewScale={avatarIconScale} previewImageUrl={avatarIconFilePreviewUrl} />
                        <input autoFocus value={avatarIconLabel} onChange={e => setAvatarIconLabel(e.target.value)} placeholder="Label" className="whmi-input flex-1 px-2.5 py-1.5 text-[12px]" />
                      </div>
                      <div>
                        <label className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>Size in circle ({avatarIconScale}%)</label>
                        <input type="range" min="0" max="100" value={avatarIconScale} onChange={e => setAvatarIconScale(Number(e.target.value))} className="w-full" />
                      </div>
                      <label className="whmi-btn-ghost !py-1.5 !px-2.5 text-[11.5px] flex items-center gap-1.5 w-fit cursor-pointer">
                        <Upload size={12} />{avatarIconFile ? avatarIconFile.name : "Replace image (optional)"}
                        <input type="file" accept="image/png,image/*" className="hidden" onChange={e => setAvatarIconFile(e.target.files?.[0] || null)} />
                      </label>
                      {avatarIconError && <div className="text-[11px] font-semibold" style={{ color: "#D9534F" }}>{avatarIconError}</div>}
                      <div className="flex gap-1.5 justify-end">
                        <button onClick={cancelAvatarIconEdit} className="whmi-btn-ghost text-[11.5px]">Cancel</button>
                        <button onClick={saveAvatarIcon} disabled={avatarIconUploading} className="whmi-btn-primary text-[11.5px] flex items-center gap-1.5"><Save size={12} />{avatarIconUploading ? "Uploading…" : "Save"}</button>
                      </div>
                    </div>
                  ) : (
                    <div key={icon.id} className="flex items-center justify-between p-2.5 rounded-lg gap-2" style={{ background: "var(--surface-2)" }}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CharacterAvatar avatarId={icon.id} color="grey" size={32} />
                        <div className="text-[12.5px] font-semibold truncate">{icon.label}</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => moveAvatarIcon(i, -1)} disabled={i === 0} className="whmi-btn-ghost !p-1.5" style={{ opacity: i === 0 ? 0.4 : 1 }}><ArrowUp size={13} /></button>
                        <button onClick={() => moveAvatarIcon(i, 1)} disabled={i === avatarIcons.length - 1} className="whmi-btn-ghost !p-1.5" style={{ opacity: i === avatarIcons.length - 1 ? 0.4 : 1 }}><ArrowDown size={13} /></button>
                        <button onClick={() => startEditAvatarIcon(icon)} className="whmi-btn-ghost !p-1.5"><Pencil size={13} /></button>
                        <button onClick={() => onDeleteAvatarIcon(icon)} className="whmi-btn-ghost !p-1.5" style={{ color: "#D9534F" }}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  )
                ))}
                {editingAvatarIconId === "new" && (
                  <div className="p-2.5 rounded-lg space-y-2" style={{ background: "var(--surface-2)" }}>
                    <div className="flex items-center gap-2.5">
                      {avatarIconFilePreviewUrl ? (
                        <CharacterAvatar avatarId={null} color="grey" size={40} previewScale={avatarIconScale} previewImageUrl={avatarIconFilePreviewUrl} />
                      ) : (
                        <div className="rounded-full flex items-center justify-center shrink-0" style={{ width: 40, height: 40, background: "var(--surface-3, #ddd)" }}>
                          <Image size={16} style={{ color: "var(--text-faint)" }} />
                        </div>
                      )}
                      <input autoFocus value={avatarIconLabel} onChange={e => setAvatarIconLabel(e.target.value)} placeholder="Label" className="whmi-input flex-1 px-2.5 py-1.5 text-[12px]" />
                    </div>
                    <div>
                      <label className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>Size in circle ({avatarIconScale}%)</label>
                      <input type="range" min="0" max="100" value={avatarIconScale} onChange={e => setAvatarIconScale(Number(e.target.value))} className="w-full" />
                    </div>
                    <label className="whmi-btn-ghost !py-1.5 !px-2.5 text-[11.5px] flex items-center gap-1.5 w-fit cursor-pointer">
                      <Upload size={12} />{avatarIconFile ? avatarIconFile.name : "Choose PNG image"}
                      <input type="file" accept="image/png,image/*" className="hidden" onChange={e => setAvatarIconFile(e.target.files?.[0] || null)} />
                    </label>
                    {avatarIconError && <div className="text-[11px] font-semibold" style={{ color: "#D9534F" }}>{avatarIconError}</div>}
                    <div className="flex gap-1.5 justify-end">
                      <button onClick={cancelAvatarIconEdit} className="whmi-btn-ghost text-[11.5px]">Cancel</button>
                      <button onClick={saveAvatarIcon} disabled={avatarIconUploading} className="whmi-btn-primary text-[11.5px] flex items-center gap-1.5"><Save size={12} />{avatarIconUploading ? "Uploading…" : "Add"}</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="whmi-card p-4">
          <button onClick={() => setAvatarColorsExpanded(x => !x)} className="w-full flex items-center justify-between mb-1 px-1 -mx-1 py-1 rounded-lg whmi-row-hover transition">
            <div className="flex items-center gap-2">
              {avatarColorsExpanded ? <ChevronDown size={13} style={{ color: "var(--text-faint)" }} /> : <ChevronRight size={13} style={{ color: "var(--text-faint)" }} />}
              <Palette size={15} style={{ color: "var(--accent-primary)" }} /><div className="font-semibold text-[13px]">Avatar Colours</div>
            </div>
            <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>{avatarColors.length}</span>
          </button>
          {avatarColorsExpanded && (
            <>
              <div className="text-[11.5px] mb-3" style={{ color: "var(--text-faint)" }}>The background colour options people can choose for their profile avatar.</div>
              {editingAvatarColorId === null && (
                <button onClick={startAddAvatarColor} className="whmi-btn-ghost flex items-center gap-1.5 text-[11.5px] mb-2"><Plus size={13} />Add Colour</button>
              )}
              <div className="space-y-1.5">
                {avatarColors.map((c, i) => (
                  editingAvatarColorId === c.id ? (
                    <div key={c.id} className="p-2.5 rounded-lg space-y-2" style={{ background: "var(--surface-2)" }}>
                      <div className="flex items-center gap-2">
                        <input type="color" value={avatarColorHex} onChange={e => setAvatarColorHex(e.target.value)} className="w-8 h-8 rounded shrink-0" />
                        <input autoFocus value={avatarColorName} onChange={e => setAvatarColorName(e.target.value)} placeholder="Colour name" className="whmi-input flex-1 px-2.5 py-1.5 text-[12px]" />
                        <input value={avatarColorHex} onChange={e => setAvatarColorHex(e.target.value)} placeholder="#35A8DD" className="whmi-input w-24 px-2.5 py-1.5 text-[12px]" />
                      </div>
                      {avatarColorError && <div className="text-[11px] font-semibold" style={{ color: "#D9534F" }}>{avatarColorError}</div>}
                      <div className="flex gap-1.5 justify-end">
                        <button onClick={cancelAvatarColorEdit} className="whmi-btn-ghost text-[11.5px]">Cancel</button>
                        <button onClick={saveAvatarColor} className="whmi-btn-primary text-[11.5px] flex items-center gap-1.5"><Save size={12} />Save</button>
                      </div>
                    </div>
                  ) : (
                    <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg gap-2" style={{ background: "var(--surface-2)" }}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full shrink-0" style={{ background: c.hex, border: "1px solid var(--border)" }} />
                        <div className="text-[12.5px] font-semibold truncate">{c.name}</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => moveAvatarColor(i, -1)} disabled={i === 0} className="whmi-btn-ghost !p-1.5" style={{ opacity: i === 0 ? 0.4 : 1 }}><ArrowUp size={13} /></button>
                        <button onClick={() => moveAvatarColor(i, 1)} disabled={i === avatarColors.length - 1} className="whmi-btn-ghost !p-1.5" style={{ opacity: i === avatarColors.length - 1 ? 0.4 : 1 }}><ArrowDown size={13} /></button>
                        <button onClick={() => startEditAvatarColor(c)} className="whmi-btn-ghost !p-1.5"><Pencil size={13} /></button>
                        <button onClick={() => onDeleteAvatarColor(c)} className="whmi-btn-ghost !p-1.5" style={{ color: "#D9534F" }}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  )
                ))}
                {editingAvatarColorId === "new" && (
                  <div className="p-2.5 rounded-lg space-y-2" style={{ background: "var(--surface-2)" }}>
                    <div className="flex items-center gap-2">
                      <input type="color" value={avatarColorHex} onChange={e => setAvatarColorHex(e.target.value)} className="w-8 h-8 rounded shrink-0" />
                      <input autoFocus value={avatarColorName} onChange={e => setAvatarColorName(e.target.value)} placeholder="Colour name" className="whmi-input flex-1 px-2.5 py-1.5 text-[12px]" />
                      <input value={avatarColorHex} onChange={e => setAvatarColorHex(e.target.value)} placeholder="#35A8DD" className="whmi-input w-24 px-2.5 py-1.5 text-[12px]" />
                    </div>
                    {avatarColorError && <div className="text-[11px] font-semibold" style={{ color: "#D9534F" }}>{avatarColorError}</div>}
                    <div className="flex gap-1.5 justify-end">
                      <button onClick={cancelAvatarColorEdit} className="whmi-btn-ghost text-[11.5px]">Cancel</button>
                      <button onClick={saveAvatarColor} className="whmi-btn-primary text-[11.5px] flex items-center gap-1.5"><Save size={12} />Add</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </SettingsGroup>
      )}

      {canManageUsers && (
      <SettingsGroup title="System" description="Audit log and developer-only configuration" icon={History}>
        <div className="whmi-card p-4">
          <button onClick={() => setAuditLogExpanded(x => !x)} className="w-full flex items-center justify-between mb-1 px-1 -mx-1 py-1 rounded-lg whmi-row-hover transition">
            <div className="flex items-center gap-2">
              {auditLogExpanded ? <ChevronDown size={13} style={{ color: "var(--text-faint)" }} /> : <ChevronRight size={13} style={{ color: "var(--text-faint)" }} />}
              <History size={15} style={{ color: "var(--accent-primary)" }} /><div className="font-semibold text-[13px]">Audit Log</div>
            </div>
            <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>{auditLog.length}</span>
          </button>
          {auditLogExpanded && (
            <>
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
            </>
          )}
        </div>

        <div className="whmi-card p-4 flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-[13px]">Developer Mode</div>
            <div className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>{role === "admin" ? "Admin-only access to code-level configuration." : "Admins only, owners cannot change code."}</div>
          </div>
          <button onClick={() => role === "admin" && setDevMode(d => !d)} disabled={role !== "admin"} className="w-10 h-6 rounded-full relative transition shrink-0" style={{ background: devMode ? "var(--accent-success)" : "var(--surface-2)", border: "1px solid var(--border)", opacity: role === "admin" ? 1 : 0.5, cursor: role === "admin" ? "pointer" : "not-allowed" }}>
            <span className="absolute top-0.5 rounded-full bg-white transition" style={{ left: devMode ? "20px" : "3px", width: 18, height: 18 }} />
          </button>
        </div>
      </SettingsGroup>
      )}

      <div className="whmi-card p-4">
        <div className="font-semibold text-[13px] mb-1">Role</div>
        <div className="text-[12.5px] capitalize" style={{ color: "var(--text-dim)" }}>{role} · {role === "admin" ? "Full access to all functions" : role === "owner" ? "Full access except code-level changes" : "Can view own certificates and CPD only"}</div>
      </div>

      <AddMemberModal open={addMemberOpen} onClose={() => setAddMemberOpen(false)} onAdd={handleAddMember} />
    </div>
  );
}
