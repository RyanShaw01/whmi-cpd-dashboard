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
      <div className="pr-11">
        <div className="text-[12px] font-semibold" style={{ color: "var(--text-dim)" }}>{label}</div>
        <div className="disp text-[26px] font-extrabold mt-1" style={{ color: "var(--text)" }}>{value}</div>
      </div>
      {/* Faint sub-text always anchored to the bottom-left of the card, whatever the label/value
          height above it, so it lines up across every stat card in a row. */}
      <div className="mt-auto pt-1.5 text-[11px] flex items-center gap-1 text-left" style={{ color: "var(--text-faint)" }}>{sub || " "}</div>
    </Tag>
  );
}
