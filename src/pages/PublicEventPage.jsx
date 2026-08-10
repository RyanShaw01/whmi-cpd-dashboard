import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar, Clock, MapPin, UserCircle2, Maximize2, X, DollarSign } from "lucide-react";
import ModeBadge from "../components/ModeBadge";
import RegistrationSuccessCard from "../components/RegistrationSuccessCard";
import { fmtDate, fmtTimeRange12h, eventLocationSuffix, eventBannerUrl } from "../lib/helpers";

const WH_DOMAIN = "@wh.org.au";
const NAVY = "#152A4E";

export default function PublicEventPage({ events, session, onPublicRegister, files, loading }) {
  const { eventId } = useParams();
  const event = events.find(e => e.id === eventId);
  const [showForm, setShowForm] = useState(false);
  const [sessionNameParts] = useState(() => {
    const parts = (session?.name || "").trim().split(/\s+/);
    return { first: parts[0] || "", last: parts.slice(1).join(" ") || "" };
  });
  const [firstName, setFirstName] = useState(sessionNameParts.first);
  const [lastName, setLastName] = useState(sessionNameParts.last);
  const [email, setEmail] = useState(session?.email || "");
  const [profession, setProfession] = useState(session?.profession || "");
  const [organisation, setOrganisation] = useState(session?.organisation || "");
  const [attendanceType, setAttendanceType] = useState("In-person");
  const [dietary, setDietary] = useState(session?.dietaryRequirements || "");
  const [accessibility, setAccessibility] = useState(session?.accessibility || "");
  const [askWhStaff, setAskWhStaff] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [flyerExpanded, setFlyerExpanded] = useState(false);

  if (!event) {
    // While the app's initial data load is still in flight, this looks identical to a genuinely
    // missing event — show a spinner instead of flashing "Event not found" at people testing
    // their own share link while already signed in.
    if (loading) {
      return (
        <div className="whmi-root light min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg)", color: "var(--text)" }}>
          <div className="whmi-logo-icon animate-pulse" style={{ width: 48, height: 26, opacity: 0.5 }} />
        </div>
      );
    }
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
  const isExternalRegistrant = !!session ? session.userType === "external" : (askWhStaff || (email.trim() && !isWhEmail));
  const flyerUrl = eventBannerUrl(files, event.id);

  const submit = (e, whStaffAnswer) => {
    if (e) e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) return;

    if (!session && !isWhEmail && whStaffAnswer === undefined) {
      setAskWhStaff(true);
      return;
    }

    onPublicRegister({
      eventId: event.id,
      name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      email: email.trim(),
      profession: profession.trim(),
      organisation: organisation.trim(),
      attendanceType: event.mode === "Hybrid" ? attendanceType : null,
      dietary: dietary.trim(),
      accessibility: accessibility.trim(),
      isWhStaffAnswer: whStaffAnswer,
    });
    setSubmitted(true);
  };

  return (
    <div className="whmi-root light min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-2xl mx-auto p-6 space-y-5">
        <div className="flex items-center justify-center gap-2.5">
          <Link to="/" className="whmi-logo-full shrink-0" style={{ width: 72, height: 37 }} />
          <div className="text-left leading-tight">
            <div className="font-extrabold text-[13px]" style={{ color: "var(--text)" }}>Medical Imaging CPD</div>
            <div className="text-[10px]" style={{ color: "var(--text-faint)" }}>Western Health</div>
          </div>
        </div>

        <div className="whmi-card overflow-hidden">
          {flyerUrl ? (
            <div className="relative h-40 flex items-center justify-center overflow-hidden" style={{ background: "var(--surface-2)" }}>
              <img src={flyerUrl} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" style={{ filter: "blur(42px) saturate(1.3) brightness(0.85)", transform: "scale(1.35)" }} />
              <div className="absolute inset-0" style={{ background: "rgba(0,0,0,.15)" }} />
              <img src={flyerUrl} alt="" className="relative max-w-full max-h-full object-contain" style={{ boxShadow: "0 4px 24px rgba(0,0,0,.25)" }} />
              <button
                onClick={() => setFlyerExpanded(true)}
                className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,.45)" }}
                title="View full flyer"
                type="button"
              >
                <Maximize2 size={14} color="white" />
              </button>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center relative" style={{ background: "var(--accent-primary)" }}>
              <span className="text-white font-extrabold text-[20px] disp z-10 px-6 text-center break-words">{event.topic}</span>
            </div>
          )}
          <div className="p-6 space-y-4">
            <div>
              <ModeBadge mode={event.mode} />
              <h1 className="disp text-[22px] font-extrabold mt-2 break-words">{event.title}</h1>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13.5px]">
              <div className="flex items-center gap-2"><Calendar size={15} style={{ color: "var(--text-faint)" }} /><span>{fmtDate(event.date)}</span></div>
              <div className="flex items-center gap-2"><Clock size={15} style={{ color: "var(--text-faint)" }} /><span>{fmtTimeRange12h(event.start, event.end)}</span></div>
              <div className="flex items-start gap-2"><MapPin size={15} style={{ color: "var(--text-faint)" }} className="shrink-0 mt-0.5" /><span className="break-words">{event.campus && <strong>{event.campus}</strong>}{event.campus && eventLocationSuffix(event) ? " - " : ""}{eventLocationSuffix(event)}</span></div>
              <div className="flex items-center gap-2"><UserCircle2 size={15} style={{ color: "var(--text-faint)" }} /><span>{event.presenter}</span></div>
            </div>

            {event.status !== "Registration Open" ? (
              <div className="whmi-card p-3 text-[13px]" style={{ color: "var(--text-faint)" }}>Registration isn't open for this event yet; check back soon.</div>
            ) : submitted ? (
              <RegistrationSuccessCard event={event} />
            ) : !showForm ? (
              <div className="space-y-1.5">
                {event.openToExternal !== false && (
                  <div className="flex items-center justify-end gap-1 text-[12px] font-semibold" style={{ color: event.externalPrice ? NAVY : "var(--accent-success)" }}>
                    <DollarSign size={12} />{event.externalPrice ? `$${Number(event.externalPrice).toFixed(2)} AUD` : "Free"}
                  </div>
                )}
                <button onClick={() => setShowForm(true)} className="w-full py-2.5 rounded-xl font-semibold text-[13.5px]" style={{ background: NAVY, color: "#fff" }}>Register for this Event</button>
              </div>
            ) : (
              <form onSubmit={(e) => submit(e)} className="whmi-card p-4 space-y-3">
                {session && (
                  <p className="text-[12px]" style={{ color: "var(--text-faint)" }}>Registering as <strong style={{ color: "var(--text)" }}>{session.name}</strong> ({session.email}), synced to your account.</p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>First Name</label>
                    <input required value={firstName} onChange={e => setFirstName(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Last Name</label>
                    <input required value={lastName} onChange={e => setLastName(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Email</label>
                  <input required type="email" value={email} onChange={e => { setEmail(e.target.value); setAskWhStaff(false); }} className="whmi-input w-full px-2.5 py-2 mt-1" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Profession</label>
                  <input value={profession} onChange={e => setProfession(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1" />
                </div>
                {isExternalRegistrant && (
                  <div>
                    <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Hospital / University / Business</label>
                    <input value={organisation} onChange={e => setOrganisation(e.target.value)} placeholder="Which organisation are you from?" className="whmi-input w-full px-2.5 py-2 mt-1" />
                  </div>
                )}
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
                  <textarea value={dietary} onChange={e => setDietary(e.target.value)} rows={2} placeholder="Vegetarian, allergies, etc." className="whmi-input w-full px-2.5 py-2 mt-1 resize-none" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Accessibility Requirements</label>
                  <textarea value={accessibility} onChange={e => setAccessibility(e.target.value)} rows={2} placeholder="Wheelchair access, hearing loop, etc." className="whmi-input w-full px-2.5 py-2 mt-1 resize-none" />
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

      {flyerExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.8)" }} onClick={() => setFlyerExpanded(false)}>
          <button onClick={() => setFlyerExpanded(false)} className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,.15)" }}>
            <X size={18} color="white" />
          </button>
          <img src={flyerUrl} alt="" className="max-w-full max-h-full object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
