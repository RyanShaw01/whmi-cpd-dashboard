import { useState, useMemo } from "react";
import { Globe, ChevronDown, ChevronRight, ExternalLink, ArrowDownUp, DollarSign, MapPin, Info } from "lucide-react";
import { fmtDate, daysUntil } from "../lib/helpers";

const OPEN_KEY = "whmi_external_cpd_open";
const SORT_KEY = "whmi_external_cpd_sort";

const readStored = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch { return fallback; }
};
const writeStored = (key, value) => {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
};

// One listing. Its own component so each row can hold its own "show description" state.
// The whole row is a link out to the provider, so the info toggle inside it has to stop the
// click reaching the anchor - hence role="button" on a span rather than a nested <button>,
// which isn't valid inside an <a>.
function ExternalCpdRow({ entry: e }) {
  const [showInfo, setShowInfo] = useState(false);
  const days = e.date ? daysUntil(e.date) : null;
  const past = days != null && days < 0;
  const d = e.date ? new Date(`${e.date}T00:00:00`) : null;
  const toggleInfo = (ev) => { ev.preventDefault(); ev.stopPropagation(); setShowInfo(v => !v); };

  return (
    <a
      href={e.url} target="_blank" rel="noreferrer"
      className="flex items-start gap-4 p-4 rounded-xl whmi-row-hover transition"
      style={{ border: "1px solid var(--border)", opacity: past ? 0.55 : 1 }}
    >
      {/* Calendar-chip date instead of a date buried mid-sentence in the meta line -
          the date is the thing people scan this list by. */}
      <div
        className="shrink-0 rounded-lg text-center flex flex-col items-center justify-center"
        style={{ width: 54, height: 54, background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        {d ? (
          <>
            <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--accent-secondary)" }}>
              {d.toLocaleDateString(undefined, { month: "short" })}
            </span>
            <span className="disp text-[19px] font-extrabold leading-none" style={{ color: "var(--text)" }}>{d.getDate()}</span>
          </>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-wide leading-tight" style={{ color: "var(--text-faint)" }}>Ongoing</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="font-bold text-[15px] leading-snug break-words flex items-start gap-1.5">
          <span>{e.title}</span>
          <ExternalLink size={12} style={{ color: "var(--text-faint)" }} className="shrink-0 mt-1" />
          {/* Only rendered when there's actually a description to show. */}
          {e.notes && (
            <span
              role="button" tabIndex={0}
              onClick={toggleInfo}
              onKeyDown={ev => { if (ev.key === "Enter" || ev.key === " ") toggleInfo(ev); }}
              aria-expanded={showInfo}
              aria-label={showInfo ? `Hide description of ${e.title}` : `Show description of ${e.title}`}
              title="More info"
              className="shrink-0 mt-0.5 rounded-full inline-flex items-center justify-center transition"
              style={{ width: 18, height: 18, cursor: "pointer", background: showInfo ? "var(--accent-secondary)" : "var(--surface-2)", color: showInfo ? "#fff" : "var(--text-faint)" }}
            >
              <Info size={12} />
            </span>
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[12.5px]">
          <span className="whmi-badge" style={{ background: "rgba(53,168,221,.12)", color: "var(--accent-secondary)" }}>{e.provider}</span>
          {e.location && (
            <span className="flex items-center gap-1" style={{ color: "var(--text-dim)" }}>
              <MapPin size={12} className="shrink-0" />{e.location}
            </span>
          )}
          {d && (
            <>
              <span style={{ color: "var(--text-faint)" }}>·</span>
              <span style={{ color: "var(--text-dim)" }}>{fmtDate(e.date)}</span>
            </>
          )}
        </div>
        {showInfo && e.notes && (
          <div className="text-[12.5px] mt-2 p-2.5 rounded-lg leading-relaxed" style={{ background: "var(--surface-2)", color: "var(--text-dim)" }}>
            {e.notes}
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        {/* Cost is free text - "Free", "$95", "Members free / $50" all valid - so it's
            only styled as free when it actually says so. */}
        {e.cost && (
          <span
            className="whmi-badge text-[12px]"
            style={/^free$/i.test(e.cost.trim())
              ? { background: "rgba(156,203,59,.15)", color: "#7CA82F" }
              : { background: "var(--surface-2)", color: "var(--text-dim)" }}
          >
            <DollarSign size={11} />{e.cost}
          </span>
        )}
        {days != null && days >= 0 && days <= 30 && (
          <span className="text-[11.5px] font-bold whitespace-nowrap" style={{ color: "var(--accent-primary)" }}>
            {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `in ${days} days`}
          </span>
        )}
      </div>
    </a>
  );
}

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
        <div className="mt-4 space-y-2.5">
          {sorted.length === 0 && (
            <div className="text-[12.5px] text-center py-3" style={{ color: "var(--text-faint)" }}>
              No external CPD listed at the moment.
            </div>
          )}
          {sorted.map(e => <ExternalCpdRow key={e.id} entry={e} />)}
        </div>
      )}
    </div>
  );
}
