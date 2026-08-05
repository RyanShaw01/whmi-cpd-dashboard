import { useState, useMemo } from "react";
import { Search, Trash2, Download } from "lucide-react";
import DuplicateWarnings from "./DuplicateWarnings";
import { findDuplicates } from "../lib/duplicates";
import { fmtDate } from "../lib/helpers";

const SORT_OPTIONS = [
  { id: "date-desc", label: "Newest - Oldest" },
  { id: "date-asc", label: "Oldest - Newest" },
  { id: "alpha-asc", label: "Alphabetical (A - Z)" },
  { id: "alpha-desc", label: "Alphabetical (Z - A)" },
];

function exportReflectionsCsv(event, reflections) {
  const headers = ["Name", "Email", "Quality (0-10)", "Relevance (0-10)", "Appropriateness", "Reflection", "Most Valuable", "Improvements", "Future Topics", "Submitted"];
  const rows = reflections.map(r => [r.name, r.email, r.rating, r.relevanceRating, r.appropriateness, r.content, r.mostValuable, r.improvements, r.futureTopics, r.submittedAt]);
  const csv = [headers, ...rows]
    .map(row => row.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${event.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-reflections.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function ReflectionsPanel({ event, reflections, canManage, dismissedPairs, onDelete, onMerge, onDismissPair }) {
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const query = q.trim().toLowerCase();
  const searched = query === ""
    ? reflections
    : reflections.filter(r => [r.name, r.email, r.content].filter(Boolean).some(v => v.toLowerCase().includes(query)));
  const filtered = useMemo(() => {
    const list = [...searched];
    list.sort((a, b) => {
      if (sortBy === "alpha-asc") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "alpha-desc") return (b.name || "").localeCompare(a.name || "");
      if (sortBy === "date-asc") return (a.submittedAt || "").localeCompare(b.submittedAt || "");
      return (b.submittedAt || "").localeCompare(a.submittedAt || "");
    });
    return list;
  }, [searched, sortBy]);

  const pairs = canManage ? findDuplicates(reflections, dismissedPairs) : [];

  return (
    <div className="space-y-2">
      {reflections.length > 0 && (
        <div className="flex items-center gap-1.5">
          <div className="whmi-input flex items-center gap-2 px-2.5 py-1.5 flex-1">
            <Search size={13} style={{ color: "var(--text-faint)" }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search reflections..." className="bg-transparent outline-none w-full text-[12.5px]" style={{ color: "var(--text)" }} />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="whmi-input px-2 py-1.5 text-[11.5px] shrink-0">
            {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </div>
      )}

      {canManage && <DuplicateWarnings pairs={pairs} onMerge={onMerge} onDismiss={onDismissPair} />}

      {reflections.length === 0 && (
        <div className="text-[12.5px] p-3" style={{ color: "var(--text-faint)" }}>No reflections submitted yet.</div>
      )}
      {reflections.length > 0 && filtered.length === 0 && (
        <div className="text-[12px] p-2" style={{ color: "var(--text-faint)" }}>No matches.</div>
      )}

      {filtered.map(r => (
        <div key={r.id} className="p-2.5 rounded-lg" style={{ background: "var(--surface-2)" }}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[12.5px] font-semibold">{r.name}</div>
              <div className="text-[11px]" style={{ color: "var(--text-faint)" }}>{r.email} · {fmtDate(r.submittedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10))}</div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {r.rating != null && <span className="whmi-badge" style={{ background: "var(--surface)", color: "var(--text-dim)" }}>Quality {r.rating}/10</span>}
              {r.relevanceRating != null && <span className="whmi-badge" style={{ background: "var(--surface)", color: "var(--text-dim)" }}>Relevance {r.relevanceRating}/10</span>}
              {canManage && onDelete && <button onClick={() => onDelete(r)} style={{ color: "#D9534F" }}><Trash2 size={13} /></button>}
            </div>
          </div>
          {r.appropriateness && <span className="whmi-badge mt-1.5 inline-block" style={{ background: "var(--surface)", color: "var(--text-dim)" }}>{r.appropriateness}</span>}
          <p className="text-[12px] mt-1.5 whitespace-pre-line" style={{ color: "var(--text-dim)" }}>{r.content}</p>
          {(r.mostValuable || r.improvements || r.futureTopics) && (
            <div className="mt-2 pt-2 space-y-1.5 text-[11.5px]" style={{ borderTop: "1px solid var(--border)" }}>
              {r.mostValuable && <div><span className="font-semibold" style={{ color: "var(--text-faint)" }}>Most valuable: </span><span style={{ color: "var(--text-dim)" }}>{r.mostValuable}</span></div>}
              {r.improvements && <div><span className="font-semibold" style={{ color: "var(--text-faint)" }}>Could improve: </span><span style={{ color: "var(--text-dim)" }}>{r.improvements}</span></div>}
              {r.futureTopics && <div><span className="font-semibold" style={{ color: "var(--text-faint)" }}>Future topics: </span><span style={{ color: "var(--text-dim)" }}>{r.futureTopics}</span></div>}
            </div>
          )}
        </div>
      ))}

      {canManage && reflections.length > 0 && (
        <button onClick={() => exportReflectionsCsv(event, reflections)} className="whmi-btn-ghost flex items-center gap-1.5 mt-2">
          <Download size={14} />Export Reflections
        </button>
      )}
    </div>
  );
}
