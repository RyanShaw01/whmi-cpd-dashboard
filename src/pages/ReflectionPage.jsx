import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { fmtDate, splitPeopleList, parsePerson } from "../lib/helpers";
import { sendReflectionCertificate, fetchPublicEvent } from "../lib/db";

const APPROPRIATENESS_OPTIONS = ["Too basic", "Slightly too basic", "Appropriate", "Slightly too advanced", "Too advanced"];

const label = "text-[11px] font-semibold";
const required = <span style={{ color: "#D9534F" }}> *</span>;

function ScaleField({ label: text, lowLabel, highLabel, value, onChange }) {
  const percent = value / 10;
  return (
    <div>
      <label className={label} style={{ color: "var(--text-faint)" }}>{text}{required}</label>
      <div className="flex items-center gap-2 mt-4">
        <span className="text-[10px] text-right shrink-0 leading-tight" style={{ color: "var(--text-faint)", width: 68 }}>0<br />{lowLabel}</span>
        <div className="relative flex-1">
          <div
            className="absolute flex items-center justify-center rounded-full text-white text-[10px] font-bold"
            style={{ width: 20, height: 20, top: -22, left: `calc(8px + (100% - 16px) * ${percent})`, transform: "translateX(-50%)", background: "var(--accent-primary)" }}
          >
            {value}
          </div>
          <input type="range" min={0} max={10} step={1} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full block" />
          <span className="absolute text-[9px]" style={{ color: "var(--text-faint)", top: 14, left: "50%", transform: "translateX(-50%)" }}>5</span>
        </div>
        <span className="text-[10px] shrink-0 leading-tight" style={{ color: "var(--text-faint)", width: 68 }}>10<br />{highLabel}</span>
      </div>
    </div>
  );
}

