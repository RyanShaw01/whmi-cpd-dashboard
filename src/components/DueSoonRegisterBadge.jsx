import { useState } from "react";

// Small faint status pill for a "due soon" list item: "Registered" (click opens the event card)
// or "Register?" (click jumps straight into the registration form for that event) - a quick-
// glance status + shortcut, distinct from the full Register/Unregister control used on event
// cards elsewhere, which is about actually changing registration state rather than navigating.
export default function DueSoonRegisterBadge({ registered, onClick }) {
  const [hover, setHover] = useState(false);
  const color = registered ? "var(--accent-success)" : "var(--accent-secondary)";
  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); onClick(); }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="whmi-badge font-semibold shrink-0 transition"
      style={{ background: hover ? `${color}33` : `${color}14`, color }}
      title={registered ? "View event details" : "Register for this event"}
    >
      {registered ? "Registered" : "Register?"}
    </button>
  );
}
