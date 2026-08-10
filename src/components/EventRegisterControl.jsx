import { CheckCircle2 } from "lucide-react";

const NAVY = "#152A4E";
const NAVY_HOVER = "#1E3A63";

// Non-interactive "you're registered" indicator, meant to sit `absolute bottom-2 right-2` (or
// similar) in a `relative` card container. Deliberately separate from the unregister action
// (RegisterOrUnregister below) rather than doubling as a click target itself.
export function RegisteredBadge({ corner = true, className = "" }) {
  return (
    <span
      className={`${corner ? "absolute bottom-2 right-2 " : ""}z-10 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow ${className}`}
      style={{ background: "var(--accent-success)" }}
    >
      <CheckCircle2 size={12} />Registered
    </span>
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

// Small distinct control shown in the Register button's slot once the viewer is already
// registered — separate from the corner RegisteredBadge, per how "un-registering" should work:
// a deliberate, low-emphasis action rather than clicking the green status indicator itself.
export function UnregisterButton({ onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`text-[11px] font-semibold px-2 py-1.5 rounded-lg whmi-row-hover transition shrink-0 ${className}`}
      style={{ color: "var(--text-faint)" }}
      title="Unregister from this event"
    >
      Unregister
    </button>
  );
}

// Convenience wrapper: Register button, or Unregister control once registered. Stops the click
// from bubbling up to a card's onClick (which usually opens the event) since both actions are
// self-contained.
export default function RegisterOrUnregister({ registered, onRegister, onUnregister, size = "sm", className = "" }) {
  if (registered) {
    return <UnregisterButton onClick={(e) => { e.stopPropagation(); onUnregister(); }} className={className} />;
  }
  return <RegisterButton onClick={(e) => { e.stopPropagation(); onRegister(); }} size={size} className={className} />;
}
