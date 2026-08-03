import { useState, useRef, useEffect } from "react";
import { Search, X, FileText, Award, MessageSquareText, Compass, BookOpen } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { HELP_ARTICLES } from "../data/helpContent";

const PAGES = [
  { label: "Dashboard", page: "dashboard" },
  { label: "Upcoming Events", page: "upcoming" },
  { label: "Previous Events", page: "previous" },
  { label: "Staff", page: "staff" },
  { label: "Reports & Analytics", page: "reports" },
  { label: "Certificates", page: "certificates" },
  { label: "Help Centre", page: "help" },
  { label: "Settings", page: "settings" },
];

export default function SearchDropdown({
  events, previousEvents, staffDirectory, openEvent, openStaff,
  openArchiveEvent, certificates, reflections, files, onNavigatePage,
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const onClick = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const query = q.trim().toLowerCase();
  const upcomingEvents = events || [];
  const pastEvents = previousEvents || [];
  const allEvents = [...upcomingEvents, ...pastEvents];

  const openEventById = (eventId) => {
    if (upcomingEvents.some(e => e.id === eventId)) {
      const ev = upcomingEvents.find(e => e.id === eventId);
      openEvent(ev);
    } else if (openArchiveEvent) {
      const ev = pastEvents.find(e => e.id === eventId);
      if (ev) openArchiveEvent(ev);
    }
  };

  const matchedEvents = query === "" ? [] : allEvents.filter(e =>
    e.title?.toLowerCase().includes(query) ||
    e.topic?.toLowerCase().includes(query) ||
    e.presenter?.toLowerCase().includes(query) ||
    (e.tags || []).some(t => t.toLowerCase().includes(query))
  ).slice(0, 6);

  const matchedStaff = query === "" ? [] : (staffDirectory || []).filter(s => s.name.toLowerCase().includes(query)).slice(0, 6);

  const matchedCertificates = query === "" ? [] : (certificates || []).filter(c =>
    c.staff?.toLowerCase().includes(query) || c.event?.toLowerCase().includes(query)
  ).slice(0, 6);

  const matchedReflections = query === "" ? [] : (reflections || []).filter(r =>
    r.name?.toLowerCase().includes(query) || r.email?.toLowerCase().includes(query) || r.content?.toLowerCase().includes(query)
  ).slice(0, 6);

  const matchedFiles = query === "" ? [] : (files || []).filter(f =>
    f.storagePath?.toLowerCase().includes(query) || f.kind?.toLowerCase().includes(query)
  ).slice(0, 6);

  const matchedPages = query === "" ? [] : PAGES.filter(p => p.label.toLowerCase().includes(query)).slice(0, 4);

  const matchedHelp = query === "" ? [] : HELP_ARTICLES.filter(a =>
    a.title.toLowerCase().includes(query) || a.body?.toLowerCase().includes(query) || (a.steps || []).some(s => s.toLowerCase().includes(query))
  ).slice(0, 4);

  const hasResults = matchedEvents.length > 0 || matchedStaff.length > 0 || matchedCertificates.length > 0 ||
    matchedReflections.length > 0 || matchedFiles.length > 0 || matchedPages.length > 0 || matchedHelp.length > 0;

  const pick = (fn, item) => { fn(item); setOpen(false); setQ(""); };
  const pickEvent = (eventId) => { openEventById(eventId); setOpen(false); setQ(""); };
  const pickPage = (page) => { onNavigatePage?.(page); setOpen(false); setQ(""); };

  const eventTitle = (eventId) => allEvents.find(e => e.id === eventId)?.title || "Unknown event";

  return (
    <div className="relative" ref={rootRef}>
      <button onClick={() => setOpen(o => !o)} className="whmi-btn-ghost !p-2" title="Search">
        <Search size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-11 whmi-card w-80 max-h-96 overflow-y-auto whmi-scroll whmi-fade-in z-50 p-3">
          <div className="whmi-input flex items-center gap-2 px-2.5 py-1.5 mb-2">
            <Search size={13} style={{ color: "var(--text-faint)" }} />
            <input
              ref={inputRef}
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search events, staff, certificates..."
              className="bg-transparent outline-none w-full text-[13px]"
              style={{ color: "var(--text)" }}
            />
            {q && <button onClick={() => setQ("")}><X size={13} style={{ color: "var(--text-faint)" }} /></button>}
          </div>

          {query === "" && (
            <p className="text-[12px] px-1 py-2" style={{ color: "var(--text-faint)" }}>Type to search events, staff, certificates, reflections, documents, pages, or help articles.</p>
          )}

          {query !== "" && !hasResults && (
            <p className="text-[12px] px-1 py-2" style={{ color: "var(--text-faint)" }}>No matches. Try a different term.</p>
          )}

          {matchedPages.length > 0 && (
            <div className="mb-2">
              <div className="text-[10.5px] font-bold px-1 mb-1" style={{ color: "var(--text-faint)" }}>PAGES</div>
              {matchedPages.map(p => (
                <button key={p.page} onClick={() => pickPage(p.page)} className="w-full text-left px-2 py-2 rounded-lg whmi-row-hover flex items-center gap-2">
                  <Compass size={13} style={{ color: "var(--text-faint)" }} className="shrink-0" />
                  <span className="text-[12.5px] font-semibold">{p.label}</span>
                </button>
              ))}
            </div>
          )}

          {matchedEvents.length > 0 && (
            <div className="mb-2">
              <div className="text-[10.5px] font-bold px-1 mb-1" style={{ color: "var(--text-faint)" }}>EVENTS</div>
              {matchedEvents.map(e => (
                <button key={e.id} onClick={() => pick(upcomingEvents.some(u => u.id === e.id) ? openEvent : openArchiveEvent, e)} className="w-full text-left px-2 py-2 rounded-lg whmi-row-hover flex items-center justify-between gap-2">
                  <span className="text-[12.5px] font-semibold break-words">{e.title}</span>
                  <StatusBadge status={e.status || "Completed"} />
                </button>
              ))}
            </div>
          )}

          {matchedStaff.length > 0 && (
            <div className="mb-2">
              <div className="text-[10.5px] font-bold px-1 mb-1" style={{ color: "var(--text-faint)" }}>STAFF</div>
              {matchedStaff.map(s => (
                <button key={s.id} onClick={() => pick(openStaff, s)} className="w-full text-left px-2 py-2 rounded-lg whmi-row-hover flex items-center justify-between gap-2">
                  <span className="text-[12.5px] font-semibold">{s.name}</span>
                  <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>{s.profession}</span>
                </button>
              ))}
            </div>
          )}

          {matchedCertificates.length > 0 && (
            <div className="mb-2">
              <div className="text-[10.5px] font-bold px-1 mb-1" style={{ color: "var(--text-faint)" }}>CERTIFICATES</div>
              {matchedCertificates.map(c => (
                <button key={c.id} onClick={() => pickEvent(c.eventId)} className="w-full text-left px-2 py-2 rounded-lg whmi-row-hover flex items-center gap-2">
                  <Award size={13} style={{ color: "var(--text-faint)" }} className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-semibold truncate">{c.staff}</div>
                    <div className="text-[11px] truncate" style={{ color: "var(--text-faint)" }}>{c.event}</div>
                  </div>
                  <StatusBadge status={c.status} />
                </button>
              ))}
            </div>
          )}

          {matchedReflections.length > 0 && (
            <div className="mb-2">
              <div className="text-[10.5px] font-bold px-1 mb-1" style={{ color: "var(--text-faint)" }}>REFLECTIONS</div>
              {matchedReflections.map(r => (
                <button key={r.id} onClick={() => pickEvent(r.eventId)} className="w-full text-left px-2 py-2 rounded-lg whmi-row-hover flex items-center gap-2">
                  <MessageSquareText size={13} style={{ color: "var(--text-faint)" }} className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-semibold truncate">{r.name}</div>
                    <div className="text-[11px] truncate" style={{ color: "var(--text-faint)" }}>{r.eventTitle || eventTitle(r.eventId)}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {matchedFiles.length > 0 && (
            <div className="mb-2">
              <div className="text-[10.5px] font-bold px-1 mb-1" style={{ color: "var(--text-faint)" }}>DOCUMENTS</div>
              {matchedFiles.map(f => (
                <button key={f.id} onClick={() => pickEvent(f.eventId)} className="w-full text-left px-2 py-2 rounded-lg whmi-row-hover flex items-center gap-2">
                  <FileText size={13} style={{ color: "var(--text-faint)" }} className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-semibold truncate">{f.storagePath?.split("/").pop()}</div>
                    <div className="text-[11px] truncate" style={{ color: "var(--text-faint)" }}>{eventTitle(f.eventId)}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {matchedHelp.length > 0 && (
            <div>
              <div className="text-[10.5px] font-bold px-1 mb-1" style={{ color: "var(--text-faint)" }}>HELP ARTICLES</div>
              {matchedHelp.map(a => (
                <button key={a.id} onClick={() => pickPage("help")} className="w-full text-left px-2 py-2 rounded-lg whmi-row-hover flex items-center gap-2">
                  <BookOpen size={13} style={{ color: "var(--text-faint)" }} className="shrink-0" />
                  <span className="text-[12.5px] font-semibold truncate">{a.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
