import { useState } from "react";
import { Table2, CalendarDays } from "lucide-react";
import YearCalendar from "../components/YearCalendar";
import { fmtDate } from "../lib/helpers";

export default function PreviousEvents({ previousEvents, onOpenArchive }) {
  const years = [...new Set(previousEvents.map(ev => new Date(`${ev.date}T00:00:00`).getFullYear()))].sort((a, b) => b - a);
  const currentYear = new Date().getFullYear();
  const [view, setView] = useState("table");
  const [year, setYear] = useState(years.includes(currentYear) ? currentYear : (years[0] || currentYear));

  return (
    <div className="whmi-fade-in p-6 max-w-[1400px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="disp text-[22px] font-extrabold">Previous Events</h1>
          <p className="text-[13px]" style={{ color: "var(--text-dim)" }}>Archive of completed WHMI CPD activities.</p>
        </div>
        <div className="flex items-center gap-2">
          {view === "calendar" && years.length > 0 && (
            <select value={year} onChange={e => setYear(Number(e.target.value))} className="whmi-input px-2.5 py-2 text-[12.5px]">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
          <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <button onClick={() => setView("table")} className="px-2.5 py-2 flex items-center gap-1.5 text-[12px] font-semibold" style={{ background: view === "table" ? "var(--accent-primary)" : "transparent", color: view === "table" ? "white" : "var(--text-dim)" }}>
              <Table2 size={13} />Table
            </button>
            <button onClick={() => setView("calendar")} className="px-2.5 py-2 flex items-center gap-1.5 text-[12px] font-semibold" style={{ background: view === "calendar" ? "var(--accent-primary)" : "transparent", color: view === "calendar" ? "white" : "var(--text-dim)" }}>
              <CalendarDays size={13} />Calendar
            </button>
          </div>
        </div>
      </div>

      {view === "table" ? (
        <div className="whmi-card overflow-x-auto whmi-scroll">
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Event", "Date", "Presenter", "Attendance", "Feedback"].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-[11.5px] uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previousEvents.map(ev => (
                <tr key={ev.id} className="whmi-row-hover cursor-pointer" style={{ borderBottom: "1px solid var(--border)" }} onClick={() => onOpenArchive(ev)}>
                  <td className="px-4 py-3 font-semibold break-words max-w-[260px]">{ev.title}<div className="text-[11px] font-normal mt-0.5" style={{ color: "var(--text-faint)" }}>{ev.topic}</div></td>
                  <td className="px-4 py-3" style={{ color: "var(--text-dim)" }}>{fmtDate(ev.date)}</td>
                  <td className="px-4 py-3" style={{ color: "var(--text-dim)" }}>{ev.presenter}</td>
                  <td className="px-4 py-3">{ev.attendance}/{ev.capacity}</td>
                  <td className="px-4 py-3">
                    <span className="whmi-badge" style={{ background: "rgba(156,203,59,.15)", color: "#7CA82F" }}>★ {ev.feedback}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        years.length === 0 ? (
          <div className="whmi-card p-6 text-center text-[12.5px]" style={{ color: "var(--text-faint)" }}>No completed events yet.</div>
        ) : (
          <YearCalendar year={year} events={previousEvents} onSelectEvent={onOpenArchive} />
        )
      )}
    </div>
  );
}
