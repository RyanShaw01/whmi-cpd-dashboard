import { Video, RefreshCw, Building2 } from "lucide-react";

export default function ModeBadge({ mode }) {
  const icon = mode === "Online" ? <Video size={12} /> : mode === "Hybrid" ? <RefreshCw size={12} /> : <Building2 size={12} />;
  return <span className="whmi-badge" style={{ background: "var(--surface-2)", color: "var(--text-dim)" }}>{icon}{mode}</span>;
}
