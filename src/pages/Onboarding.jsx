import { useState } from "react";
import { UserCircle2, ArrowRight } from "lucide-react";
import AvatarPicker from "../components/AvatarPicker";
import { CHARACTERS } from "../data/mockData";

export default function Onboarding({ session, onComplete, rootVars }) {
  const [firstName, setFirstName] = useState(session.name?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(session.name?.split(" ").slice(1).join(" ") || "");
  const [avatarId, setAvatarId] = useState(session.avatarId || CHARACTERS[0].id);
  const [avatarColor, setAvatarColor] = useState(session.avatarColor || "blue");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || saving) return;
    setSaving(true);
    await onComplete({ name: `${firstName.trim()} ${lastName.trim()}`, avatarId, avatarColor });
  };

  return (
    <div className="whmi-root light flex items-center justify-center p-4" style={{ minHeight: "100vh", ...rootVars }}>
      <div className="whmi-card w-full max-w-sm p-6 whmi-fade-in">
        <div className="whmi-logo-full mx-auto mb-4" style={{ width: 128, height: 66 }} />
        <div className="flex items-center gap-2 justify-center mb-1">
          <UserCircle2 size={16} style={{ color: "var(--accent-primary)" }} />
          <h1 className="disp text-[16px] font-extrabold">Welcome to WHMI CPD</h1>
        </div>
        <p className="text-[12px] text-center mb-5" style={{ color: "var(--text-faint)" }}>
          Let's set up your profile before you get started.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>First name</label>
              <input required value={firstName} onChange={e => setFirstName(e.target.value)} className="whmi-input w-full px-3 py-2 mt-1" placeholder="Jane" />
            </div>
            <div>
              <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Last name</label>
              <input required value={lastName} onChange={e => setLastName(e.target.value)} className="whmi-input w-full px-3 py-2 mt-1" placeholder="Smith" />
            </div>
          </div>
          <AvatarPicker avatarId={avatarId} avatarColor={avatarColor} onChangeAvatar={setAvatarId} onChangeColor={setAvatarColor} defaultOpen />
          <button type="submit" disabled={saving} className="whmi-btn-primary w-full flex items-center justify-center gap-1.5" style={{ opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving…" : "Continue"}<ArrowRight size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
