import { useState } from "react";
import { X, Calendar, UserCircle2, Star, Video, Save, Download, Info, Pencil, Copy, Mail, Award, Trash2, Lock, MailCheck } from "lucide-react";
import StatusBadge from "./StatusBadge";
import ModeBadge from "./ModeBadge";
import EventFilesPanel from "./EventFilesPanel";
import ReflectionsPanel from "./ReflectionsPanel";
import RegistrationsPanel from "./RegistrationsPanel";
import EventForm from "./EventForm";
import { fmtDate, eventLocationSuffix, relativeTime, eventBannerUrl } from "../lib/helpers";

const TABS = ["overview", "attendance", "files", "recording", "feedback", "reflections", "certificates", "email"];

const CERT_SORT_OPTIONS = [
  { id: "date-desc", label: "Newest - Oldest" },
  { id: "date-asc", label: "Oldest - Newest" },
  { id: "alpha-asc", label: "Alphabetical (A - Z)" },
  { id: "alpha-desc", label: "Alphabetical (Z - A)" },
];
function sortCerts(list, sortBy) {
  const sorted = [...list];
  sorted.sort((a, b) => {
    if (sortBy === "alpha-asc") return (a.staff || "").localeCompare(b.staff || "");
    if (sortBy === "alpha-desc") return (b.staff || "").localeCompare(a.staff || "");
    const av = a.sentAt || a.date || "";
    const bv = b.sentAt || b.date || "";
    return sortBy === "date-asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });
  return sorted;
}

function avg(nums) {
  const vals = nums.filter(n => n != null);
  if (vals.length === 0) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

export default function PreviousEventDetailModal({
  event, onClose, registrations, certificates, reflections, session, onEdit, canManage, onRequestDelete,
  dismissedReflectionPairs, onMergeReflections, onDismissReflectionPair, onDeleteReflection,
  onDeleteRegistration, onUpdateRegistration, onUpdateAttendanceStatus,
  dismissedRegistrationPairs, onMergeRegistrations, onDismissRegistrationPair,
  cpdTypes, tags, onSaveTag, onFilesChange, files, onUpdateBannerCrop, onRemoveBanner,
  onCreateCertificateFor, onSendReflectionReminder, onSendAllReflectionReminders, onSendThankYouEmail, initialTab, initialEditing, seriesEvents = [], onSwitchEvent, onDuplicate,
}) {
  const [tab, setTab] = useState(initialTab || "overview");
  const [certSortBy, setCertSortBy] = useState("date-desc");
  const [recordingUrl, setRecordingUrl] = useState(event?.recordingUrl || "");
  const [savedNote, setSavedNote] = useState(false);
  // This modal remounts on every event change (App.jsx keys it by event.id), so a one-time
  // useState initializer is enough to jump straight into edit mode for a freshly-duplicated event.
  const [editing, setEditing] = useState(!!initialEditing);
  const [formDirty, setFormDirty] = useState(false);
  if (!event) return null;

  // Recurring series that opted to stay grouped once occurrences move to Previous Events.
  const seriesSiblings = event.recurrenceGroupId && event.groupInPrevious
    ? seriesEvents.filter(e => e.recurrenceGroupId === event.recurrenceGroupId).sort((a, b) => `${a.date}T${a.start || ""}`.localeCompare(`${b.date}T${b.start || ""}`))
    : [];
  const bannerUrl = eventBannerUrl(files, event.id);

  if (editing) {
    const attemptCloseEdit = () => {
      if (formDirty && !window.confirm("You have unsaved changes. Are you sure you want to leave without saving?")) return;
      setEditing(false);
    };
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.5)" }} onClick={attemptCloseEdit}>
        <div className="whmi-card w-full max-w-3xl max-h-[85vh] overflow-y-auto whmi-scroll whmi-fade-in" onClick={e => e.stopPropagation()}>
          <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="disp text-[16px] font-extrabold">Edit Event</h2>
            <div className="flex items-center gap-1.5">
              {canManage && onRequestDelete && (
                <button onClick={() => onRequestDelete(event)} className="whmi-btn-ghost !p-2" title="Delete event" style={{ color: "#D9534F" }}><Trash2 size={14} /></button>
              )}
              <button onClick={attemptCloseEdit} className="whmi-btn-ghost !p-2"><X size={14} /></button>
            </div>
          </div>
          <div className="p-5">
            <EventForm
              event={event}
              onSave={(payload) => { onEdit(payload); setEditing(false); }}
              onCancel={attemptCloseEdit}
              onDirtyChange={setFormDirty}
              uploadedBy={session?.id}
              cpdTypes={cpdTypes}
              tags={tags}
              onSaveTag={onSaveTag}
              onFilesChange={onFilesChange}
              files={files}
              onUpdateBannerCrop={onUpdateBannerCrop}
              onRemoveBanner={onRemoveBanner}
            />
          </div>
        </div>
      </div>
    );
  }

  // Non-managers only get the full attendee/certificate/reflection/feedback lists if they're
  // the ones managing the event; everyone else gets a read-only overview, plus recordings/files
  // - unconditionally for internal (WH staff) viewers, and for external viewers only if they
  // attended (or the event had a price, implying they paid to be there).
  const myRegistration = session ? (registrations || []).find(r => r.eventId === event.id && r.userId === session.id) : null;
  const viewerHasFileAccess = canManage || session?.userType === "internal"
    || !!(myRegistration && (myRegistration.attendanceStatus === "Attended" || event.externalPrice != null));
  const visibleTabs = canManage ? TABS : TABS.filter(t => !["attendance", "certificates", "reflections", "feedback", "email"].includes(t));

  const eventRegistrations = (registrations || []).filter(r => r.eventId === event.id);
  // `event.attendance` is already live-computed with a seed-data fallback (Phase 10); reuse
  // it rather than recomputing straight from registrations, which would ignore that fallback.
  const attended = event.attendance;
  const noShow = eventRegistrations.filter(r => r.attendanceStatus === "No Show").length;
  const eventReflections = (reflections || []).filter(r => r.eventId === event.id);
  const eventCertificates = (certificates || []).filter(c => c.eventId === event.id);
  const sentCerts = eventCertificates.filter(c => c.status === "Sent");
  const awaitingCerts = eventCertificates.filter(c => c.status === "Awaiting Approval");

  const reflectedEmails = new Set(eventReflections.map(r => (r.email || "").toLowerCase()));
  const awaitingReflection = eventRegistrations.filter(r =>
    (r.attendanceStatus === "Registered" || r.attendanceStatus === "Attended") &&
    !reflectedEmails.has((r.email || "").toLowerCase())
  );

  // Thank-you email eligibility: same population the automated post-event cron and the manual
  // send both target (Registered/Attended), so "everyone already emailed" here matches exactly
  // what would grey the button out whether it was sent automatically or by hand.
  const thankYouEligible = eventRegistrations.filter(r => ["Registered", "Attended"].includes(r.attendanceStatus || "Registered"));
  const thankYouUnsent = thankYouEligible.filter(r => !r.reminderSentAt);
  const thankYouLastSentAt = thankYouEligible.reduce((latest, r) => (r.reminderSentAt && (!latest || r.reminderSentAt > latest)) ? r.reminderSentAt : latest, null);

  const SendThankYouControl = () => (
    canManage && onSendThankYouEmail ? (
      <div className="flex items-center gap-2">
        <button
          onClick={() => onSendThankYouEmail(event)}
          disabled={thankYouEligible.length === 0 || thankYouUnsent.length === 0}
          className="whmi-btn-ghost !py-1.5 !px-2.5 text-[11.5px] flex items-center gap-1.5"
          style={{ opacity: (thankYouEligible.length === 0 || thankYouUnsent.length === 0) ? 0.5 : 1 }}
          title={thankYouUnsent.length === 0 ? "Everyone's already been emailed" : "Email everyone who attended a thank-you and reflection request"}
        >
          <Mail size={13} />Send Thank-You Email
        </button>
        {thankYouLastSentAt && <span className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>Sent {relativeTime(thankYouLastSentAt)}</span>}
      </div>
    ) : null
  );

  const avgQuality = avg(eventReflections.map(r => r.rating));
  const avgRelevance = avg(eventReflections.map(r => r.relevanceRating));
  const appropriatenessCounts = eventReflections.reduce((acc, r) => {
    if (r.appropriateness) acc[r.appropriateness] = (acc[r.appropriateness] || 0) + 1;
    return acc;
  }, {});

  const saveRecording = () => {
    onEdit({ ...event, recordingUrl: recordingUrl.trim() });
    setSavedNote(true);
    setTimeout(() => setSavedNote(false), 2000);
  };

  const StatButton = ({ value, label, onClick }) => (
    <button
      onClick={onClick}
      className="text-center whmi-row-hover rounded-lg py-2 px-1"
      style={{ border: "1px solid var(--border)" }}
      title="Click for more info"
    >
      <div className="disp text-[18px] font-extrabold flex items-center justify-center gap-1">{value}</div>
      <div className="text-[10.5px] flex items-center justify-center gap-1" style={{ color: "var(--text-faint)" }}>
        {label}<Info size={11} />
      </div>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.5)" }} onClick={onClose}>
      <div className="whmi-card w-full max-w-2xl max-h-[85vh] overflow-y-auto whmi-scroll whmi-fade-in" onClick={e => e.stopPropagation()}>
        {seriesSiblings.length > 1 && (
          <div className="flex gap-1 px-4 pt-3 pb-1 overflow-x-auto whmi-scroll" style={{ borderBottom: "1px solid var(--border)" }}>
            {seriesSiblings.map(sib => (
              <button
                key={sib.id} onClick={() => sib.id !== event.id && onSwitchEvent?.(sib)}
                className="px-3 py-1.5 rounded-lg text-[11.5px] font-semibold whitespace-nowrap shrink-0 whmi-row-hover transition"
                style={sib.id === event.id ? { background: "var(--accent-primary)", color: "white" } : { color: "var(--text-dim)" }}
                title={sib.title}
              >
                {fmtDate(sib.date)}
              </button>
            ))}
          </div>
        )}
        <div className="min-h-[92px] relative flex items-end p-5" style={{ background: "var(--accent-primary)" }}>
          <div className="absolute top-3 right-3 flex items-center gap-2">
            {canManage && (
              <button onClick={() => setEditing(true)} className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,.25)" }} title="Edit event">
                <Pencil size={13} color="white" />
              </button>
            )}
            {canManage && onDuplicate && (
              <button onClick={onDuplicate} className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,.25)" }} title="Duplicate event">
                <Copy size={13} color="white" />
              </button>
            )}
            {canManage && onRequestDelete && (
              <button onClick={() => onRequestDelete(event)} className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,.25)" }} title="Delete event">
                <Trash2 size={13} color="white" />
              </button>
            )}
            <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,.25)" }}>
              <X size={15} color="white" />
            </button>
          </div>
          <div className="min-w-0 pr-8">
            <span className="text-white/80 text-[11px] font-semibold uppercase tracking-wide">{event.topic}</span>
            <h2 className="disp text-white text-[19px] font-extrabold leading-tight break-words">{event.title}</h2>
          </div>
        </div>

        {bannerUrl && (
          <div className="w-full h-40 overflow-hidden" style={{ borderBottom: "1px solid var(--border)" }}>
            <img
              src={bannerUrl} alt="" className="w-full h-full object-cover"
              style={{
                objectPosition: `${event.bannerFocalX ?? 50}% ${event.bannerFocalY ?? 50}%`,
                transform: `scale(${event.bannerZoom ?? 1})`, transformOrigin: `${event.bannerFocalX ?? 50}% ${event.bannerFocalY ?? 50}%`,
              }}
            />
          </div>
        )}

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status="Completed" />
            {event.mode && <ModeBadge mode={event.mode} />}
          </div>

          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <div className="flex items-center gap-2"><Calendar size={14} style={{ color: "var(--text-faint)" }} className="shrink-0" /><span className="break-words">{fmtDate(event.date)}</span></div>
            <div className="flex items-center gap-2"><UserCircle2 size={14} style={{ color: "var(--text-faint)" }} className="shrink-0" /><span className="break-words">{event.presenter}</span></div>
          </div>

          {canManage && (
            <div className="whmi-card p-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatButton value={event.capacity == null ? attended : `${attended}/${event.capacity}`} label="Attendees" onClick={() => setTab("attendance")} />
              <StatButton value={noShow} label="No-show" onClick={() => setTab("attendance")} />
              <StatButton
                value={event.feedback != null ? <><Star size={14} fill="#F59E0B" color="#F59E0B" />{event.feedback}</> : "—"}
                label="Avg Feedback" onClick={() => setTab("feedback")}
              />
              <StatButton value={`${sentCerts.length}/${eventCertificates.length}`} label="Certificates Sent" onClick={() => setTab("certificates")} />
            </div>
          )}

          <div className="flex gap-1 border-b overflow-x-auto whmi-scroll" style={{ borderColor: "var(--border)" }}>
            {visibleTabs.map(t => (
              <button key={t} onClick={() => setTab(t)} className="px-3 py-2 text-[12.5px] font-semibold capitalize whitespace-nowrap" style={{ color: tab === t ? "var(--text)" : "var(--text-faint)", borderBottom: tab === t ? "2px solid var(--accent-secondary)" : "2px solid transparent" }}>
                {t}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <div className="space-y-2 text-[12.5px]">
              {event.description && <p style={{ color: "var(--text-dim)" }}>{event.description}</p>}
              {(event.campus || event.location) && (
                <div>
                  <span className="font-semibold">Location:</span>{" "}
                  <span style={{ color: "var(--text-dim)" }}>
                    {event.campus && <strong style={{ color: "var(--text)" }}>{event.campus}</strong>}
                    {event.campus && eventLocationSuffix(event) ? " - " : ""}
                    {eventLocationSuffix(event)}
                  </span>
                </div>
              )}
              {!event.description && !event.campus && !event.location && <p style={{ color: "var(--text-faint)" }}>No additional details recorded for this event.</p>}
            </div>
          )}

          {tab === "attendance" && (
            <div className="space-y-3">
              <RegistrationsPanel
                event={event} registrations={eventRegistrations} canManage
                onDelete={onDeleteRegistration} onUpdate={onUpdateRegistration} onUpdateAttendanceStatus={onUpdateAttendanceStatus}
                dismissedPairs={dismissedRegistrationPairs} onMerge={onMergeRegistrations} onDismissPair={onDismissRegistrationPair}
              />
              <SendThankYouControl />
            </div>
          )}

          {tab === "files" && (
            viewerHasFileAccess ? (
              <EventFilesPanel eventId={event.id} uploadedBy={session?.id} onFilesChange={onFilesChange} readOnly={!canManage} />
            ) : (
              <div className="whmi-card p-4 flex items-center gap-2 text-[12.5px]" style={{ color: "var(--text-faint)" }}>
                <Lock size={14} className="shrink-0" />Files are only available to attendees of this event.
              </div>
            )
          )}

          {tab === "recording" && (
            viewerHasFileAccess ? (
              <div className="space-y-2">
                {canManage && (
                  <>
                    <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Recording Link</label>
                    <div className="flex gap-2">
                      <input value={recordingUrl} onChange={e => setRecordingUrl(e.target.value)} placeholder="https://teams.microsoft.com/..." className="whmi-input flex-1 px-2.5 py-2" />
                      <button onClick={saveRecording} className="whmi-btn-primary flex items-center gap-1.5 shrink-0"><Save size={13} />Save</button>
                    </div>
                    {savedNote && <p className="text-[11px]" style={{ color: "var(--accent-success)" }}>Saved.</p>}
                  </>
                )}
                {event.recordingUrl ? (
                  <a href={event.recordingUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[12.5px] font-semibold mt-1" style={{ color: "var(--accent-secondary)" }}>
                    <Video size={14} />Open recording
                  </a>
                ) : !canManage && (
                  <div className="whmi-card p-4 text-[12.5px]" style={{ color: "var(--text-faint)" }}>No recording has been added for this event.</div>
                )}
              </div>
            ) : (
              <div className="whmi-card p-4 flex items-center gap-2 text-[12.5px]" style={{ color: "var(--text-faint)" }}>
                <Lock size={14} className="shrink-0" />The recording is only available to attendees of this event.
              </div>
            )
          )}

          {tab === "feedback" && (
            <div className="space-y-3">
              {eventReflections.length === 0 ? (
                <div className="whmi-card p-4 text-[12.5px] text-center" style={{ color: "var(--text-faint)" }}>No feedback recorded yet.</div>
              ) : (
                <div className="whmi-card p-3 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="disp text-[15px] font-extrabold">{avgQuality != null ? `${avgQuality}/10` : "—"}</div>
                    <div className="text-[10px]" style={{ color: "var(--text-faint)" }}>Avg Quality</div>
                  </div>
                  <div>
                    <div className="disp text-[15px] font-extrabold">{avgRelevance != null ? `${avgRelevance}/10` : "—"}</div>
                    <div className="text-[10px]" style={{ color: "var(--text-faint)" }}>Avg Relevance</div>
                  </div>
                  <div>
                    <div className="text-[11px] leading-tight">
                      {Object.keys(appropriatenessCounts).length === 0 ? "—" : Object.entries(appropriatenessCounts).map(([k, v]) => <div key={k}>{k}: {v}</div>)}
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: "var(--text-faint)" }}>Appropriateness</div>
                  </div>
                </div>
              )}
              <SendThankYouControl />
            </div>
          )}

          {tab === "reflections" && (
            <div className="space-y-4">
              <ReflectionsPanel
                event={event} reflections={eventReflections} canManage
                dismissedPairs={dismissedReflectionPairs} onDelete={onDeleteReflection}
                onMerge={onMergeReflections} onDismissPair={onDismissReflectionPair}
              />
              <SendThankYouControl />

              <div>
                <div className="text-[10.5px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-faint)" }}>Awaiting Reflection ({awaitingReflection.length})</div>
                <p className="text-[11px] mb-1.5" style={{ color: "var(--text-faint)" }}>Registrants who haven't submitted a reflection yet; no certificate has been generated for them.</p>
                {awaitingReflection.length === 0 && <div className="text-[12px] pb-2" style={{ color: "var(--text-faint)" }}>Everyone's reflected.</div>}
                <div className="space-y-1.5">
                  {awaitingReflection.map(r => (
                    <div key={r.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg flex-wrap" style={{ background: "var(--surface-2)" }}>
                      <div className="min-w-0">
                        <div className="text-[12.5px] font-semibold truncate">{r.name}</div>
                        <div className="text-[11px] truncate" style={{ color: "var(--text-faint)" }}>{r.email}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {onSendReflectionReminder && (
                          <div className="flex flex-col items-end gap-0.5">
                            <button
                              onClick={() => onSendReflectionReminder(r, event)}
                              className="!py-1 !px-2 text-[11px] flex items-center gap-1 rounded-lg transition"
                              style={r.reflectionEmailSentAt
                                ? { color: "var(--text-faint)", border: "1px solid var(--border)" }
                                : { color: "white", background: "var(--accent-secondary)" }}
                              title="Email a follow-up reminder"
                            >
                              {r.reflectionEmailSentAt ? <MailCheck size={12} /> : <Mail size={12} />}Follow Up
                            </button>
                            {r.reflectionEmailSentAt && (
                              <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>Followed up {relativeTime(r.reflectionEmailSentAt)}</span>
                            )}
                          </div>
                        )}
                        {onCreateCertificateFor && event.certificatesEnabled !== false && (
                          <button onClick={() => onCreateCertificateFor(r, event)} className="whmi-btn-ghost !py-1 !px-2 text-[11px] flex items-center gap-1" title="Create a certificate for them regardless of reflection status">
                            <Award size={12} />Certify Anyway
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "certificates" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <SendThankYouControl />
                <select value={certSortBy} onChange={e => setCertSortBy(e.target.value)} className="whmi-input px-2 py-1.5 text-[11.5px]">
                  {CERT_SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <div className="text-[10.5px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-faint)" }}>Sent ({sentCerts.length})</div>
                {sentCerts.length === 0 && <div className="text-[12px] pb-2" style={{ color: "var(--text-faint)" }}>None yet.</div>}
                <div className="space-y-1.5">
                  {sortCerts(sentCerts, certSortBy).map(c => (
                    <div key={c.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg" style={{ background: "var(--surface-2)" }}>
                      <div className="min-w-0">
                        <div className="text-[12.5px] font-semibold truncate">{c.staff}</div>
                        <div className="text-[11px] truncate" style={{ color: "var(--text-faint)" }}>{c.recipientEmail}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={c.status} />
                        {c.pdfUrl && <a href={c.pdfUrl} target="_blank" rel="noreferrer" className="whmi-btn-ghost !p-2" title="Download certificate"><Download size={13} /></a>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10.5px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-faint)" }}>Awaiting Approval ({awaitingCerts.length})</div>
                {awaitingCerts.length === 0 && <div className="text-[12px] pb-2" style={{ color: "var(--text-faint)" }}>None pending.</div>}
                <div className="space-y-1.5">
                  {sortCerts(awaitingCerts, certSortBy).map(c => (
                    <div key={c.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg" style={{ background: "var(--surface-2)" }}>
                      <div className="min-w-0">
                        <div className="text-[12.5px] font-semibold truncate">{c.staff}</div>
                        <div className="text-[11px] truncate" style={{ color: "var(--text-faint)" }}>{c.recipientEmail}</div>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "email" && (
            <div className="space-y-3">
              <div className="whmi-card p-3.5">
                <div className="font-semibold text-[13px] mb-0.5">Thank-you &amp; feedback request</div>
                <p className="text-[11.5px] mb-3" style={{ color: "var(--text-faint)" }}>
                  Sent to everyone who attended (or is still marked Registered), asking for their CPD reflection. Skips anyone already emailed — automatically 25-40 minutes after the event ends, or manually here.
                </p>
                <SendThankYouControl />
              </div>
              <div className="whmi-card p-3.5">
                <div className="font-semibold text-[13px] mb-0.5">Reflection follow-up</div>
                <p className="text-[11.5px] mb-3" style={{ color: "var(--text-faint)" }}>
                  A second nudge to anyone with an outstanding reflection — the same email as the "Follow Up" button on the Certificates tab, just sent to everyone at once.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSendAllReflectionReminders?.(awaitingReflection, event)}
                    disabled={!onSendAllReflectionReminders || awaitingReflection.length === 0}
                    className="whmi-btn-ghost !py-1.5 !px-2.5 text-[11.5px] flex items-center gap-1.5"
                    style={{ opacity: awaitingReflection.length === 0 ? 0.5 : 1 }}
                    title={awaitingReflection.length === 0 ? "No outstanding reflections" : "Email everyone with an outstanding reflection"}
                  >
                    <Mail size={13} />Send Follow-Up to All ({awaitingReflection.length})
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
