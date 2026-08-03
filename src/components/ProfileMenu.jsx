import { useState } from "react";
import { Save, LogOut } from "lucide-react";
import CharacterAvatar from "./CharacterAvatar";
import AvatarPicker from "./AvatarPicker";

export default function ProfileMenu({ user, onClose, onLogout, onSave }) {
  const [name, setName] = useState(user.name);
  const [avatarId, setAvatarId] = useState(user.avatarId);
  const [avatarColor, setAvatarColor] = useState(user.avatarColor || "blue");
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute top-14 right-6 whmi-card w-72 p-4 whmi-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-3">
          <CharacterAvatar avatarId={avatarId} color={avatarColor} size={40} />
          <div className="min-w-0">
            <div className="font-bold text-[13.5px] truncate">{user.name}</div>
            <div className="text-[11px] truncate" style={{ color: "var(--text-faint)" }}>{user.email}</div>
            <span className="whmi-badge mt-1" style={{ background: "var(--surface-2)", color: "var(--text-dim)", textTransform: "capitalize" }}>{user.role}</span>
          </div>
        </div>
        <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Display name</label>
        <input value={name} onChange={e => setName(e.target.value)} className="whmi-input w-full px-2.5 py-1.5 mt-1 mb-3" />
        <div className="mb-3">
          <AvatarPicker
            avatarId={avatarId} avatarColor={avatarColor}
            onChangeAvatar={id => { setAvatarId(id); onSave({ avatarId: id, avatarColor }); }}
            onChangeColor={color => { setAvatarColor(color); onSave({ avatarId, avatarColor: color }); }}
          />
        </div>
        <button onClick={() => { onSave({ name, avatarId, avatarColor }); onClose(); }} className="whmi-btn-primary w-full flex items-center justify-center gap-1.5 mb-2"><Save size={13} />Save Changes</button>
        <button onClick={onLogout} className="whmi-btn-ghost w-full flex items-center justify-center gap-1.5" style={{ color: "#D9534F" }}><LogOut size={13} />Log Out</button>
      </div>
    </div>
  );
}
