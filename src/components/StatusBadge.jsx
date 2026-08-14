import { CheckCircle2, FileText, AlertCircle, X, Info } from "lucide-react";

export default function StatusBadge({ status }) {
  const map = {
    "Registration Open": { bg: "rgba(156,203,59,.15)", fg: "#7CA82F", icon: <CheckCircle2 size={12} /> },
    "Draft": { bg: "rgba(107,114,128,.15)", fg: "#8A8F98", icon: <FileText size={12} /> },
    "Awaiting Approval": { bg: "rgba(53,168,221,.15)", fg: "#2C8FC0", icon: <AlertCircle size={12} /> },
    "Registration Closed": { bg: "rgba(123,63,228,.15)", fg: "#7B3FE4", icon: <X size={12} /> },
    "Open (No Registration Needed)": { bg: "rgba(53,168,221,.15)", fg: "#35A8DD", icon: <Info size={12} /> },
    "Completed": { bg: "rgba(156,203,59,.15)", fg: "#7CA82F", icon: <CheckCircle2 size={12} /> },
    "Sent": { bg: "rgba(156,203,59,.15)", fg: "#7CA82F", icon: <CheckCircle2 size={12} /> },
  };
  const s = map[status] || map["Draft"];
  return <span className="whmi-badge" style={{ background: s.bg, color: s.fg }}>{s.icon}{status}</span>;
}
