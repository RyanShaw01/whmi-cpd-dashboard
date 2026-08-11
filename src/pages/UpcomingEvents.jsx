import { useState, useEffect, useRef, useMemo } from "react";
import { Plus, Calendar, Clock, MapPin, UserCircle2, Link2, Pencil, ClipboardList, Lightbulb, LayoutGrid, List, Users, Radio } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import ModeBadge from "../components/ModeBadge";
import AllRegistrationsPanel from "../components/AllRegistrationsPanel";
import RegisterOrUnregister from "../components/EventRegisterControl";
import RecentlyCompletedCard from "../components/RecentlyCompletedCard";
import PresenterLine from "../components/PresenterLine";
import { fmtDate, canJoinMeeting, fmtTimeRange12h, eventBannerUrl, eventLocationSuffix, eventCountdownText, isRecentlyCompleted, getEventCardViewDefault, setEventCardViewDefault } from "../lib/helpers";

const SORT_OPTIONS = [
  { id: "date-asc", label: "Date (Closest - Furthest Away)" },
  { id: "date-desc", label: "Date (Furthest Away - Closest)" },
  { id: "name-asc", label: "Name (A - Z)" },
  { id: "name-desc", label: "Name (Z - A)" },
];

export default function UpcomingEvents({
  events, openEvent, canManage, onRequestDelete, highlightId, onOpenRegister, onUnregister, onCreateEvent, files, onGoBrainstorm, onSuggestIdea,
  registrations, onDeleteRegistration, onUpdateRegistration, onUpdateAttendanceStatus,
  dismissedRegistrationPairs, onMergeRegistrations, onDismissRegistrationPair, highlightRegIds, registeredIds,
}) {
  const [filter, setFilter] = useState("All");
  const [view, setViewState] = useState(getEventCardViewDefault);
  const setView = (v) => { setViewState(v); setEventCardViewDefault(v); };
  const [sortBy, setSortBy] = useState("date-asc");
  const statuses = ["All", "Registration Open", "Draft", "Awaiting Approval"];
  // Live events get pulled out into their own "Happening Now" section above everything else,
  // regardless of status filter — a Draft/Awaiting Approval event can't be live, but this keeps
  // the split consistent with Dashboard's Up Next.
  const liveEvents = events.filter(ev => eventCountdownText(ev.date, ev.start, ev.end)?.happening);
  const liveIds = new Set(liveEvents.map(ev => ev.id));
  const nonLiveEvents = events.filter(ev => !liveIds.has(ev.id));
  const filteredUnsorted = filter === "All" ? nonLiveEvents : nonLiveEvents.filter(e => e.status === filter);
  const filtered = useMemo(() => {
    const list = [...filteredUnsorted];
    list.sort((a, b) => {
      if (sortBy === "name-asc") return (a.title || "").localeCompare(b.title || "");
      if (sortBy === "name-desc") return (b.title || "").localeCompare(a.title || "");
      if (sortBy === "date-desc") return (b.date || "").localeCompare(a.date || "");
      return (a.date || "").localeCompare(b.date || "");
    });
    return list;
  }, [filteredUnsorted, sortBy]);
  const highlightRef = useRef(null);
  const registrationsRef = useRef(null);

  useEffect(() => {
    if (!highlightId || highlightId === "registrations-section") return;
    const ev = events.find(e => e.id === highlightId);
    if (ev) setFilter(ev.status);
  }, [highlightId, events]);

  useEffect(() => {
    if (highlightId === "registrations-section" && registrationsRef.current) {
      registrationsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (highlightId && highlightRef.current) highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightId, filter]);

  return (
    <div className="whmi-fade-in p-6 max-w-[1400px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="disp text-[22px] font-extrabold">Upcoming Events</h1>
          <p className="text-[13px]" style={{ color: "var(--text-dim)" }}>Only "Registration Open" events are visible to staff.</p>
        </div>
        <div className="flex gap-2">
          {onOpenRegister && (
            <button onClick={() => onOpenRegister()} className="whmi-btn-ghost flex items-center gap-1.5"><ClipboardList size={15} />Register for a CPD Event</button>
          )}
          {canManage && <button onClick={onCreateEvent} className="whmi-btn-primary flex items-center gap-1.5"><Plus size={15} />New Event</button>}
        </div>
      </div>

      {liveEvents.length > 0 && (
        <div className="whmi-card p-5" style={{ borderColor: "#D9534F" }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#D9534F" }} />
            <h2 className="disp text-[15px] font-extrabold uppercase tracking-wide" style={{ color: "#D9534F" }}>Happening Now</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {liveEvents.map(ev => (
              <div key={ev.id} className="p-4 rounded-xl flex flex-col gap-2" style={{ border: "1px solid rgba(217,83,79,.35)", background: "rgba(217,83,79,.06)" }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="whmi-badge flex items-center gap-1 font-extrabold" style={{ background: "#D9534F", color: "white" }}><Radio size={11} />LIVE NOW</span>
                  <ModeBadge mode={ev.mode} />
                </div>
                <button onClick={() => openEvent(ev)} className="text-left">
                  <div className="font-bold text-[14.5px] break-words">{ev.title}</div>
                  <div className="text-[11.5px] mt-0.5" style={{ color: "var(--text-dim)" }}>{fmtTimeRange12h(ev.start, ev.end)}</div>
                </button>
                {ev.meetingUrl && (
                  <a
                    href={ev.meetingUrl} target="_blank" rel="noreferrer"
                    className="mt-1 flex items-center justify-center gap-1.5 font-bold text-[12.5px] px-3 py-1.5 rounded-lg text-white"
                    style={{ background: "#D9534F" }}
                  >
                    <Link2 size={13} />Join
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 whmi-scroll overflow-x-auto pb-1">
          {statuses.map(s => (
            <button key={s} onClick={() => setFilter(s)} className="whmi-nav-btn" style={{ background: filter === s ? "var(--surface-2)" : "transparent", color: filter === s ? "var(--text)" : "var(--text-dim)", border: "1px solid " + (filter === s ? "var(--border)" : "transparent") }}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="whmi-input px-2.5 py-2 text-[12.5px]">
            {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <button onClick={() => setView("grid")} className="px-2.5 py-2 flex items-center gap-1.5 text-[12px] font-semibold" style={{ background: view === "grid" ? "var(--accent-primary)" : "transparent", color: view === "grid" ? "white" : "var(--text-dim)" }} title="Grid view">
              <LayoutGrid size={13} />
            </button>
            <button onClick={() => setView("list")} className="px-2.5 py-2 flex items-center gap-1.5 text-[12px] font-semibold" style={{ background: view === "list" ? "var(--accent-primary)" : "transparent", color: view === "list" ? "white" : "var(--text-dim)" }} title="List view">
              <List size={13} />
            </button>
          </div>
        </div>
      </div>

      {view === "list" ? (
        <div className="whmi-card p-3 space-y-1.5">
          {filtered.length === 0 && <div className="text-[12.5px] p-4 text-center" style={{ color: "var(--text-faint)" }}>No events match this filter.</div>}
          {filtered.map(ev => {
            const bannerUrl = eventBannerUrl(files, ev.id);
            const needsAttention = canManage && (ev.status === "Draft" || ev.status === "Awaiting Approval");
            const registered = registeredIds?.has(ev.id);
            // fmtDate() already returns e.g. "Mon, 10 Aug" with the comma baked in — only pull
            // day/month out of it for the date box; re-adding a comma with the weekday token
            // elsewhere double-punctuates it.
            const [, day, month] = fmtDate(ev.date).split(" ");
            return (
              <div
                key={ev.id} ref={ev.id === highlightId ? highlightRef : null}
                className="group relative"
                style={{ outline: ev.id === highlightId ? "2px solid #D9534F" : "none", outlineOffset: 1, borderRadius: 12 }}
              >
                <button onClick={() => openEvent(ev)} className="whmi-row-hover w-full flex items-center gap-3.5 p-2 rounded-xl text-left transition">
                  {needsAttention && (
                    <span className="absolute top-1.5 left-1.5 z-10 w-2 h-2 rounded-full" style={{ background: "#D9534F" }} title="Needs attention" />
                  )}
                  {/* Date thumbnail — filled with a softly-blurred crop of the event's own poster
                      when it has one (matches the promo material's colour without needing the
                      full image to be legible), with the month/day overlaid top-left. */}
                  <div className="w-[70px] h-[70px] rounded-xl shrink-0 relative overflow-hidden p-2 flex flex-col items-start justify-start" style={!bannerUrl ? { background: "var(--accent-primary)" } : undefined}>
                    {bannerUrl && (
                      <img src={bannerUrl} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" style={{ filter: "blur(3px) saturate(1.25) brightness(0.9)", transform: "scale(1.15)" }} />
                    )}
                    <span className="relative text-white text-[10px] font-bold uppercase leading-none" style={{ textShadow: "0 1px 3px rgba(0,0,0,.6)" }}>{month}</span>
                    <span className="relative text-white text-[22px] font-extrabold leading-none mt-0.5" style={{ textShadow: "0 1px 3px rgba(0,0,0,.6)" }}>{day}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14.5px] leading-snug break-words">{ev.title}</div>
                    <div className="flex items-center gap-x-2.5 gap-y-0.5 text-[12px] flex-wrap mt-1" style={{ color: "var(--text-faint)" }}>
                      <span className="flex items-center gap-1"><Calendar size={11} className="shrink-0" />{fmtDate(ev.date)}</span>
                      <span className="flex items-center gap-1"><Clock size={11} className="shrink-0" />{fmtTimeRange12h(ev.start, ev.end)}</span>
                      <span className="flex items-center gap-1 truncate"><MapPin size={11} className="shrink-0" />{ev.campus || eventLocationSuffix(ev) || "—"}</span>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={ev.status} />
                        <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>{ev.capacity == null ? `Reg: ${ev.registered}` : `Reg: ${ev.registered}/${ev.capacity}`}</span>
                      </div>
                    )}
                  </div>
                  {onOpenRegister && (registered || ev.status === "Registration Open") && (
                    <RegisterOrUnregister
                      registered={registered}
                      onRegister={() => onOpenRegister(ev.id)}
                      onUnregister={() => onUnregister?.(ev.id)}
                    />
                  )}
                </button>
                {canManage && (
                  <button
                    onClick={(e) => { e.stopPropagation(); openEvent(ev, undefined, true); }}
                    className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition whmi-btn-ghost !p-1.5"
                    title="Edit event"
                  >
                    <Pencil size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(ev => {
          const joinable = ev.meetingUrl && canJoinMeeting(ev.date, ev.start, ev.end);
          const needsAttention = canManage && (ev.status === "Draft" || ev.status === "Awaiting Approval");
          const bannerUrl = eventBannerUrl(files, ev.id);
          const countdown = eventCountdownText(ev.date, ev.start, ev.end);
          const registered = registeredIds?.has(ev.id);
          if (isRecentlyCompleted(ev.date, ev.end)) {
            return <RecentlyCompletedCard key={ev.id} event={ev} files={files} openEvent={openEvent} registered={registered} />;
          }
          return (
            <div
              key={ev.id}
              ref={ev.id === highlightId ? highlightRef : null}
              className="whmi-card whmi-event-card whmi-row-hover group p-4 text-left transition relative"
              style={{ outline: ev.id === highlightId ? "2px solid #D9534F" : "none", outlineOffset: 2 }}
            >
              {needsAttention && (
                <button
                  onClick={(e) => { e.stopPropagation(); openEvent(ev); }}
                  className="absolute top-3 left-3 z-10 w-2.5 h-2.5 rounded-full"
                  style={{ background: "#D9534F" }}
                  title="Needs attention"
                />
              )}
              {canManage && (
                <button
                  onClick={(e) => { e.stopPropagation(); openEvent(ev, undefined, true); }}
                  className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  style={{ background: "rgba(0,0,0,.35)" }}
                  title="Edit event"
                >
                  <Pencil size={13} color="white" />
                </button>
              )}
              <button onClick={() => openEvent(ev)} className="w-full text-left whmi-row-hover transition rounded-lg -m-1 p-1">
                <div className="h-20 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden" style={!bannerUrl ? { background: "var(--accent-primary)" } : undefined}>
                  {bannerUrl ? (
                    <img
                      src={bannerUrl} alt="" className="w-full h-full object-cover"
                      style={{
                        objectPosition: `${ev.bannerFocalX ?? 50}% ${ev.bannerFocalY ?? 50}%`,
                        transform: `scale(${ev.bannerZoom ?? 1})`, transformOrigin: `${ev.bannerFocalX ?? 50}% ${ev.bannerFocalY ?? 50}%`,
                      }}
                    />
                  ) : (
                    <span className="text-white font-bold text-[13px] disp z-10 px-3 text-center break-words">{ev.topic}</span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <StatusBadge status={ev.status} />
                  <ModeBadge mode={ev.mode} />
                </div>
                <div className="font-bold text-[14px] leading-snug mb-1.5 break-words">{ev.title}</div>
                <div className="text-[12px] grid grid-cols-2 gap-x-3 gap-y-1.5" style={{ color: "var(--text-dim)" }}>
                  <div>
                    <div className="flex items-center gap-1.5 text-[13px] font-semibold"><Calendar size={12} className="shrink-0" /><span className="break-words">{fmtDate(ev.date)}</span></div>
                    {countdown && (
                      countdown.happening ? (
                        <span className="whmi-badge mt-1" style={{ background: "rgba(217,83,79,.15)", color: "#D9534F" }}>{countdown.text}</span>
                      ) : (
                        <div className="text-[10.5px] mt-0.5" style={{ color: "var(--text-faint)" }}>{countdown.text}</div>
                      )
                    )}
                  </div>
                  <div className="flex items-center gap-1.5"><Clock size={12} className="shrink-0" /><span className="break-words">{fmtTimeRange12h(ev.start, ev.end)}</span></div>
                  <div className="flex items-start gap-1.5"><MapPin size={12} className="shrink-0 mt-0.5" /><span className="break-words">{ev.campus && <strong>{ev.campus}</strong>}{ev.campus && eventLocationSuffix(ev) ? " - " : ""}{eventLocationSuffix(ev)}</span></div>
                  {/* Own full-width row rather than sharing one with Location - "+N more" can grow
                      this to several lines, which would otherwise stretch Location's cell too. */}
                  <div className="col-span-2 flex items-start gap-1.5"><UserCircle2 size={12} className="shrink-0 mt-0.5" /><PresenterLine presenter={ev.presenter} className="break-words" /></div>
                </div>
              </button>
              {ev.capacity != null && (
                <div className="mt-3">
                  {canManage ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); openEvent(ev, "registrations"); }}
                      className="w-full text-left rounded-lg -mx-1 px-1 py-0.5 whmi-row-hover transition"
                      title="View registrations"
                    >
                      <div className="h-1.5 rounded-full" style={{ background: "var(--surface-2)" }}>
                        <div className="h-1.5 rounded-full whmi-accent-bar" style={{ width: `${Math.min(100, (ev.registered / ev.capacity) * 100)}%` }} />
                      </div>
                    </button>
                  ) : (
                    <div className="h-1.5 rounded-full" style={{ background: "var(--surface-2)" }}>
                      <div className="h-1.5 rounded-full whmi-accent-bar" style={{ width: `${Math.min(100, (ev.registered / ev.capacity) * 100)}%` }} />
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-end justify-between gap-2 mt-2">
                {joinable ? (
                  <a href={ev.meetingUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: "var(--accent-secondary)" }}>
                    <Link2 size={12} />Join meeting here
                  </a>
                ) : <span />}
                <div className="flex flex-col items-end gap-1.5 ml-auto">
                  {canManage ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); openEvent(ev, "registrations"); }}
                      className="flex items-center gap-1 text-[11px] rounded-lg -mx-1 px-1 whmi-row-hover transition"
                      style={{ color: "var(--text-faint)" }}
                      title="View registrations"
                    >
                      <Users size={10} className="shrink-0" />{ev.capacity == null ? `Registered: ${ev.registered}` : `Registered ${ev.registered}/${ev.capacity}`}{ev.waitlist ? ` · ${ev.waitlist} waitlisted` : ""}
                      {ev.capacity != null && <span className="ml-1">({Math.round((ev.registered / ev.capacity) * 100)}%)</span>}
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-faint)" }}>
                      <Users size={10} className="shrink-0" />{ev.capacity == null ? `Registered: ${ev.registered}` : `Registered ${ev.registered}/${ev.capacity}`}{ev.waitlist ? ` · ${ev.waitlist} waitlisted` : ""}
                      {ev.capacity != null && <span className="ml-1">({Math.round((ev.registered / ev.capacity) * 100)}%)</span>}
                    </span>
                  )}
                  {ev.openToExternal !== false && ev.externalPrice != null && (
                    <span className="text-[15px] font-extrabold" style={{ color: "var(--accent-success)" }}>${Number(ev.externalPrice).toFixed(2)} AUD</span>
                  )}
                  {onOpenRegister && (registered || ev.status === "Registration Open") && (
                    <RegisterOrUnregister
                      registered={registered} size="md" corner={false}
                      onRegister={() => onOpenRegister(ev.id)}
                      onUnregister={() => onUnregister?.(ev.id)}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {canManage && registrations && (
        <div ref={registrationsRef}>
          <AllRegistrationsPanel
            events={events.filter(e => e.status === "Registration Open")} registrations={registrations} canManage={canManage}
            onDelete={onDeleteRegistration} onUpdate={onUpdateRegistration} onUpdateAttendanceStatus={onUpdateAttendanceStatus}
            dismissedPairs={dismissedRegistrationPairs} onMerge={onMergeRegistrations} onDismissPair={onDismissRegistrationPair}
            highlightIds={highlightId === "registrations-section" ? highlightRegIds : null}
          />
        </div>
      )}

      {(onSuggestIdea || (canManage && onGoBrainstorm)) && (
        <div className="flex justify-center items-center gap-2 pt-2 flex-wrap">
          {onSuggestIdea && (
            <button onClick={onSuggestIdea} className="whmi-btn-ghost flex items-center gap-1.5 text-[12.5px]">
              <Lightbulb size={14} />Suggest a CPD idea
            </button>
          )}
          {canManage && onGoBrainstorm && (
            <button onClick={onGoBrainstorm} className="whmi-btn-ghost flex items-center gap-1.5 text-[12.5px]">
              <Lightbulb size={14} />Go to CPD Brainstorming →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
