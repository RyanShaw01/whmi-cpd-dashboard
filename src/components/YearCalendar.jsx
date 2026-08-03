const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function MonthGrid({ year, month, eventsByDate, onSelectEvent }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div className="whmi-card p-3">
      <div className="text-[12px] font-bold mb-2 text-center">{MONTH_NAMES[month]}</div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {WEEKDAY_LABELS.map((w, i) => (
          <div key={i} className="text-[9px] font-semibold" style={{ color: "var(--text-faint)" }}>{w}</div>
        ))}
        {cells.map((day, i) => {
          if (day == null) return <div key={i} />;
          const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayEvents = eventsByDate[key];
          return (
            <button
              key={i}
              type="button"
              disabled={!dayEvents}
              onClick={() => dayEvents && onSelectEvent(dayEvents[0])}
              title={dayEvents ? dayEvents.map(e => e.title).join(", ") : undefined}
              className="aspect-square flex items-center justify-center rounded-full text-[10px] relative"
              style={{
                background: dayEvents ? "var(--accent-primary)" : "transparent",
                color: dayEvents ? "white" : "var(--text-dim)",
                fontWeight: dayEvents ? 700 : 400,
                cursor: dayEvents ? "pointer" : "default",
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function YearCalendar({ year, events, onSelectEvent }) {
  const eventsByDate = {};
  events.forEach(ev => {
    if (!ev.date) return;
    if (new Date(`${ev.date}T00:00:00`).getFullYear() !== year) return;
    if (!eventsByDate[ev.date]) eventsByDate[ev.date] = [];
    eventsByDate[ev.date].push(ev);
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: 12 }, (_, month) => (
        <MonthGrid key={month} year={year} month={month} eventsByDate={eventsByDate} onSelectEvent={onSelectEvent} />
      ))}
    </div>
  );
}
