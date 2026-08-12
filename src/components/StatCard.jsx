export default function StatCard({ label, value, sub, icon: Icon, accent, onClick, hoverable }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`whmi-card p-4 relative overflow-hidden text-left w-full min-h-[104px] flex flex-col${(onClick || hoverable) ? " whmi-row-hover transition" : ""}`}
    >
      {/* Icon pinned top-right regardless of label length, independent of the text column below
          so every stat card in a row lines up the same way. */}
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 absolute top-4 right-4" style={{ background: accent + "22" }}>
        <Icon size={17} style={{ color: accent }} />
      </div>
      {/* break-normal (not break-words) — wraps at word boundaries only, never splitting a word
          like "Registrations" mid-way just because a narrow column made it the tightest fit. */}
      <div className="pr-10 min-w-0">
        <div className="text-[12px] font-semibold break-normal" style={{ color: "var(--text-dim)" }}>{label}</div>
        <div className="disp text-[20px] sm:text-[26px] font-extrabold mt-1 break-normal" style={{ color: "var(--text)" }}>{value}</div>
      </div>
      {/* Faint sub-text always anchored to the bottom-left of the card, whatever the label/value
          height above it, so it lines up across every stat card in a row. Wraps instead of
          truncating — narrow columns should get taller, not lose text. */}
      <div className="mt-auto pt-1.5 text-[11px] flex items-start gap-1 text-left break-normal" style={{ color: "var(--text-faint)" }}>{sub || " "}</div>
    </Tag>
  );
}
