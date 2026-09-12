import { CheckCircle2, FileText, AlertCircle, X, Info, Archive, Clock } from "lucide-react";

// Internal workflow names, shown as-is to admins. `audience="viewer"` swaps in wording that
// means something to the person the certificate belongs to: "Awaiting Approval" told them
// nothing about whether they had to do anything, and "Sent" is only true once it's left.
const PREPARING = { label: "Being prepared", icon: <Clock size={12} />, bg: "rgba(53,168,221,.15)", fg: "#2C8FC0" };
const VIEWER_LABELS = {
  // Draft and Awaiting Approval are two different admin steps but the same single fact to the
  // recipient, so they share one label - and one colour, or the same words would show up in
  // two different shades depending on an internal step the reader can't see.
  "Awaiting Approval": PREPARING,
  "Draft": PREPARING,
  "Sent": { label: "Issued", icon: <CheckCircle2 size={12} />, bg: "rgba(156,203,59,.15)", fg: "#7CA82F" },
};

export default function StatusBadge({ status, audience }) {
  const map = {
    "Registration Open": { bg: "rgba(156,203,59,.15)", fg: "#7CA82F", icon: <CheckCircle2 size={12} /> },
    "Draft": { bg: "rgba(107,114,128,.15)", fg: "#8A8F98", icon: <FileText size={12} /> },
    "Awaiting Approval": { bg: "rgba(53,168,221,.15)", fg: "#2C8FC0", icon: <AlertCircle size={12} /> },
    "Registration Closed": { bg: "rgba(123,63,228,.15)", fg: "#7B3FE4", icon: <X size={12} /> },
    "Open (No Registration Needed)": { bg: "rgba(53,168,221,.15)", fg: "#35A8DD", icon: <Info size={12} /> },
    "Completed": { bg: "rgba(156,203,59,.15)", fg: "#7CA82F", icon: <CheckCircle2 size={12} /> },
    // Archived was missing, so it fell through to the Draft entry and rendered a grey
    // "document" icon next to the word "Archived".
    "Archived": { bg: "rgba(107,114,128,.15)", fg: "#8A8F98", icon: <Archive size={12} /> },
    "Sent": { bg: "rgba(156,203,59,.15)", fg: "#7CA82F", icon: <CheckCircle2 size={12} /> },
  };
  const s = map[status] || map["Draft"];
  const viewer = audience === "viewer" ? VIEWER_LABELS[status] : null;
  return (
    <span className="whmi-badge" style={{ background: viewer ? viewer.bg : s.bg, color: viewer ? viewer.fg : s.fg }}>
      {viewer ? viewer.icon : s.icon}{viewer ? viewer.label : status}
    </span>
  );
}
