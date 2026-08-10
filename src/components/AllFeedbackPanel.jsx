import { useState, useMemo, useEffect } from "react";
import { Search, Layers, LayoutList, Star } from "lucide-react";
import { fmtDate } from "../lib/helpers";

const SORT_OPTIONS = [
  { id: "date-desc", label: "Newest - Oldest" },
  { id: "date-asc", label: "Oldest - Newest" },
  { id: "alpha-asc", label: "Alphabetical (A - Z)" },
  { id: "alpha-desc", label: "Alphabetical (Z - A)" },
  { id: "rating-desc", label: "Highest Rated" },
  { id: "rating-asc", label: "Lowest Rated" },
  { id: "event", label: "By Event" },
];

function FeedbackRow({ r }) {
  return (
    <div className="p-2.5 rounded-lg" style={{ background: "var(--surface-2)" }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[12.5px] font-semibold">{r.name}</div>
          <div className="text-[11px]" style={{ color: "var(--text-faint)" }}>{fmtDate(r.submittedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10))}</div>
        </div>
        {r.rating != null && (
          <div className="flex items-center gap-1 shrink-0 text-[12px] font-semibold" style={{ color: "var(--accent-primary)" }}>
            <Star size={12} fill="currentColor" />{r.rating}/10
          </div>
        )}
      </div>
      {r.content && <p className="text-[12px] mt-1.5 whitespace-pre-line" style={{ color: "var(--text-dim)" }}>{r.content}</p>}
    </div>
  );
}

export default function AllFeedbackPanel({ events, reflections, defaultOpen = false, forceOpenSignal }) {
  const [open, setOpen] = useState(defaultOpen);
  // Bumped by the parent (e.g. clicking the "Avg. Feedback" quick stat) to force this open even
  // after mount, when `defaultOpen` alone can't reach it anymore.
  useEffect(() => { if (forceOpenSignal) setOpen(true); }, [forceOpenSignal]);
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [separate, setSeparate] = useState(false);

  const eventById = useMemo(() => new Map(events.map(e => [e.id, e])), [events]);
  const feedback = useMemo(() => reflections.filter(r => eventById.has(r.eventId) && r.content), [reflections, eventById]);

  const query = q.trim().toLowerCase();
  const searched = query === ""
    ? feedback
    : feedback.filter(r => [r.name, r.email, r.content, eventById.get(r.eventId)?.title].filter(Boolean).some(v => v.toLowerCase().includes(query)));

  const sorted = useMemo(() => {
    const list = [...searched];
    list.sort((a, b) => {
      if (sortBy === "alpha-asc") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "alpha-desc") return (b.name || "").localeCompare(a.name || "");
      if (sortBy === "rating-desc") return (b.rating ?? -1) - (a.rating ?? -1);
      if (sortBy === "rating-asc") return (a.rating ?? 999) - (b.rating ?? 999);
      if (sortBy === "event") {
        const et = (eventById.get(a.eventId)?.title || "").localeCompare(eventById.get(b.eventId)?.title || "");
        return et !== 0 ? et : (b.submittedAt || "").localeCompare(a.submittedAt || "");
      }
      if (sortBy === "date-asc") return (a.submittedAt || "").localeCompare(b.submittedAt || "");
      return (b.submittedAt || "").localeCompare(a.submittedAt || "");
    });
    return list;
  }, [searched, sortBy, eventById]);

  const eventGroups = useMemo(() => {
    const groups = new Map();
    for (const r of searched) {
      if (!groups.has(r.eventId)) groups.set(r.eventId, { event: eventById.get(r.eventId), items: [] });
      groups.get(r.eventId).items.push(r);
    }
    return [...groups.values()].sort((a, b) => sortBy === "alpha-desc" ? b.event.title.localeCompare(a.event.title) : a.event.title.localeCompare(b.event.title));
  }, [searched, eventById, sortBy]);

  return (
    <div className="whmi-card p-5">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between mb-1">
        <div>
          <h2 className="disp text-[15px] font-bold text-left">Feedback</h2>
          <p className="text-[11.5px] text-left" style={{ color: "var(--text-faint)" }}>{feedback.length} feedback response{feedback.length === 1 ? "" : "s"} from submitted reflections.</p>
        </div>
        <span className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>{open ? "Collapse" : "Expand"}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
              {!separate && (
                <>
                  <div className="whmi-input flex items-center gap-2 px-2.5 py-1.5 flex-1">
                    <Search size={13} style={{ color: "var(--text-faint)" }} />
                    <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search feedback..." className="bg-transparent outline-none w-full text-[12.5px]" style={{ color: "var(--text)" }} />
                  </div>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="whmi-input px-2 py-1.5 text-[11.5px] shrink-0">
                    {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                </>
              )}
            </div>
            <button
              onClick={() => setSeparate(s => !s)}
              className="whmi-btn-ghost flex items-center gap-1.5 text-[12px] shrink-0"
              title={separate ? "Show as one combined list" : "Show as separate lists per event"}
            >
              {separate ? <LayoutList size={14} /> : <Layers size={14} />}
              {separate ? "Combine List" : "Separate by Event"}
            </button>
          </div>

          {feedback.length === 0 ? (
            <div className="text-[12.5px] p-3 text-center" style={{ color: "var(--text-faint)" }}>No feedback submitted yet.</div>
          ) : separate ? (
            <div className="space-y-4">
              {eventGroups.map(({ event, items }) => (
                <div key={event?.id || "unknown"} className="whmi-card p-4" style={{ background: "var(--surface-2)" }}>
                  <div className="mb-2">
                    <div className="font-semibold text-[13px]">{event?.title || "Unknown event"}</div>
                    {event && <div className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>{fmtDate(event.date)}</div>}
                  </div>
                  <div className="space-y-1.5">{items.map(r => <FeedbackRow key={r.id} r={r} />)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {sorted.length === 0 && <div className="text-[12px] p-2" style={{ color: "var(--text-faint)" }}>No matches.</div>}
              {sorted.map(r => (
                <div key={r.id}>
                  <div className="text-[10.5px] font-semibold mb-0.5" style={{ color: "var(--accent-primary)" }}>{eventById.get(r.eventId)?.title}</div>
                  <FeedbackRow r={r} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
