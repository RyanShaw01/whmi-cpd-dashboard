import { useAvatarIcons, resolveColorHex, iconImageUrl, BUILTIN_ICONS } from "../lib/avatarRegistry";

export default function CharacterAvatar({ avatarId, size = 32, color }) {
  const icons = useAvatarIcons();
  const idx = Math.max(0, icons.findIndex(c => c.id === avatarId));
  const char = icons[idx] || icons[0];
  const fallbackColors = ["var(--accent-primary)", "var(--accent-secondary)", "var(--accent-success)"];
  const resolvedColor = resolveColorHex(color) || color || fallbackColors[idx % fallbackColors.length];

  if (!char) {
    return <div className="rounded-full shrink-0" style={{ width: size, height: size, background: resolvedColor }} />;
  }

  const imgUrl = iconImageUrl(char);
  const iconSizePx = Math.round(size * ((char.iconScale ?? 55) / 100));

  return (
    <div className="rounded-full flex items-center justify-center shrink-0 overflow-hidden" style={{ width: size, height: size, background: resolvedColor }} title={char.label}>
      {imgUrl ? (
        <img src={imgUrl} alt="" style={{ width: iconSizePx, height: iconSizePx, objectFit: "contain" }} />
      ) : (
        (() => {
          const Icon = BUILTIN_ICONS[char.iconKey] || Object.values(BUILTIN_ICONS)[0];
          return <Icon size={iconSizePx} color="white" />;
        })()
      )}
    </div>
  );
}