export default function ReflectionPage({ events, previousEvents, session, onSubmitReflection, loading }) {
  const { eventId } = useParams();
  // The reflection link is meant to be used AFTER an event ends - by then the event has very
  // likely already completed and moved out of `events` (upcoming-only) into `previousEvents`, so
  // it has to be searched for in both, not just the upcoming list.
  const listedEvent = events.find(e => e.id === eventId) || (previousEvents || []).find(e => e.id === eventId);
  // Falls back to a direct, RLS-bypassing lookup when the id isn't in either list - covers an
  // anonymous visitor whose session never fetched previousEvents at all, and any gap in the
  // anon-read RLS policy for whatever status this event is currently under.
  const [fallbackEvent, setFallbackEvent] = useState(null);
  const [fallbackStarted, setFallbackStarted] = useState(false);
  const [fallbackLoading, setFallbackLoading] = useState(false);
  useEffect(() => {
    if (loading || listedEvent || fallbackStarted) return;
    setFallbackStarted(true);
    setFallbackLoading(true);
    fetchPublicEvent(eventId).then(result => {
      setFallbackEvent(result);
      setFallbackLoading(false);
    });
  }, [loading, listedEvent, fallbackStarted, eventId]);
  const event = listedEvent || fallbackEvent;
  const [name, setName] = useState(session?.name || "");
  const [email, setEmail] = useState(session?.email || "");
  const [quality, setQuality] = useState(5);
  const [relevance, setRelevance] = useState(5);
  const [appropriateness, setAppropriateness] = useState("Appropriate");
  const [content, setContent] = useState("");
  const [mostValuable, setMostValuable] = useState("");
  const [improvements, setImprovements] = useState("");
  const [futureTopics, setFutureTopics] = useState("");
  const [status, setStatus] = useState("idle"); // idle | submitting | sending | done
  const [errors, setErrors] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!event) {
    // While the app's initial data load (or the id-specific fallback lookup) is still in flight,
    // this looks identical to a genuinely missing event - show the branded loading state instead
    // of flashing "Event not found" at people opening their reflection link fresh (no app state
    // loaded yet, or still waiting on the fallback fetch).
    if (loading || fallbackLoading || !fallbackStarted) {
      return (
        <div className="whmi-root light min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg)", color: "var(--text)" }}>
          <div className="flex items-center justify-center gap-2.5 animate-pulse">
            <div className="whmi-logo-full shrink-0" style={{ width: 72, height: 37 }} />
            <div className="text-left leading-tight">
              <div className="font-extrabold text-[13px]" style={{ color: "var(--text)" }}>Medical Imaging CPD</div>
              <div className="text-[10px]" style={{ color: "var(--text-faint)" }}>Western Health</div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="whmi-root light min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg)", color: "var(--text)" }}>
        <div className="text-center">
          <h1 className="disp text-[20px] font-extrabold mb-2">Event not found</h1>
          <p className="text-[13px]" style={{ color: "var(--text-faint)" }}>This link may be incorrect.</p>
        </div>
      </div>
    );
  }

  const validate = () => {
    const next = {};
    if (!name.trim()) next.name = "Please enter your name.";
    if (!email.trim()) next.email = "Please enter your email address.";
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "Please enter a valid email address.";
    if (!content.trim()) next.content = "Please write your reflection.";
    setErrors(next);
    return next;
  };

  const requestSubmit = (e) => {
    e.preventDefault();
    const next = validate();
    if (Object.keys(next).length > 0) return;
    setConfirmOpen(true);
  };

  const confirmSubmit = async () => {
    setConfirmOpen(false);
    setStatus("submitting");
    const reflection = onSubmitReflection({
      eventId: event.id, name: name.trim(), email: email.trim(),
      rating: quality, relevanceRating: relevance, appropriateness,
      content: content.trim(), mostValuable: mostValuable.trim(), improvements: improvements.trim(), futureTopics: futureTopics.trim(),
      eventTitle: event.title, presenter: event.presenter,
    });
    setStatus("sending");
    await sendReflectionCertificate(reflection.id);
    setStatus("done");
  };

  const errorCount = Object.keys(errors).length;
  const fieldClass = (key) => `whmi-input w-full px-2.5 py-1.5 mt-1 text-[12.5px]${errors[key] ? " !border-2" : ""}`;
  const fieldStyle = (key) => errors[key] ? { borderColor: "#D9534F" } : undefined;

  return (
    <div className="whmi-root light min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-2xl mx-auto p-6 space-y-5">
        <Link to="/" className="whmi-logo-full block mx-auto" style={{ width: 150, height: 77 }} />

        <div className="whmi-card p-6 space-y-4">
          <div className="text-center">
            <h1 className="disp text-[19px] font-extrabold">WHMI CPD Reflection & Feedback Form</h1>
          </div>

          <div className="whmi-card p-3" style={{ background: "var(--surface-2)" }}>
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>{fmtDate(event.date)}</span>
            <h2 className="disp text-[16px] font-extrabold break-words">{event.title}</h2>
            {(() => {
              const presenters = splitPeopleList(event.presenter).map(parsePerson);
              if (presenters.length === 0) return null;
              if (presenters.length === 1) {
                return (
                  <p className="text-[12.5px]" style={{ color: "var(--text-dim)" }}>
                    Presented by {presenters[0].name}{presenters[0].title && <span style={{ color: "var(--text-faint)" }}> — {presenters[0].title}</span>}
                  </p>
                );
              }
              return (
                <div className="text-[12.5px]" style={{ color: "var(--text-dim)" }}>
                  Presented by:
                  <ul className="mt-1 break-words" style={{ paddingLeft: 16, listStyleType: "disc" }}>
                    {presenters.map((p, i) => <li key={i}>{p.name}{p.title && <span style={{ color: "var(--text-faint)" }}> — {p.title}</span>}</li>)}
                  </ul>
                </div>
              );
            })()}
          </div>

          <div className="space-y-2 text-[12.5px]" style={{ color: "var(--text-dim)" }}>
            <p>Please complete the following reflection and feedback questions for this CPD activity.</p>
            <p className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>
              The MRPBA requires practitioners to maintain evidence of CPD participation, including reflection on learning activities and their relevance to professional practice. Reflection assists in identifying key learning outcomes, reinforcing professional development, and considering how new knowledge may influence clinical practice and patient care.
            </p>
            <p className="font-bold" style={{ color: "var(--accent-primary)" }}>Completion of this form will generate an automated CPD certificate for your records.</p>
          </div>

          {status === "done" ? (
            <div className="whmi-card p-4 flex items-center gap-2" style={{ color: "var(--accent-success)" }}>
              <CheckCircle2 size={18} /><span className="font-semibold text-[13.5px]">Thanks! Your CPD certificate is on its way to your email, along with a copy of your reflection.</span>
            </div>
          ) : (
            <form onSubmit={requestSubmit} className="space-y-4" noValidate>
              {errorCount > 0 && (
                <div className="whmi-card p-3 flex items-start gap-2 font-semibold text-[12.5px]" style={{ background: "rgba(217,83,79,.1)", borderColor: "#D9534F", color: "#D9534F" }}>
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    Please fix the following before submitting:
                    <ul className="list-disc pl-4 mt-0.5">
                      {Object.values(errors).map(msg => <li key={msg}>{msg}</li>)}
                    </ul>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label} style={{ color: errors.name ? "#D9534F" : "var(--text-faint)" }}>1. Full name{required}</label>
                  <input value={name} onChange={e => setName(e.target.value)} className={fieldClass("name")} style={fieldStyle("name")} />
                </div>
                <div>
                  <label className={label} style={{ color: errors.email ? "#D9534F" : "var(--text-faint)" }}>2. Email address{required}</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={fieldClass("email")} style={fieldStyle("email")} />
                </div>
              </div>
              <p className="text-[10.5px] -mt-2.5" style={{ color: "var(--text-faint)" }}>This is so we can send your CPD certificate to the right person with the right information.</p>

              <div>
                <label className={label} style={{ color: errors.content ? "#D9534F" : "var(--text-faint)" }}>3. As required by the MRPBA CPD requirements, please provide a brief reflection on your learning from this activity and how it may influence your professional practice.{required}</label>
                <div className="text-[10.5px] mt-1.5 ml-3 pl-4" style={{ color: "var(--text-faint)", borderLeft: "2px solid var(--border)" }}>
                  An easy-to-follow structure for reflection can include:
                  <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                    <li>What did you learn from this activity?</li>
                    <li>Why was this learning relevant to your role?</li>
                    <li>How will this influence your practice or patient care?</li>
                    <li>What further learning or actions are needed?</li>
                  </ul>
                </div>
                <textarea value={content} onChange={e => setContent(e.target.value)} rows={5} placeholder="Write your reflection here" className={`whmi-input w-full px-2.5 py-2 mt-2 resize-none${errors.content ? " !border-2" : ""}`} style={fieldStyle("content")} />
              </div>

              <ScaleField label="4. How would you rate the overall quality of this CPD activity?" lowLabel="Poor" highLabel="Excellent" value={quality} onChange={setQuality} />
              <ScaleField label="5. How relevant did you find the CPD event?" lowLabel="Not relevant to me at all" highLabel="Very relevant to me" value={relevance} onChange={setRelevance} />

              <div>
                <label className={label} style={{ color: "var(--text-faint)" }}>6. Was the session content appropriate for your level of experience?</label>
                <div className="relative mt-4 px-2" style={{ height: 24 }}>
                  <div className="absolute left-2 right-2 rounded-full" style={{ top: 10, height: 4, background: "var(--border)" }} />
                  <div className="absolute left-2 right-2 flex justify-between items-center" style={{ top: 4 }}>
                    {APPROPRIATENESS_OPTIONS.map((opt, i) => {
                      const selected = opt === appropriateness;
                      const big = i % 2 === 0;
                      return (
                        <div
                          key={opt} title={opt}
                          className="rounded-full shrink-0"
                          style={{
                            width: selected ? 22 : big ? 14 : 10, height: selected ? 22 : big ? 14 : 10,
                            background: selected ? "var(--accent-primary)" : "var(--surface-2)",
                            border: selected ? "3px solid var(--accent-primary)" : "1px solid var(--border)",
                          }}
                        />
                      );
                    })}
                  </div>
                  <input
                    type="range" min={0} max={APPROPRIATENESS_OPTIONS.length - 1} step={1}
                    value={APPROPRIATENESS_OPTIONS.indexOf(appropriateness)}
                    onChange={e => setAppropriateness(APPROPRIATENESS_OPTIONS[Number(e.target.value)])}
                    className="absolute left-0 w-full"
                    style={{ top: 0, height: 24, opacity: 0, cursor: "pointer" }}
                  />
                </div>
                <div className="flex justify-between px-2 mt-1 text-[9.5px] leading-tight text-center">
                  {APPROPRIATENESS_OPTIONS.map((opt, i) => (
                    <span
                      key={opt}
                      style={{
                        width: i === 0 || i === APPROPRIATENESS_OPTIONS.length - 1 ? 60 : 50,
                        color: opt === appropriateness ? "var(--accent-primary)" : "var(--text-faint)",
                        fontWeight: opt === appropriateness ? 700 : 400,
                      }}
                    >
                      {opt}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className={label} style={{ color: "var(--text-faint)" }}>7. Which aspects of the session were most valuable?</label>
                <textarea value={mostValuable} onChange={e => setMostValuable(e.target.value)} rows={2} className="whmi-input w-full px-2.5 py-2 mt-1 resize-none" />
              </div>
              <div>
                <label className={label} style={{ color: "var(--text-faint)" }}>8. What could be improved for future sessions?</label>
                <textarea value={improvements} onChange={e => setImprovements(e.target.value)} rows={2} className="whmi-input w-full px-2.5 py-2 mt-1 resize-none" />
              </div>
              <div>
                <label className={label} style={{ color: "var(--text-faint)" }}>9. What topics would you like included in future CPD sessions?</label>
                <textarea value={futureTopics} onChange={e => setFutureTopics(e.target.value)} rows={2} className="whmi-input w-full px-2.5 py-2 mt-1 resize-none" />
              </div>

              <button type="submit" disabled={status !== "idle"} className="whmi-btn-primary w-full" style={{ opacity: status !== "idle" ? 0.7 : 1 }}>
                {status === "idle" && "Submit Reflection"}
                {status === "submitting" && "Submitting…"}
                {status === "sending" && "Generating your certificate…"}
              </button>
              <p className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>No login required. Submitting your reflection automatically emails you your CPD certificate.</p>
            </form>
          )}
        </div>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.5)" }} onClick={() => setConfirmOpen(false)}>
          <div className="whmi-card w-full max-w-sm p-5 space-y-3" onClick={e => e.stopPropagation()}>
            <h2 className="disp text-[15px] font-extrabold">Submit your reflection?</h2>
            <p className="text-[12.5px]" style={{ color: "var(--text-dim)" }}>Are you sure you want to submit? Your CPD certificate will be emailed to you right after.</p>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setConfirmOpen(false)} className="whmi-btn-ghost flex-1">Cancel</button>
              <button onClick={confirmSubmit} className="whmi-btn-primary flex-1">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
