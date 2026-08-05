import { useState, useEffect } from "react";
import { X, ClipboardList, Calendar, Clock, MapPin } from "lucide-react";
import { fmtDate, fmtTimeRange12h, eventLocationSuffix } from "../lib/helpers";

export default function RegisterEventModal({ open, onClose, session, events, defaultEventId, onSubmit }) {
  const openEvents = events.filter(e => e.status === "Registration Open");
  const [eventId, setEventId] = useState(defaultEventId || openEvents[0]?.id || "");
  const [name, setName] = useState(session?.name || "");
  const [email, setEmail] = useState(session?.email || "");
  const [profession, setProfession] = useState(session?.profession || "");
  const [attendanceType, setAttendanceType] = useState("In-person");
  const [dietary, setDietary] = useState(session?.dietaryRequirements || "");
  const [accessibility, setAccessibility] = useState(session?.accessibility || "");
  const [comments, setComments] = useState("");

  const selectedEvent = openEvents.find(e => e.id === eventId);

  useEffect(() => {
    if (!open) return;
    setEventId(defaultEventId || openEvents[0]?.id || "");
    setName(session?.name || "");
    setEmail(session?.email || "");
    setProfession(session?.profession || "");
    setDietary(session?.dietaryRequirements || "");
    setAccessibility(session?.accessibility || "");
    setComments("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultEventId]);

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    if (!eventId || !name.trim() || !email.trim()) return;
    onSubmit({
      eventId, name: name.trim(), email: email.trim(), profession: profession.trim(),
      attendanceType: selectedEvent?.mode === "Hybrid" ? attendanceType : null,
      dietary: dietary.trim(), accessibility: accessibility.trim(), comments: comments.trim(),
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
            <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Event</label>
            <div className="space-y-2 mt-1 max-h-64 overflow-y-auto whmi-scroll pr-0.5">
              {openEvents.map(ev => (
                <button
                  key={ev.id} type="button" onClick={() => setEventId(ev.id)}
                  className="w-full text-left p-3 rounded-xl transition"
                  style={{ border: `2px solid ${eventId === ev.id ? "var(--accent-primary)" : "var(--border)"}`, background: eventId === ev.id ? "var(--surface-2)" : "transparent" }}
                >
                  <div className="font-semibold text-[14px] break-words">{ev.title}</div>
                  <div className="flex items-center gap-3 mt-1 text-[11.5px] flex-wrap" style={{ color: "var(--text-dim)" }}>
                    <span className="flex items-center gap-1"><Calendar size={11} />{fmtDate(ev.date)}</span>
                    <span className="flex items-center gap-1"><Clock size={11} />{fmtTimeRange12h(ev.start, ev.end)}</span>
                  </div>
                  {(ev.campus || ev.location) && (
                    <div className="flex items-center gap-1 mt-1 text-[11.5px]" style={{ color: "var(--text-dim)" }}>
                      <MapPin size={11} />
                      <span>{ev.campus ? <><b>{ev.campus}</b>{eventLocationSuffix(ev) ? ` - ${eventLocationSuffix(ev)}` : ""}</> : eventLocationSuffix(ev)}</span>
                    </div>
                  )}
                  {session?.userType === "external" && ev.externalPrice != null && (
                    <div className="text-[11.5px] mt-1 font-semibold" style={{ color: "var(--accent-primary)" }}>${Number(ev.externalPrice).toFixed(2)} AUD</div>
                  )}
                  {ev.description && <p className="text-[11.5px] mt-1.5 line-clamp-2" style={{ color: "var(--text-faint)" }}>{ev.description}</p>}
                </button>
              ))}
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
            <textarea value={dietary} onChange={e => setDietary(e.target.value)} rows={2} placeholder="None, vegetarian, allergies, etc." className="whmi-input w-full px-2.5 py-2 mt-1 resize-none" />
          </div>
          <div>
            <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Accessibility Requirements</label>
            <textarea value={accessibility} onChange={e => setAccessibility(e.target.value)} rows={2} placeholder="None, wheelchair access, hearing loop, etc." className="whmi-input w-full px-2.5 py-2 mt-1 resize-none" />
          </div>
          <div>
            <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Additional Comments</label>
            <textarea value={comments} onChange={e => setComments(e.target.value)} rows={2} className="whmi-input w-full px-2.5 py-2 mt-1 resize-none" />
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
