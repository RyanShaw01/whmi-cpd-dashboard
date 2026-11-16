import { CheckCircle2, FileText, AlertCircle, X, Info, Archive, Clock } from "lucide-react";

// Internal workflow names, shown as-is to admins. `audience="viewer"` swaps in wording that
// means something to the person the certificate belongs to: "Awaiting Approval" told them
// nothing about whether they had to do anything, and "Sent" is only true once it's left.
const PREPARING = { label: "Being prepared", icon: <Clock size={12} />, bg: "color-mix(in srgb, var(--accent-primary) 15%, transparent)", fg: "var(--accent-primary)" };
const VIEWER_LABELS = {
  // Draft and Awaiting Approval are two different admin steps but the same single fact to the
  // recipient, so they share one label - and one colour, or the same words would show up in
  // two different shades depending on an internal step the reader can't see.
  "Awaiting Approval": PREPARING,
  "Draft": PREPARING,
  "Sent": { label: "Issued", icon: <CheckCircle2 size={12} />, bg: "color-mix(in srgb, var(--accent-success) 15%, transparent)", fg: "var(--accent-success)" },
};

export default function StatusBadge({ status, audience }) {
  const map = {
    "Registration Open": { bg: "color-mix(in srgb, var(--accent-success) 15%, transparent)", fg: "var(--accent-success)", icon: <CheckCircle2 size={12} /> },
    "Draft": { bg: "color-mix(in srgb, var(--text-dim) 14%, transparent)", fg: "var(--text-dim)", icon: <FileText size={12} /> },
    "Awaiting Approval": { bg: "color-mix(in srgb, var(--accent-primary) 15%, transparent)", fg: "var(--accent-primary)", icon: <AlertCircle size={12} /> },
    "Registration Closed": { bg: "color-mix(in srgb, var(--accent-secondary) 15%, transparent)", fg: "var(--accent-secondary)", icon: <X size={12} /> },
    "Open (No Registration Needed)": { bg: "color-mix(in srgb, var(--accent-primary) 15%, transparent)", fg: "var(--accent-primary)", icon: <Info size={12} /> },
    "Completed": { bg: "color-mix(in srgb, var(--accent-success) 15%, transparent)", fg: "var(--accent-success)", icon: <CheckCircle2 size={12} /> },
    // Archived was missing, so it fell through to the Draft entry and rendered a grey
    // "document" icon next to the word "Archived".
    "Archived": { bg: "color-mix(in srgb, var(--text-dim) 14%, transparent)", fg: "var(--text-dim)", icon: <Archive size={12} /> },
    "Sent": { bg: "color-mix(in srgb, var(--accent-success) 15%, transparent)", fg: "var(--accent-success)", icon: <CheckCircle2 size={12} /> },
  };
  const s = map[status] || map["Draft"];
  const viewer = audience === "viewer" ? VIEWER_LABELS[status] : null;
  return (
    <span className="whmi-badge" style={{ background: viewer ? viewer.bg : s.bg, color: viewer ? viewer.fg : s.fg }}>
      {viewer ? viewer.icon : s.icon}{viewer ? viewer.label : status}
    </span>
  );
}
