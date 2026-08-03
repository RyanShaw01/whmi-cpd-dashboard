import { Info } from "lucide-react";

// Pure-CSS hover popover (group-hover, no JS state): a small info icon that reveals a
// short explanation card on hover/focus.
export default function InfoTooltip({ text, width = 220 }) {
  return (
    <span className="relative inline-flex items-center group">
      <Info size={13} tabIndex={0} style={{ color: "var(--text-faint)", cursor: "help" }} />
      <span
        className="whmi-card absolute z-20 p-2.5 text-[11px] leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
        style={{ bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", width, color: "var(--text-dim)", boxShadow: "0 4px 16px rgba(0,0,0,.12)" }}
      >
        {text}
      </span>
    </span>
  );
}
