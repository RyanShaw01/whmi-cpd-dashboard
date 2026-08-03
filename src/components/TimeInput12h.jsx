import { useState, useEffect, useRef } from "react";

// Stores/emits the same "HH:MM" 24-hour string the rest of the app expects
// (formatDuration, fmtTime12h, etc.), but always displays as 12-hour with AM/PM
// regardless of the browser/OS locale, and defaults to PM when empty.
function to12h(hhmm) {
  if (!hhmm) return { hour: "", minute: "", period: "PM" };
  const [h, m] = hhmm.split(":").map(Number);
  if ([h, m].some(Number.isNaN)) return { hour: "", minute: "", period: "PM" };
  const period = h >= 12 ? "PM" : "AM";
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour: String(hour12), minute: String(m).padStart(2, "0"), period };
}

function to24h(hour, minute, period) {
  let h = parseInt(hour, 10);
  if (Number.isNaN(h)) h = 0;
  const m = parseInt(minute, 10) || 0;
  if (period === "AM") { if (h === 12) h = 0; } else if (h !== 12) h += 12;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function TimeInput12h({ value, onChange }) {
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [period, setPeriod] = useState("PM");
  const minuteRef = useRef(null);
  const periodRef = useRef(null);

  useEffect(() => {
    // Skip resyncing from `value` when it's just the echo of what this component itself
    // just emitted (every keystroke round-trips through the parent's onChange) — otherwise
    // to12h()'s zero-padding stomps an in-progress single-digit minute (e.g. "3" -> "03")
    // before the user finishes typing the second digit.
    if (hour && minute !== "" && to24h(hour, minute, period) === value) return;
    const n = to12h(value);
    setHour(n.hour);
    setMinute(n.minute);
    setPeriod(n.period);
  }, [value]);

  const commit = (h, m, p) => {
    if (h && m !== "") onChange(to24h(h, m, p));
  };

  const handleHour = (e) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 2);
    if (v && Number(v) > 12) v = v.slice(-1);
    setHour(v);
    if (v && (Number(v) >= 2 || v.length === 2)) {
      minuteRef.current?.focus();
      minuteRef.current?.select();
    }
    commit(v, minute, period);
  };

  const handleMinute = (e) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 2);
    if (v && Number(v) > 59) v = v.slice(0, 1);
    setMinute(v);
    if (v.length === 2) periodRef.current?.focus();
    commit(hour, v, period);
  };

  const handlePeriod = (e) => {
    setPeriod(e.target.value);
    commit(hour, minute, e.target.value);
  };

  return (
    <div className="whmi-input flex items-center gap-1 px-2.5 py-2">
      <input
        inputMode="numeric" placeholder="hh" value={hour} onChange={handleHour}
        className="w-5 bg-transparent outline-none text-center" style={{ color: "var(--text)" }}
      />
      <span style={{ color: "var(--text-faint)" }}>:</span>
      <input
        ref={minuteRef} inputMode="numeric" placeholder="mm" value={minute} onChange={handleMinute}
        className="w-5 bg-transparent outline-none text-center" style={{ color: "var(--text)" }}
      />
      <select ref={periodRef} value={period} onChange={handlePeriod} className="bg-transparent outline-none text-[12px] font-semibold ml-1" style={{ color: "var(--text)" }}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}
