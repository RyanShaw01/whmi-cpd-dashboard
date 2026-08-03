import { useState, useMemo } from "react";
import { ArrowUp, ArrowDown, BarChart3 } from "lucide-react";
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

export default function StaffQuickStats({ staffDirectory }) {
  const [sortBy, setSortBy] = useState("lastName");
  const [desc, setDesc] = useState(false);

  const currentYear = new Date().getFullYear();

  const sorted = useMemo(() => {
    const list = [...staffDirectory];
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
  }, [staffDirectory, sortBy, desc]);

  return (
    <div className="whmi-card p-5">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h2 className="disp text-[15px] font-bold flex items-center gap-2"><BarChart3 size={16} style={{ color: "var(--accent-primary)" }} />Staff Quick Stats</h2>
        <div className="flex items-center gap-1.5">
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="whmi-input px-2 py-1.5 text-[12px]">
            {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <button onClick={() => setDesc(d => !d)} className="whmi-btn-ghost !p-2" title={desc ? "Descending" : "Ascending"}>
            {desc ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto whmi-scroll">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Name", "Total Hours", `Hours (${currentYear - 2}–${currentYear})`, "Events This Year", "Total Events", "Last Attended"].map(h => (
                <th key={h} className="text-left px-3 py-2 font-semibold text-[10.5px] uppercase tracking-wide whitespace-nowrap" style={{ color: "var(--text-faint)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(s => (
              <tr key={s.id} className="whmi-row-hover" style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="px-3 py-2.5 font-semibold whitespace-nowrap">{s.name}</td>
                <td className="px-3 py-2.5">{s.hours}</td>
                <td className="px-3 py-2.5">{s.hoursLast3Years ?? "—"}</td>
                <td className="px-3 py-2.5">{s.eventsThisYear ?? "—"}</td>
                <td className="px-3 py-2.5">{s.attended}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">{s.lastAttended ? fmtDate(s.lastAttended) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
