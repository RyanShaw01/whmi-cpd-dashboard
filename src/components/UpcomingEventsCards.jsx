import { useState } from "react";
import { ChevronRight, Clock, MapPin, LayoutGrid, List } from "lucide-react";
import StatusBadge from "./StatusBadge";
import ModeBadge from "./ModeBadge";
import RegisterOrUnregister from "./EventRegisterControl";
import { fmtDate, fmtTimeRange12h, eventBannerUrl, eventLocationSuffix, makeViewPref } from "../lib/helpers";

// Same big-card/compact-list toggle and card styling as the admin Dashboard's Up Next and the
// Upcoming Events page, reused for the viewer-facing dashboards (MyCpd, ExternalDashboard) so
// staff and external viewers see the same visual treatment — including banners — as
// admins/owners, each page remembering its own view choice independently.
export default function UpcomingEventsCards({
  title, events, files, openEvent, accentHex = "var(--accent-primary)", storageKey,
  mode = "register", onOpenRegister, onUnregister, viewerUserType, emptyText = "No upcoming events.", maxItems = 6, registeredIds,
}) {
  const viewPref = makeViewPref(storageKey);
  const [view, setViewState] = useState(viewPref.get);
  const setView = (v) => { setViewState(v); viewPref.set(v); };

  if (events.length === 0) {
    return (
      <div className="whmi-card p-5">
        {title && <h2 className="disp text-[15px] font-bold mb-3">{title}</h2>}
        <div className="text-[12.5px]" style={{ color: "var(--text-faint)" }}>{emptyText}</div>
      </div>
    );
  }

  return (
    <div className="whmi-card p-5">
      <div className="flex items-center justify-between mb-4 gap-2">
        {title && <h2 className="disp text-[15px] font-bold">{title}</h2>}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>{events.length}</span>
          <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <button onClick={() => setView("grid")} className="px-2 py-1.5 flex items-center" style={{ background: view === "grid" ? "var(--accent-primary)" : "transparent", color: view === "grid" ? "white" : "var(--text-dim)" }} title="Big cards">
              <LayoutGrid size={12} />
            </button>
            <button onClick={() => setView("list")} className="px-2 py-1.5 flex items-center" style={{ background: view === "list" ? "var(--accent-primary)" : "transparent", color: view === "list" ? "white" : "var(--text-dim)" }} title="Compact list">
              <List size={12} />
            </button>
          </div>
        </div>
      </div>

      {view === "list" ? (
        <div className="space-y-1.5">
          {events.slice(0, maxItems).map(ev => {
            const bannerUrl = eventBannerUrl(files, ev.id);
            const [, day, month] = fmtDate(ev.date).split(" ");
            const registered = registeredIds?.has(ev.id);
            const showPrice = viewerUserType === "external" && ev.openToExternal !== false && ev.externalPrice != null;
            return (
              <button key={ev.id} onClick={() => openEvent(ev)} className="whmi-row-hover w-full flex items-center gap-3.5 p-2 rounded-xl text-left transition">
                <div className="w-[58px] h-[58px] rounded-lg shrink-0 relative overflow-hidden p-1.5 flex flex-col items-start justify-start" style={!bannerUrl ? { background: accentHex } : undefined}>
                  {bannerUrl && (
                    <img src={bannerUrl} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" style={{ filter: "blur(3px) saturate(1.25) brightness(0.9)", transform: "scale(1.15)" }} />
                  )}
                  <span className="relative text-white text-[9px] font-bold uppercase leading-none" style={{ textShadow: "0 1px 3px rgba(0,0,0,.6)" }}>{month}</span>
                  <span className="relative text-white text-[17px] font-extrabold leading-none mt-0.5" style={{ textShadow: "0 1px 3px rgba(0,0,0,.6)" }}>{day}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[13px] break-words leading-snug">{ev.title}</div>
                  <div className="flex items-center gap-x-2.5 gap-y-0.5 text-[11px] flex-wrap mt-1" style={{ color: "var(--text-faint)" }}>
                    <span className="flex items-center gap-1"><Clock size={10} className="shrink-0" />{fmtTimeRange12h(ev.start, ev.end)}</span>
                    <span className="flex items-center gap-1 truncate"><MapPin size={10} className="shrink-0" />{ev.campus || eventLocationSuffix(ev) || "—"}</span>
                  </div>
                </div>
                {showPrice && (
                  <span className="text-[14px] font-extrabold shrink-0" style={{ color: "var(--accent-success)" }}>${Number(ev.externalPrice).toFixed(2)}</span>
                )}
                {mode === "manage" && !registered ? (
                  <StatusBadge status={ev.status} />
                ) : onOpenRegister && (registered || ev.status === "Registration Open") ? (
                  <RegisterOrUnregister
                    registered={registered}
                    onRegister={() => onOpenRegister(ev.id)}
                    onUnregister={() => onUnregister?.(ev.id)}
                  />
                ) : (
                  <ChevronRight size={15} style={{ color: "var(--text-faint)" }} className="shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {events.slice(0, maxItems).map(ev => {
            const bannerUrl = eventBannerUrl(files, ev.id);
            const registered = registeredIds?.has(ev.id);
            const showPrice = viewerUserType === "external" && ev.openToExternal !== false && ev.externalPrice != null;
            return (
              <div key={ev.id} className="w-full flex flex-col p-4 rounded-xl" style={{ border: "1px solid var(--border)" }}>
                <button onClick={() => openEvent(ev)} className="whmi-row-hover w-full flex flex-col text-left transition rounded-lg -m-1 p-1">
                  {bannerUrl && (
                    <div className="w-full h-28 rounded-lg mb-3 overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                      <img
                        src={bannerUrl} alt="" className="w-full h-full object-cover"
                        style={{
                          objectPosition: `${ev.bannerFocalX ?? 50}% ${ev.bannerFocalY ?? 50}%`,
                          transform: `scale(${ev.bannerZoom ?? 1})`, transformOrigin: `${ev.bannerFocalX ?? 50}% ${ev.bannerFocalY ?? 50}%`,
                        }}
                      />
                    </div>
                  )}
                  <div className="w-full flex items-start gap-4">
                    <div className="w-16 h-16 rounded-lg shrink-0 flex flex-col items-center justify-center" style={{ background: accentHex }}>
                      <span className="text-white text-[10.5px] font-bold uppercase">{fmtDate(ev.date).split(" ")[2]}</span>
                      <span className="text-white text-[18px] font-extrabold leading-none">{fmtDate(ev.date).split(" ")[1]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[14.5px] break-words">{ev.title}</div>
                      <div className="grid grid-cols-1 gap-y-1 mt-1.5 text-[11.5px]" style={{ color: "var(--text-dim)" }}>
                        <span className="flex items-center gap-1"><Clock size={11} className="shrink-0" />{fmtTimeRange12h(ev.start, ev.end)}</span>
                        <span className="flex items-center gap-1"><MapPin size={11} className="shrink-0" /><span className="truncate">{ev.campus && <strong>{ev.campus}</strong>}{ev.campus && eventLocationSuffix(ev) ? " - " : ""}{eventLocationSuffix(ev)}</span></span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-2">
                        {mode === "manage" && <StatusBadge status={ev.status} />}
                        <ModeBadge mode={ev.mode} />
                      </div>
                    </div>
                  </div>
                </button>
                {(showPrice || (mode === "register" && onOpenRegister && (registered || ev.status === "Registration Open"))) && (
                  <div className="flex items-center justify-end gap-3 mt-3">
                    {showPrice && (
                      <span className="text-[15px] font-extrabold" style={{ color: "var(--accent-success)" }}>${Number(ev.externalPrice).toFixed(2)} AUD</span>
                    )}
                    {mode === "register" && onOpenRegister && (registered || ev.status === "Registration Open") && (
                      <RegisterOrUnregister
                        registered={registered} size="md" corner={false}
                        onRegister={() => onOpenRegister(ev.id)}
                        onUnregister={() => onUnregister?.(ev.id)}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
