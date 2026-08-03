import { CHARACTERS, AVATAR_COLORS } from "../data/mockData";

export default function CharacterAvatar({ avatarId, size = 32, color }) {
  const idx = Math.max(0, CHARACTERS.findIndex(c => c.id === avatarId));
  const char = CHARACTERS[idx] || CHARACTERS[0];
  const fallbackColors = ["var(--accent-primary)", "var(--accent-secondary)", "var(--accent-success)"];
  const resolvedColor = AVATAR_COLORS[color] || color || fallbackColors[idx % fallbackColors.length];
  const Icon = char.icon;
  return (
    <div className="rounded-full flex items-center justify-center shrink-0" style={{ width: size, height: size, background: resolvedColor }} title={char.label}>
      <Icon size={Math.round(size * 0.55)} color="white" />
    </div>
  );
}
