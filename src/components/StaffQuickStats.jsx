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

export default function StaffQuickStats({ staffDirectory, onSelectStaff }) {
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
    <div>
      <div className="flex items-center justify-end gap-1.5 mb-2">
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="whmi-input px-2 py-1 text-[11px]">
          {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <button onClick={() => setDesc(d => !d)} className="whmi-btn-ghost !p-1.5" title={desc ? "Descending" : "Ascending"}>
          {desc ? <ArrowDown size={13} /> : <ArrowUp size={13} />}
        </button>
      </div>
      <div className="overflow-auto whmi-scroll max-h-[260px]">
        <table className="w-full text-[11.5px]">
          <thead className="sticky top-0" style={{ background: "var(--surface)" }}>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Name", "Total Hours", `Hours (${currentYear - 2}–${currentYear})`, "Events This Year", "Total Events", "Last Attended"].map(h => (
                <th key={h} className="text-left px-2.5 py-1.5 font-semibold text-[10px] uppercase tracking-wide whitespace-nowrap" style={{ color: "var(--text-faint)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(s => (
              <tr
                key={s.id}
                onClick={onSelectStaff ? () => onSelectStaff(s) : undefined}
                className="whmi-row-hover"
                style={{ borderBottom: "1px solid var(--border)", cursor: onSelectStaff ? "pointer" : "default" }}
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
    </div>
  );
}
