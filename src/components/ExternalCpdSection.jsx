import { useState, useMemo } from "react";
import { Globe, ChevronDown, ChevronRight, ExternalLink, ArrowDownUp, DollarSign, MapPin } from "lucide-react";
import { fmtDate, daysUntil } from "../lib/helpers";

const OPEN_KEY = "whmi_external_cpd_open";
const SORT_KEY = "whmi_external_cpd_sort";

const readStored = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch { return fallback; }
};
const writeStored = (key, value) => {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
};

// CPD run by other organisations, so every row is an outbound link rather than something
// registerable here. Collapsed/expanded state and sort direction are remembered per browser.
export default function ExternalCpdSection({ entries = [] }) {
  const [open, setOpen] = useState(() => readStored(OPEN_KEY, "true") === "true");
  const [sortAsc, setSortAsc] = useState(() => readStored(SORT_KEY, "asc") === "asc");

  const toggleOpen = () => { const next = !open; setOpen(next); writeStored(OPEN_KEY, String(next)); };
  const toggleSort = () => { const next = !sortAsc; setSortAsc(next); writeStored(SORT_KEY, next ? "asc" : "desc"); };

  const sorted = useMemo(() => {
    const dated = entries.filter(e => e.date);
    const undated = entries.filter(e => !e.date);
    dated.sort((a, b) => (sortAsc ? 1 : -1) * a.date.localeCompare(b.date));
    // Ongoing programmes have no date to sort by, so they always sit at the end rather than
    // jumping to the top under one sort direction and the bottom under the other.
    return [...dated, ...undated];
  }, [entries, sortAsc]);

  const upcomingCount = entries.filter(e => !e.date || daysUntil(e.date) >= 0).length;

  return (
    <div className="whmi-card p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button onClick={toggleOpen} className="flex items-center gap-2 min-w-0 flex-1 text-left" aria-expanded={open}>
          {open ? <ChevronDown size={15} style={{ color: "var(--text-faint)" }} className="shrink-0" />
                : <ChevronRight size={15} style={{ color: "var(--text-faint)" }} className="shrink-0" />}
          <Globe size={16} style={{ color: "var(--accent-secondary)" }} className="shrink-0" />
          <span className="min-w-0">
            <span className="disp text-[15px] font-bold block">Browse External CPD</span>
            <span className="text-[11.5px] block" style={{ color: "var(--text-faint)" }}>
              CPD offered by other organisations — not run by Western Health
            </span>
          </span>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>{upcomingCount}</span>
          {open && entries.length > 1 && (
            <button onClick={toggleSort} className="whmi-btn-ghost !py-1.5 !px-2.5 text-[11.5px] flex items-center gap-1.5">
              <ArrowDownUp size={12} />{sortAsc ? "Soonest first" : "Furthest first"}
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="mt-4 space-y-2">
          {sorted.length === 0 && (
            <div className="text-[12.5px] text-center py-3" style={{ color: "var(--text-faint)" }}>
              No external CPD listed at the moment.
            </div>
          )}
          {sorted.map(e => {
            const days = e.date ? daysUntil(e.date) : null;
            const past = days != null && days < 0;
            return (
              <a
                key={e.id} href={e.url} target="_blank" rel="noreferrer"
                className="flex items-start justify-between gap-3 p-3 rounded-xl whmi-row-hover transition"
                style={{ border: "1px solid var(--border)", opacity: past ? 0.55 : 1 }}
              >
                <div className="min-w-0">
                  <div className="font-semibold text-[13px] break-words flex items-center gap-1.5">
                    {e.title}
                    <ExternalLink size={11} style={{ color: "var(--text-faint)" }} className="shrink-0" />
                  </div>
                  <div className="text-[11.5px] mt-0.5 flex items-center gap-x-2 gap-y-0.5 flex-wrap" style={{ color: "var(--text-faint)" }}>
                    <span className="font-semibold" style={{ color: "var(--accent-secondary)" }}>{e.provider}</span>
                    <span>·</span>
                    <span>{e.date ? fmtDate(e.date) : "Ongoing"}</span>
                    {e.location && (<><span>·</span><span className="flex items-center gap-1"><MapPin size={10} />{e.location}</span></>)}
                  </div>
                  {e.notes && <div className="text-[11.5px] mt-1" style={{ color: "var(--text-dim)" }}>{e.notes}</div>}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {/* Cost is free text - "Free", "$95", "Members free / $50" all valid - so it's
                      only styled as free when it actually says so. */}
                  {e.cost && (
                    <span
                      className="whmi-badge"
                      style={/^free$/i.test(e.cost.trim())
                        ? { background: "rgba(156,203,59,.15)", color: "#7CA82F" }
                        : { background: "var(--surface-2)", color: "var(--text-dim)" }}
                    >
                      <DollarSign size={10} />{e.cost}
                    </span>
                  )}
                  {days != null && days >= 0 && days <= 30 && (
                    <span className="text-[10.5px] font-semibold" style={{ color: "var(--accent-primary)" }}>
                      {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `in ${days} days`}
                    </span>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
