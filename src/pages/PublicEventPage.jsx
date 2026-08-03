import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar, Clock, MapPin, UserCircle2, CheckCircle2 } from "lucide-react";
import ModeBadge from "../components/ModeBadge";
import { CAMPUS_OPTIONS } from "../data/mockData";
import { fmtDate, fmtTimeRange12h } from "../lib/helpers";

const WH_DOMAIN = "@wh.org.au";

export default function PublicEventPage({ events, session, onPublicRegister }) {
  const { eventId } = useParams();
  const event = events.find(e => e.id === eventId);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(session?.name || "");
  const [email, setEmail] = useState(session?.email || "");
  const [profession, setProfession] = useState("");
  const [campus, setCampus] = useState("");
  const [attendanceType, setAttendanceType] = useState("In-person");
  const [dietary, setDietary] = useState(session?.dietaryRequirements || "");
  const [accessibility, setAccessibility] = useState(session?.accessibility || "");
  const [comments, setComments] = useState("");
  const [askWhStaff, setAskWhStaff] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!event) {
    return (
      <div className="whmi-root light min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg)", color: "var(--text)" }}>
        <div className="text-center">
          <h1 className="disp text-[20px] font-extrabold mb-2">Event not found</h1>
          <p className="text-[13px]" style={{ color: "var(--text-faint)" }}>This event may have been removed or the link is incorrect.</p>
        </div>
      </div>
    );
  }

  const isWhEmail = email.trim().toLowerCase().endsWith(WH_DOMAIN);

  const submit = (e, whStaffAnswer) => {
    if (e) e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    if (!session && !isWhEmail && whStaffAnswer === undefined) {
      setAskWhStaff(true);
      return;
    }

    onPublicRegister({
      eventId: event.id,
      name: name.trim(),
      email: email.trim(),
      profession: profession.trim(),
      campus,
      attendanceType: event.mode === "Hybrid" ? attendanceType : null,
      dietary: dietary.trim(),
      accessibility: accessibility.trim(),
      comments: comments.trim(),
      isWhStaffAnswer: whStaffAnswer,
    });
    setSubmitted(true);
  };

  return (
    <div className="whmi-root light min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-2xl mx-auto p-6 space-y-5">
        <Link to="/" className="whmi-logo-full block mx-auto" style={{ width: 150, height: 77 }} />

        <div className="whmi-card overflow-hidden">
          <div className="h-40 flex items-center justify-center relative" style={{ background: "var(--accent-primary)" }}>
            <span className="text-white font-extrabold text-[20px] disp z-10 px-6 text-center break-words">{event.topic}</span>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <ModeBadge mode={event.mode} />
              <h1 className="disp text-[22px] font-extrabold mt-2 break-words">{event.title}</h1>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13.5px]">
              <div className="flex items-center gap-2"><Calendar size={15} style={{ color: "var(--text-faint)" }} /><span>{fmtDate(event.date)}</span></div>
              <div className="flex items-center gap-2"><Clock size={15} style={{ color: "var(--text-faint)" }} /><span>{fmtTimeRange12h(event.start, event.end)}</span></div>
              <div className="flex items-center gap-2"><MapPin size={15} style={{ color: "var(--text-faint)" }} /><span className="break-words">{event.location}</span></div>
              <div className="flex items-center gap-2"><UserCircle2 size={15} style={{ color: "var(--text-faint)" }} /><span>{event.presenter}</span></div>
            </div>

            {event.status !== "Registration Open" ? (
              <div className="whmi-card p-3 text-[13px]" style={{ color: "var(--text-faint)" }}>Registration isn't open for this event yet; check back soon.</div>
            ) : submitted ? (
              <div className="whmi-card p-4 flex items-center gap-2" style={{ color: "var(--accent-success)" }}>
                <CheckCircle2 size={18} /><span className="font-semibold text-[13.5px]">You're registered! We've noted your details.</span>
              </div>
            ) : !showForm ? (
              <button onClick={() => setShowForm(true)} className="whmi-btn-primary w-full">Register for this Event</button>
            ) : (
              <form onSubmit={(e) => submit(e)} className="whmi-card p-4 space-y-3">
                {session && (
                  <p className="text-[12px]" style={{ color: "var(--text-faint)" }}>Registering as <strong style={{ color: "var(--text)" }}>{session.name}</strong> ({session.email}), synced to your account.</p>
                )}
                <div>
                  <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Name</label>
                  <input required disabled={!!session} value={name} onChange={e => setName(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Email</label>
                  <input required disabled={!!session} type="email" value={email} onChange={e => { setEmail(e.target.value); setAskWhStaff(false); }} className="whmi-input w-full px-2.5 py-2 mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Staff Profession</label>
                    <input value={profession} onChange={e => setProfession(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Department / Campus</label>
                    <select value={campus} onChange={e => setCampus(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1">
                      <option value="">—</option>
                      {CAMPUS_OPTIONS.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                {event.mode === "Hybrid" && (
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
                </div>

                {askWhStaff ? (
                  <div className="whmi-card p-3 space-y-2">
                    <p className="text-[12.5px] font-semibold">Are you a Western Health staff member?</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => submit(null, true)} className="whmi-btn-primary flex-1">Yes</button>
                      <button type="button" onClick={() => submit(null, false)} className="whmi-btn-ghost flex-1">No</button>
                    </div>
                  </div>
                ) : (
                  <button type="submit" className="whmi-btn-primary w-full">Submit Registration</button>
                )}
                <p className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>No login required, this creates a lightweight record so we can send your certificate afterwards.</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
