import { CheckCircle2 } from "lucide-react";

const NAVY = "#152A4E";
const NAVY_HOVER = "#1E3A63";

// The single "you're registered" control — a green pill, clickable to unregister (the caller's
// onUnregister is expected to confirm first). This is the ONLY registered-state control shown
// anywhere: no separate "Unregister" button sits next to or on top of it, whether it's the
// absolute corner badge on a card/grid tile or inline in a slot-style layout (compact rows,
// modal header/footer).
export function RegisteredBadge({ corner = true, onUnregister, className = "" }) {
  const Tag = onUnregister ? "button" : "span";
  return (
    <Tag
      onClick={onUnregister ? (e) => { e.stopPropagation(); onUnregister(); } : undefined}
      className={`${corner ? "absolute bottom-2 right-2 " : ""}z-10 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow transition${onUnregister ? " hover:brightness-110" : ""} ${className}`}
      style={{ background: "var(--accent-success)" }}
      title={onUnregister ? "Click to unregister" : undefined}
    >
      <CheckCircle2 size={12} />Registered
    </Tag>
  );
}

// The navy "Register" CTA used across card tiles and the event detail modal, with the same
// hover-highlight treatment everywhere.
export function RegisterButton({ onClick, size = "sm", className = "" }) {
  const pad = size === "sm" ? "px-2.5 py-1.5 text-[11.5px]" : "px-3 py-1.5 text-[12px]";
  return (
    <button
      onClick={onClick}
      className={`font-semibold rounded-lg transition shrink-0 flex items-center gap-1 ${pad} ${className}`}
      style={{ background: NAVY, color: "white" }}
      onMouseEnter={e => { e.currentTarget.style.background = NAVY_HOVER; }}
      onMouseLeave={e => { e.currentTarget.style.background = NAVY; }}
    >
      Register
    </button>
  );
}

// Convenience wrapper: Register button, or the clickable Registered badge (click = unregister)
// once registered. Stops the click from bubbling up to a card's onClick (which usually opens
// the event) since both actions are self-contained.
export default function RegisterOrUnregister({ registered, onRegister, onUnregister, size = "sm", className = "", corner = false }) {
  if (registered) {
    return <RegisteredBadge corner={corner} onUnregister={onUnregister ? () => onUnregister() : undefined} className={className} />;
  }
  return <RegisterButton onClick={(e) => { e.stopPropagation(); onRegister(); }} size={size} className={className} />;
}
