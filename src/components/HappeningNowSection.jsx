import { useState } from "react";
import { Link } from "react-router-dom";
import { Radio, CheckCircle2, Maximize2, X, Link2, MapPin, Clock, UserCircle2, Users, MessageSquareText } from "lucide-react";
import ModeBadge from "./ModeBadge";
import RegisterOrUnregister from "./EventRegisterControl";
import PresenterLine from "./PresenterLine";
import { eventBannerUrl, eventLocationSuffix, fmtTimeRange12h, splitFeaturedEvents } from "../lib/helpers";

// Shown at the top of every dashboard (admin/owner, and the viewer-facing MyCpd/
// ExternalDashboard) whenever an event is currently live or finished within the last 24h -
// title and accent colour switch between "Happening Now" (red) and "Recently Ended" (green)
// depending on whether anything's still actually live. Poster click-to-expand and the "you're
// leaving the dashboard" join confirmation are self-contained here (only one of each can be open
// regardless of which card triggered it), so every caller gets the same behaviour for free.
export default function HappeningNowSection({ events, files, registeredIds, onOpenRegister, onUnregister, openEvent, registrations }) {
  const [expandedPoster, setExpandedPoster] = useState(null); // { url, event } | null
  const [joinConfirmEvent, setJoinConfirmEvent] = useState(null);
  const { liveEvents, liveIds, featuredEvents } = splitFeaturedEvents(events);

  if (featuredEvents.length === 0) return null;

  return (
    <>
      <div className="whmi-card p-5" style={{ borderColor: liveEvents.length > 0 ? "#D9534F" : "var(--accent-success)" }}>
        <div className="flex items-center gap-2 mb-4">
          <span className={`w-2 h-2 rounded-full${liveEvents.length > 0 ? " animate-pulse" : ""}`} style={{ background: liveEvents.length > 0 ? "#D9534F" : "var(--accent-success)" }} />
          <h2 className="disp text-[15px] font-extrabold uppercase tracking-wide" style={{ color: liveEvents.length > 0 ? "#D9534F" : "var(--accent-success)" }}>
            {liveEvents.length > 0 ? "Happening Now" : "Recently Ended"}
          </h2>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {featuredEvents.map(ev => {
            const isLive = liveIds.has(ev.id);
            const bannerUrl = eventBannerUrl(files, ev.id);
            const registered = registeredIds?.has(ev.id);
            const accent = isLive ? "#D9534F" : "var(--accent-success)";
            return (
              <div
                key={ev.id}
                className="rounded-xl overflow-hidden flex flex-col sm:flex-row whmi-row-hover transition"
                style={{ border: `1px solid ${isLive ? "rgba(217,83,79,.35)" : "var(--border)"}`, background: isLive ? "rgba(217,83,79,.06)" : "var(--surface)" }}
              >
                {bannerUrl && (
                  <div className="relative w-full sm:w-36 h-32 sm:h-auto shrink-0 overflow-hidden">
                    <img
                      src={bannerUrl} alt="" className="w-full h-full object-cover cursor-pointer"
                      style={{
                        objectPosition: `${ev.bannerFocalX ?? 50}% ${ev.bannerFocalY ?? 50}%`,
                        transform: `scale(${ev.bannerZoom ?? 1})`, transformOrigin: `${ev.bannerFocalX ?? 50}% ${ev.bannerFocalY ?? 50}%`,
                      }}
                      onClick={() => setExpandedPoster({ url: bannerUrl, event: ev })}
                    />
                    <button
                      onClick={() => setExpandedPoster({ url: bannerUrl, event: ev })}
                      className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center transition hover:scale-110"
                      style={{ background: "rgba(0,0,0,.45)" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,.75)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,.45)"; }}
                      title="View full poster" type="button"
                    >
                      <Maximize2 size={12} color="white" />
                    </button>
                  </div>
                )}
                <div className="p-4 flex-1 min-w-0 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="whmi-badge flex items-center gap-1 font-extrabold" style={{ background: accent, color: "white" }}>
                      {isLive ? <><Radio size={11} />LIVE NOW</> : <><CheckCircle2 size={11} />RECENTLY ENDED</>}
                    </span>
                    <ModeBadge mode={ev.mode} />
                  </div>
                  <button onClick={() => openEvent(ev)} className="text-left">
                    <div className="font-bold text-[14.5px] break-words">{ev.title}</div>
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-[11.5px]" style={{ color: "var(--text-dim)" }}>
                    <span className="flex items-center gap-1 min-w-0"><Clock size={11} className="shrink-0" /><span className="truncate">{fmtTimeRange12h(ev.start, ev.end)}</span></span>
                    <span className="flex items-center gap-1 min-w-0"><MapPin size={11} className="shrink-0" /><span className="truncate">{ev.campus && <strong>{ev.campus}</strong>}{ev.campus && eventLocationSuffix(ev) ? " - " : ""}{eventLocationSuffix(ev)}</span></span>
                    {/* Own full-width row (not sharing one with Registered) - "+N more" can grow
                        this to several lines, which would otherwise stretch Registered's cell
                        taller and re-centre it every time it expands/collapses. items-start keeps
                        the icon level with just the first presenter's line, not the whole block. */}
                    {ev.presenter && <span className="sm:col-span-2 flex items-start gap-1 min-w-0"><UserCircle2 size={11} className="shrink-0 mt-0.5" /><PresenterLine presenter={ev.presenter} className="truncate" /></span>}
                    {/* Once an event's actually finished (not just live), attended is the number
                        worth showing here - not how many merely registered beforehand. */}
                    <span className="sm:col-span-2 flex items-center gap-1 font-bold min-w-0">
                      <Users size={11} className="shrink-0" />
                      <span className="truncate">
                        {isLive
                          ? (ev.capacity == null ? `Registered: ${ev.registered}` : `Registered ${ev.registered}/${ev.capacity}`)
                          : `Attended: ${(registrations || []).filter(r => r.eventId === ev.id && r.attendanceStatus === "Attended").length} of ${ev.registered} registered`}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    {isLive && ev.meetingUrl && (
                      <button
                        onClick={() => setJoinConfirmEvent(ev)}
                        className="flex items-center justify-center gap-1.5 font-bold text-[12.5px] px-3 py-1.5 rounded-lg text-white transition hover:brightness-110"
                        style={{ background: "#D9534F" }}
                      >
                        <Link2 size={13} />Join Live Event
                      </button>
                    )}
                    {onOpenRegister && (registered || ev.status === "Registration Open") && (
                      <RegisterOrUnregister
                        registered={registered} size="md" corner={false}
                        onRegister={() => onOpenRegister(ev.id)}
                        onUnregister={() => onUnregister?.(ev.id)}
                      />
                    )}
                    {!isLive && registered && (
                      <Link to={`/event/${ev.id}/reflect`} className="whmi-btn-primary flex items-center justify-center gap-1.5 text-[12.5px]">
                        <MessageSquareText size={14} />Leave Feedback & Get Certificate
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {expandedPoster && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,.85)" }}
          onClick={(e) => { e.stopPropagation(); setExpandedPoster(null); }}
        >
          <img src={expandedPoster.url} alt="" className="max-w-full max-h-full object-contain" onClick={e => e.stopPropagation()} />
          <button onClick={(e) => { e.stopPropagation(); setExpandedPoster(null); }} className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,.15)" }}>
            <X size={18} color="white" />
          </button>
        </div>
      )}

      {joinConfirmEvent && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,.5)", backdropFilter: "blur(3px)" }}
          onClick={() => setJoinConfirmEvent(null)}
        >
          <div className="whmi-card w-full max-w-sm p-5 whmi-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "#D9534F22" }}>
                <Link2 size={16} style={{ color: "#D9534F" }} />
              </span>
              <div className="font-bold text-[14.5px]">You will be redirected to this live event.</div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setJoinConfirmEvent(null)}
                className="whmi-btn-ghost transition hover:brightness-95"
              >
                Cancel
              </button>
              <button
                onClick={() => { window.open(joinConfirmEvent.meetingUrl, "_blank", "noreferrer"); setJoinConfirmEvent(null); }}
                className="whmi-btn-primary transition hover:brightness-110"
              >
                Open Event
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
