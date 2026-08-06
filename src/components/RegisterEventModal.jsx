import { useState, useEffect, useRef } from "react";
import { X, ClipboardList, Calendar, Clock, MapPin, UserCircle2, LayoutGrid, List } from "lucide-react";
import { fmtDate, fmtTimeRange12h, eventLocationSuffix, splitPeopleList, eventBannerUrl, makeViewPref } from "../lib/helpers";

const eventPickerViewPref = makeViewPref("whmi_register_event_view");

export default function RegisterEventModal({ open, onClose, session, events, defaultEventId, onSubmit, files }) {
  const openEvents = events.filter(e => e.status === "Registration Open");
  const [eventId, setEventId] = useState(defaultEventId || openEvents[0]?.id || "");
  const [pickerView, setPickerViewState] = useState(eventPickerViewPref.get);
  const setPickerView = (v) => { setPickerViewState(v); eventPickerViewPref.set(v); };
  const [scrollRatio, setScrollRatio] = useState({ top: 0, size: 1 });
  const [name, setName] = useState(session?.name || "");
  const [email, setEmail] = useState(session?.email || "");
  const [profession, setProfession] = useState(session?.profession || "");
  const [organisation, setOrganisation] = useState(session?.organisation || "");
  const [attendanceType, setAttendanceType] = useState("In-person");
  const [dietary, setDietary] = useState(session?.dietaryRequirements || "");
  const [accessibility, setAccessibility] = useState(session?.accessibility || "");

  const selectedEvent = openEvents.find(e => e.id === eventId);
  const isExternal = session?.userType === "external";
  const eventListRef = useRef(null);
  const eventButtonRefs = useRef({});
  const [expandedId, setExpandedId] = useState(null);

  const updateScrollRatio = () => {
    const el = eventListRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight <= clientHeight) { setScrollRatio({ top: 0, size: 1 }); return; }
    setScrollRatio({ top: scrollTop / scrollHeight, size: clientHeight / scrollHeight });
  };

  useEffect(() => {
    if (!open) return;
    setEventId(defaultEventId || openEvents[0]?.id || "");
    setName(session?.name || "");
    setEmail(session?.email || "");
    setProfession(session?.profession || "");
    setOrganisation(session?.organisation || "");
    setDietary(session?.dietaryRequirements || "");
    setAccessibility(session?.accessibility || "");
    setExpandedId(defaultEventId || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultEventId]);

  // Scroll the chosen event to the top of the (potentially long) event list so
  // clicking "Register" on a card doesn't leave the selection buried off-screen.
  useEffect(() => {
    if (!open) return;
    const id = defaultEventId || openEvents[0]?.id;
    if (!id) return;
    requestAnimationFrame(() => {
      const btn = eventButtonRefs.current[id];
      if (btn && eventListRef.current) btn.scrollIntoView({ block: "start" });
      updateScrollRatio();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultEventId, pickerView]);

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    if (!eventId || !name.trim() || !email.trim()) return;
    onSubmit({
      eventId, name: name.trim(), email: email.trim(), profession: profession.trim(), organisation: organisation.trim(),
      attendanceType: selectedEvent?.mode === "Hybrid" ? attendanceType : null,
      dietary: dietary.trim(), accessibility: accessibility.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.5)" }} onClick={onClose}>
      <div className="whmi-card w-full max-w-lg max-h-[85vh] overflow-y-auto whmi-scroll whmi-fade-in" onClick={e => e.stopPropagation()}>
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="disp text-[16px] font-extrabold flex items-center gap-2"><ClipboardList size={17} style={{ color: "var(--accent-primary)" }} />Register for a CPD Event</h2>
          <button onClick={onClose} className="whmi-btn-ghost !p-2"><X size={14} /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3">
          <div>
            <div className="flex items-center justify-between gap-2">
              <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>
                Event <span style={{ color: "var(--text-faint)", fontWeight: 500 }}>· {openEvents.length} available</span>
              </label>
              <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                <button type="button" onClick={() => setPickerView("grid")} className="px-2 py-1 flex items-center" style={{ background: pickerView === "grid" ? "var(--accent-primary)" : "transparent", color: pickerView === "grid" ? "white" : "var(--text-dim)" }} title="Big view">
                  <LayoutGrid size={12} />
                </button>
                <button type="button" onClick={() => setPickerView("list")} className="px-2 py-1 flex items-center" style={{ background: pickerView === "list" ? "var(--accent-primary)" : "transparent", color: pickerView === "list" ? "white" : "var(--text-dim)" }} title="Compact list">
                  <List size={12} />
                </button>
              </div>
            </div>
            <div className="flex items-stretch gap-1.5 mt-1">
              <div ref={eventListRef} onScroll={updateScrollRatio} className="flex-1 min-w-0 space-y-2 max-h-64 overflow-y-auto whmi-scroll pr-0.5">
                {openEvents.map(ev => {
                  const bannerUrl = eventBannerUrl(files, ev.id);
                  if (pickerView === "list") {
                    const [, day, month] = fmtDate(ev.date).split(" ");
                    const expanded = expandedId === ev.id;
                    return (
                      <div key={ev.id} ref={el => { eventButtonRefs.current[ev.id] = el; }}>
                        <button
                          type="button"
                          onClick={() => { setEventId(ev.id); setExpandedId(x => x === ev.id ? null : ev.id); }}
                          className="w-full text-left flex items-center gap-3 p-2 rounded-xl transition"
                          style={{ border: `2px solid ${eventId === ev.id ? "var(--accent-primary)" : "var(--border)"}`, background: eventId === ev.id ? "var(--surface-2)" : "transparent" }}
                          title="Click for more details"
                        >
                          <div className="w-11 h-11 rounded-lg shrink-0 relative overflow-hidden p-1 flex flex-col items-start justify-start" style={!bannerUrl ? { background: "var(--accent-primary)" } : undefined}>
                            {bannerUrl && (
                              <img src={bannerUrl} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" style={{ filter: "blur(3px) saturate(1.25) brightness(0.9)", transform: "scale(1.15)" }} />
                            )}
                            <span className="relative text-white text-[7px] font-bold uppercase leading-none" style={{ textShadow: "0 1px 3px rgba(0,0,0,.6)" }}>{month}</span>
                            <span className="relative text-white text-[13px] font-extrabold leading-none mt-0.5" style={{ textShadow: "0 1px 3px rgba(0,0,0,.6)" }}>{day}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[13px] break-words leading-snug">{ev.title}</div>
                            <div className="flex items-center gap-x-2 gap-y-0.5 text-[11px] flex-wrap mt-0.5" style={{ color: "var(--text-faint)" }}>
                              <span className="flex items-center gap-1"><Calendar size={10} className="shrink-0" />{fmtDate(ev.date)}</span>
                              <span className="flex items-center gap-1"><Clock size={10} className="shrink-0" />{fmtTimeRange12h(ev.start, ev.end)}</span>
                              <span className="flex items-center gap-1 truncate"><MapPin size={10} className="shrink-0" />{ev.campus || eventLocationSuffix(ev) || "—"}</span>
                            </div>
                          </div>
                        </button>
                        {expanded && (
                          <div className="mt-1 p-3 rounded-xl text-[11.5px]" style={{ border: "1px solid var(--border)", color: "var(--text-dim)" }}>
                            {ev.presenter && (
                              <div className="flex items-start gap-1 mb-1.5">
                                <UserCircle2 size={11} className="shrink-0 mt-0.5" />
                                {(() => {
                                  const presenters = splitPeopleList(ev.presenter);
                                  return presenters.length > 1 ? (
                                    <ul style={{ paddingLeft: 12, listStyleType: "disc" }}>
                                      {presenters.map((p, i) => <li key={i}>{p}</li>)}
                                    </ul>
                                  ) : <span>{ev.presenter}</span>;
                                })()}
                              </div>
                            )}
                            {session?.userType === "external" && ev.externalPrice != null && (
                              <div className="mb-1.5 font-semibold" style={{ color: "var(--accent-primary)" }}>${Number(ev.externalPrice).toFixed(2)} AUD</div>
                            )}
                            {ev.description && <p style={{ color: "var(--text-faint)" }}>{ev.description}</p>}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return (
                    <button
                      key={ev.id} ref={el => { eventButtonRefs.current[ev.id] = el; }} type="button" onClick={() => setEventId(ev.id)}
                      className="w-full text-left p-3 rounded-xl transition"
                      style={{ border: `2px solid ${eventId === ev.id ? "var(--accent-primary)" : "var(--border)"}`, background: eventId === ev.id ? "var(--surface-2)" : "transparent" }}
                    >
                      <div
                        className="break-words"
                        style={eventId === ev.id ? { fontWeight: 800, fontSize: 15, color: "var(--accent-primary)" } : { fontWeight: 600, fontSize: 14 }}
                      >
                        {ev.title}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11.5px] flex-wrap" style={{ color: "var(--text-dim)" }}>
                        <span className="flex items-center gap-1"><Calendar size={11} />{fmtDate(ev.date)}</span>
                        <span className="flex items-center gap-1"><Clock size={11} />{fmtTimeRange12h(ev.start, ev.end)}</span>
                      </div>
                      {(ev.campus || ev.location) && (
                        <div className="flex items-start gap-1 mt-1 text-[11.5px]" style={{ color: "var(--text-dim)" }}>
                          <MapPin size={11} className="shrink-0 mt-0.5" />
                          <span>{ev.campus ? <><b>{ev.campus}</b>{eventLocationSuffix(ev) ? ` - ${eventLocationSuffix(ev)}` : ""}</> : eventLocationSuffix(ev)}</span>
                        </div>
                      )}
                      {ev.presenter && (
                        <div className="flex items-start gap-1 mt-1 text-[11.5px]" style={{ color: "var(--text-dim)" }}>
                          <UserCircle2 size={11} className="shrink-0 mt-0.5" />
                          {(() => {
                            const presenters = splitPeopleList(ev.presenter);
                            return presenters.length > 1 ? (
                              <ul style={{ paddingLeft: 12, listStyleType: "disc" }}>
                                {presenters.map((p, i) => <li key={i}>{p}</li>)}
                              </ul>
                            ) : <span>{ev.presenter}</span>;
                          })()}
                        </div>
                      )}
                      {session?.userType === "external" && ev.externalPrice != null && (
                        <div className="text-[11.5px] mt-1 font-semibold" style={{ color: "var(--accent-primary)" }}>${Number(ev.externalPrice).toFixed(2)} AUD</div>
                      )}
                      {ev.description && <p className="text-[11.5px] mt-1.5 line-clamp-2" style={{ color: "var(--text-faint)" }}>{ev.description}</p>}
                    </button>
                  );
                })}
              </div>
              {openEvents.length > 2 && scrollRatio.size < 1 && (
                <div className="w-1 shrink-0 rounded-full self-stretch relative" style={{ background: "var(--surface-2)" }} title="Scroll position">
                  <div
                    className="absolute left-0 w-1 rounded-full transition-all"
                    style={{ top: `${scrollRatio.top * 100}%`, height: `${Math.max(8, scrollRatio.size * 100)}%`, background: "var(--accent-primary)" }}
                  />
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Name</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1" />
          </div>
          <div>
            <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Email</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1" />
          </div>
          <div>
            <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Profession</label>
            <input value={profession} onChange={e => setProfession(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1" />
          </div>
          {isExternal && (
            <div>
              <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Hospital / University / Business</label>
              <input value={organisation} onChange={e => setOrganisation(e.target.value)} placeholder="Which organisation are you from?" className="whmi-input w-full px-2.5 py-2 mt-1" />
            </div>
          )}
          {selectedEvent?.mode === "Hybrid" && (
            <div>
              <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Attendance Type</label>
              <div className="flex gap-2 mt-1">
                <button type="button" onClick={() => setAttendanceType("In-person")} className={attendanceType === "In-person" ? "whmi-btn-primary flex-1" : "whmi-btn-ghost flex-1"}>In-person</button>
                <button type="button" onClick={() => setAttendanceType("Online")} className={attendanceType === "Online" ? "whmi-btn-primary flex-1" : "whmi-btn-ghost flex-1"}>Online</button>
              </div>
            </div>
          )}
          <div>
            <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Dietary Requirements</label>
            <textarea value={dietary} onChange={e => setDietary(e.target.value)} rows={2} placeholder="Vegetarian, allergies, etc." className="whmi-input w-full px-2.5 py-2 mt-1 resize-none" />
          </div>
          <div>
            <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Accessibility Requirements</label>
            <textarea value={accessibility} onChange={e => setAccessibility(e.target.value)} rows={2} placeholder="Wheelchair access, hearing loop, etc." className="whmi-input w-full px-2.5 py-2 mt-1 resize-none" />
            <p className="text-[10.5px] mt-1" style={{ color: "var(--text-faint)" }}>Dietary and accessibility answers are saved to your profile for next time.</p>
          </div>
          {openEvents.length === 0 && (
            <p className="text-[12px]" style={{ color: "#D9534F" }}>No events are currently open for registration.</p>
          )}
          <button type="submit" disabled={openEvents.length === 0} className="whmi-btn-primary w-full" style={{ opacity: openEvents.length === 0 ? 0.5 : 1 }}>Submit Registration</button>
        </form>
      </div>
    </div>
  );
}
