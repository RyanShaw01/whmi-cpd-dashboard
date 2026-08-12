import { useState, useMemo } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { fmtDate } from "../lib/helpers";

const SORT_OPTIONS = [
  { id: "firstName", label: "First Name" },
  { id: "lastName", label: "Last Name" },
  { id: "lastAttended", label: "Latest CPD Event" },
  { id: "hours", label: "Total CPD Hours" },
  { id: "hoursLast3Years", label: "CPD Hours (Past 3 Years)" },
];

function firstName(s) { return s.name.split(" ")[0]; }
function lastName(s) { return s.name.split(" ").slice(-1)[0]; }

// External participants aren't tracked via attendance/events like staff - certificates issued to
// their email are the only signal, so their "quick stats" row is derived from those instead of
// pre-aggregated fields on the record itself.
function externalStatsRows(externalParticipants, certificates) {
  return externalParticipants.map(p => {
    const mine = certificates.filter(c => c.recipientEmail?.toLowerCase() === p.email?.toLowerCase() && c.status === "Sent");
    const hours = Math.round(mine.reduce((sum, c) => sum + (c.cpdHours || 0), 0) * 10) / 10;
    const lastAttended = mine.reduce((latest, c) => (!latest || (c.date && c.date > latest)) ? c.date : latest, null);
    return { ...p, hours, hoursLast3Years: null, eventsThisYear: null, attended: mine.length, lastAttended };
  });
}

function StatsTable({ rows, sortBy, setSortBy, desc, setDesc, onSelect, emptyLabel }) {
  const sorted = useMemo(() => {
    const list = [...rows];
    list.sort((a, b) => {
      let av, bv;
      switch (sortBy) {
        case "firstName": av = firstName(a); bv = firstName(b); break;
        case "lastName": av = lastName(a); bv = lastName(b); break;
        case "lastAttended": av = a.lastAttended || ""; bv = b.lastAttended || ""; break;
        case "hours": av = a.hours; bv = b.hours; break;
        case "hoursLast3Years": av = a.hoursLast3Years ?? 0; bv = b.hoursLast3Years ?? 0; break;
        default: av = ""; bv = "";
      }
      if (typeof av === "string") return desc ? bv.localeCompare(av) : av.localeCompare(bv);
      return desc ? bv - av : av - bv;
    });
    return list;
  }, [rows, sortBy, desc]);

  if (sorted.length === 0) return <div className="text-[12px] text-center py-3" style={{ color: "var(--text-faint)" }}>{emptyLabel}</div>;

  return (
    <div className="overflow-auto whmi-scroll max-h-[260px]">
      <table className="w-full text-[11.5px]">
        <thead className="sticky top-0" style={{ background: "var(--surface)" }}>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["Name", "Total Hours", `Hours (Past 3 Years)`, "Events This Year", "Total Events", "Last Attended"].map(h => (
              <th key={h} className="text-left px-2.5 py-1.5 font-semibold text-[10px] uppercase tracking-wide whitespace-nowrap" style={{ color: "var(--text-faint)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(s => (
            <tr
              key={s.id}
              onClick={onSelect ? () => onSelect(s) : undefined}
              className="whmi-row-hover"
              style={{ borderBottom: "1px solid var(--border)", cursor: onSelect ? "pointer" : "default" }}
            >
              <td className="px-2.5 py-1.5 font-semibold whitespace-nowrap">{s.name}</td>
              <td className="px-2.5 py-1.5">{s.hours}</td>
              <td className="px-2.5 py-1.5">{s.hoursLast3Years ?? "—"}</td>
              <td className="px-2.5 py-1.5">{s.eventsThisYear ?? "—"}</td>
              <td className="px-2.5 py-1.5">{s.attended}</td>
              <td className="px-2.5 py-1.5 whitespace-nowrap">{s.lastAttended ? fmtDate(s.lastAttended) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function StaffQuickStats({ staffDirectory, onSelectStaff, query = "", externalParticipants, certificates, onSelectExternal }) {
  const [sortBy, setSortBy] = useState("lastName");
  const [desc, setDesc] = useState(false);
  const [extSortBy, setExtSortBy] = useState("lastName");
  const [extDesc, setExtDesc] = useState(false);

  const q = query.trim().toLowerCase();
  const internalRows = useMemo(
    () => (q ? staffDirectory.filter(s => s.name.toLowerCase().includes(q)) : staffDirectory),
    [staffDirectory, q],
  );
  // Kept separate from internalRows by default (own heading, own table, own sort state) rather
  // than merged into one ranked list - internal staff and external participants aren't really
  // comparable on the same "CPD hours" scale, and mixing them made it easy to mistake one for
  // the other.
  const externalRows = useMemo(() => {
    if (!externalParticipants) return null;
    const rows = externalStatsRows(externalParticipants, certificates || []);
    return q ? rows.filter(p => p.name.toLowerCase().includes(q)) : rows;
  }, [externalParticipants, certificates, q]);

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between gap-1.5 mb-2">
          <div className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>
            Internal Staff{query.trim() && ` — ${internalRows.length} matching "${query.trim()}"`}
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="whmi-input px-2 py-1 text-[11px]">
              {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            <button onClick={() => setDesc(d => !d)} className="whmi-btn-ghost !p-1.5" title={desc ? "Descending" : "Ascending"}>
              {desc ? <ArrowDown size={13} /> : <ArrowUp size={13} />}
            </button>
          </div>
        </div>
        <StatsTable rows={internalRows} sortBy={sortBy} setSortBy={setSortBy} desc={desc} setDesc={setDesc} onSelect={onSelectStaff} emptyLabel={`No staff match "${query.trim()}".`} />
      </div>

      {externalRows && (
        <div>
          <div className="flex items-center justify-between gap-1.5 mb-2">
            <div className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>
              External Participants{query.trim() && ` — ${externalRows.length} matching "${query.trim()}"`}
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <select value={extSortBy} onChange={e => setExtSortBy(e.target.value)} className="whmi-input px-2 py-1 text-[11px]">
                {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
              <button onClick={() => setExtDesc(d => !d)} className="whmi-btn-ghost !p-1.5" title={extDesc ? "Descending" : "Ascending"}>
                {extDesc ? <ArrowDown size={13} /> : <ArrowUp size={13} />}
              </button>
            </div>
          </div>
          <StatsTable rows={externalRows} sortBy={extSortBy} setSortBy={setExtSortBy} desc={extDesc} setDesc={setExtDesc} onSelect={onSelectExternal} emptyLabel={`No external participants match "${query.trim()}".`} />
        </div>
      )}
    </div>
  );
}
