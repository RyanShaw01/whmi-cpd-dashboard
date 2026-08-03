import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import CharacterAvatar from "./CharacterAvatar";
import { CHARACTERS, AVATAR_COLORS } from "../data/mockData";

export default function AvatarPicker({ avatarId, avatarColor, onChangeAvatar, onChangeColor, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const swatchSize = 30;

  return (
    <div>
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <CharacterAvatar avatarId={avatarId} color={avatarColor} size={36} />
          <span className="text-[12px] font-semibold" style={{ color: "var(--text-dim)" }}>Change picture &amp; colour</span>
        </div>
        {open ? <ChevronDown size={15} style={{ color: "var(--text-faint)" }} /> : <ChevronRight size={15} style={{ color: "var(--text-faint)" }} />}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-6 gap-1.5">
            {CHARACTERS.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => onChangeAvatar(c.id)}
                title={c.label}
                className="rounded-full flex items-center justify-center shrink-0"
                style={{
                  width: swatchSize + 6,
                  height: swatchSize + 6,
                  outline: avatarId === c.id ? "2px solid var(--accent-primary)" : "none",
                  outlineOffset: 2,
                }}
              >
                <CharacterAvatar avatarId={c.id} color={avatarColor} size={swatchSize} />
              </button>
            ))}
          </div>
          <div>
            <div className="text-[11px] font-semibold mb-1.5" style={{ color: "var(--text-faint)" }}>Background colour</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(AVATAR_COLORS).map(([name, hex]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => onChangeColor(name)}
                  title={name}
                  className="w-7 h-7 rounded-full shrink-0"
                  style={{ background: hex, outline: avatarColor === name ? "2px solid var(--text)" : "1px solid var(--border)", outlineOffset: 2 }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
