import { useState } from "react";
import { Link } from "react-router-dom";
import {
  X, Calendar, Clock, MapPin, UserCircle2, ArrowUpRight, Download,
  Eye, Send, AlertCircle, Link2, Trash2, Pencil, MessageSquareText,
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import ModeBadge from "./ModeBadge";
import EventQRCode from "./EventQRCode";
import InfoTooltip from "./InfoTooltip";
import EventForm from "./EventForm";
import RegistrationsPanel from "./RegistrationsPanel";
import ReflectionsPanel from "./ReflectionsPanel";
import { fmtDate, canJoinMeeting, hasEventEnded, fmtTimeRange12h, eventBannerUrl, splitPeopleList, eventCpdHours, eventLocationSuffix } from "../lib/helpers";
import { previewCertificateTemplate } from "../lib/db";

const STATUS_OPTIONS = ["Draft", "Awaiting Approval", "Registration Open", "Registration Closed", "Completed", "Archived"];

function exportAttendeesCsv(event, regs) {
  const headers = ["Name", "Email", "Profession", "Campus", "Attendance Type", "Status", "Dietary", "Accessibility", "Comments"];
  const rows = regs.map(r => [r.name, r.email, r.profession, r.campus, r.attendanceType, r.attendanceStatus, r.dietary, r.accessibility, r.comments]);
  const csv = [headers, ...rows]
    .map(row => row.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${event.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-attendees.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function EventDetailModal({
  event, onClose, registrations, canManage, onDelete, onStatusChange, onEdit, uploadedBy, session, cpdTypes, files, tags, onSaveTag, viewerUserType, onFilesChange,
  onUpdateBannerCrop, onRemoveBanner,
  onDeleteRegistration, onUpdateRegistration, onUpdateAttendanceStatus,
  dismissedRegistrationPairs, onMergeRegistrations, onDismissRegistrationPair,
  reflections, onDeleteReflection, dismissedReflectionPairs, onMergeReflections, onDismissReflectionPair,
}) {
  const [regTab, setRegTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [meetingUrlDraft, setMeetingUrlDraft] = useState("");
  const [previewingTemplate, setPreviewingTemplate] = useState(false);
  if (!event) return null;

  const previewTemplate = async () => {
    setPreviewingTemplate(true);
    const result = await previewCertificateTemplate({
      sessionName: event.title, date: event.date, cpdHours: eventCpdHours(event.start, event.end) || 1, cpdTypeId: event.cpdTypeId,
    });
    setPreviewingTemplate(false);
    if (!result.ok) { alert("Couldn't generate the preview. Please try again."); return; }
    window.open(URL.createObjectURL(result.blob), "_blank");
  };
  const joinable = event.meetingUrl && canJoinMeeting(event.date, event.start, event.end);
  const bannerUrl = eventBannerUrl(files, event.id);
  const eventRegistrations = (registrations || []).filter(r => r.eventId === event.id);
  const eventReflections = (reflections || []).filter(r => r.eventId === event.id);
  const myReflection = session ? eventReflections.find(r => r.email?.toLowerCase() === session.email.toLowerCase()) : null;
  const iRegistered = session ? eventRegistrations.some(r => r.userId === session.id) : false;
  const canLeaveFeedback = session && iRegistered && hasEventEnded(event.date, event.end) && !myReflection;

  if (editing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.5)" }} onClick={onClose}>
        <div className="whmi-card w-full max-w-lg max-h-[85vh] overflow-y-auto whmi-scroll whmi-fade-in" onClick={e => e.stopPropagation()}>
          <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="disp text-[16px] font-extrabold">Edit Event</h2>
            <button onClick={() => setEditing(false)} className="whmi-btn-ghost !p-2"><X size={14} /></button>
          </div>
          <div className="p-5">
            <EventForm
              event={event}
              onSave={(payload) => { onEdit(payload); setEditing(false); }}
              onCancel={() => setEditing(false)}
              uploadedBy={uploadedBy}
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

  const infoBody = (
    <div className="p-5 space-y-4 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {canManage && onStatusChange ? (
                <select
                  value={event.status}
                  onChange={e => onStatusChange(e.target.value)}
                  className="whmi-input px-2 py-1 text-[12px] font-semibold"
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <StatusBadge status={event.status} />
              )}
              <ModeBadge mode={event.mode} />
            </div>
            {canManage && (
              <div className="flex items-center gap-1.5">
                {onEdit && (
                  <button onClick={() => setEditing(true)} className="whmi-btn-ghost !p-2" title="Edit event">
                    <Pencil size={14} />
                  </button>
                )}
                {onDelete && (
                  <button onClick={onDelete} className="whmi-btn-ghost !p-2" title="Delete event" style={{ color: "#D9534F" }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <div className="flex items-center gap-2"><Calendar size={14} style={{ color: "var(--text-faint)" }} className="shrink-0" /><span className="break-words">{fmtDate(event.date)}</span></div>
            <div className="flex items-center gap-2"><Clock size={14} style={{ color: "var(--text-faint)" }} className="shrink-0" /><span className="break-words">{fmtTimeRange12h(event.start, event.end)}</span></div>
            <div className="flex items-center gap-2"><MapPin size={14} style={{ color: "var(--text-faint)" }} className="shrink-0" /><span className="break-words">
              {event.campus && <strong>{event.campus}</strong>}
              {event.campus && eventLocationSuffix(event) ? " - " : ""}
              {eventLocationSuffix(event)}
            </span></div>
            <div className="flex items-start gap-2"><UserCircle2 size={14} style={{ color: "var(--text-faint)" }} className="shrink-0 mt-0.5" />
              {(() => {
                const presenters = splitPeopleList(event.presenter);
                return presenters.length > 1 ? (
                  <ul className="break-words" style={{ paddingLeft: 14, listStyleType: "disc" }}>
                    {presenters.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                ) : <span className="break-words">{event.presenter}</span>;
              })()}
            </div>
          </div>

          {(event.description || event.organisers) && (
            <div className="whmi-card p-3 space-y-2 text-[12.5px]">
              {event.description && <p style={{ color: "var(--text-dim)" }}>{event.description}</p>}
              {event.organisers && (
                <div>
                  <span className="font-semibold">Organisers:</span>{" "}
                  {(() => {
                    const organisers = splitPeopleList(event.organisers);
                    return organisers.length > 1 ? (
                      <ul className="mt-1" style={{ paddingLeft: 14, listStyleType: "disc", color: "var(--text-dim)" }}>
                        {organisers.map((o, i) => <li key={i}>{o}</li>)}
                      </ul>
                    ) : <span style={{ color: "var(--text-dim)" }}>{event.organisers}</span>;
                  })()}
                </div>
              )}
              {event.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {event.tags.map(t => <span key={t} className="whmi-badge" style={{ background: "var(--surface-2)", color: "var(--text-dim)" }}>{t}</span>)}
                </div>
              )}
            </div>
          )}

          {event.meetingUrl && (
            joinable ? (
              <a href={event.meetingUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: "var(--accent-secondary)" }}>
                <Link2 size={14} />Join meeting here
              </a>
            ) : (
              <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--text-faint)" }}>
                <Link2 size={14} />Meeting link opens 20 minutes before the event starts
              </div>
            )
          )}

          <div className="flex gap-1 border-b overflow-x-auto whmi-scroll" style={{ borderColor: "var(--border)" }}>
            {[
              { id: "overview", label: "Overview" },
              { id: "registrations", label: "Registrations" },
              { id: "reflections", label: "Reflections" },
              { id: "certificates", label: "Certificates" },
              ...(canManage ? [{ id: "qr", label: "Links/QR Codes" }] : []),
            ].map(t => (
              <button key={t.id} onClick={() => setRegTab(t.id)} className="px-3 py-2 text-[12.5px] font-semibold whitespace-nowrap" style={{ color: regTab === t.id ? "var(--text)" : "var(--text-faint)", borderBottom: regTab === t.id ? "2px solid var(--accent-secondary)" : "2px solid transparent" }}>
                {t.label}
              </button>
            ))}
          </div>

          {regTab === "overview" && (
            <div className="space-y-3">
              {(canManage
                || (viewerUserType === "external" ? event.showRegCountExternal : event.capacity != null)) && (
                <div className="whmi-card p-3">
                  <div className="flex justify-between text-[12px] mb-1.5" style={{ color: "var(--text-dim)" }}>
                    <span>{event.capacity == null ? `Registered: ${event.registered}` : `Registered ${event.registered}/${event.capacity}`}</span>
                    {event.waitlist > 0 && <span>{event.waitlist} on waitlist</span>}
                  </div>
                  {event.capacity != null && (
                    <div className="h-2 rounded-full" style={{ background: "var(--surface-2)" }}>
                      <div className="h-2 rounded-full whmi-accent-bar" style={{ width: `${Math.min(100, (event.registered / event.capacity) * 100)}%` }} />
                    </div>
                  )}
                </div>
              )}
              {canLeaveFeedback && (
                <Link to={`/event/${event.id}/reflect`} className="whmi-btn-primary flex items-center justify-center gap-1.5 w-full"><MessageSquareText size={14} />Leave Feedback & Get Certificate</Link>
              )}
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/event/${event.id}`); if (canManage) setRegTab("qr"); }} className="whmi-btn-ghost flex items-center gap-1.5"><ArrowUpRight size={14} />Copy Registration Link</button>
                <button onClick={() => exportAttendeesCsv(event, eventRegistrations)} disabled={eventRegistrations.length === 0} className="whmi-btn-ghost flex items-center gap-1.5" style={{ opacity: eventRegistrations.length === 0 ? 0.5 : 1 }}><Download size={14} />Export Attendees</button>
              </div>
            </div>
          )}

          {regTab === "registrations" && (
            <RegistrationsPanel
              event={event} registrations={eventRegistrations} canManage={canManage}
              onDelete={onDeleteRegistration} onUpdate={onUpdateRegistration} onUpdateAttendanceStatus={onUpdateAttendanceStatus}
              dismissedPairs={dismissedRegistrationPairs} onMerge={onMergeRegistrations} onDismissPair={onDismissRegistrationPair}
            />
          )}

          {regTab === "reflections" && (
            <div className="space-y-3">
              {canManage && (
                <div className="max-w-[200px] mx-auto">
                  <EventQRCode event={event} path="/reflect" filenameSuffix="reflection-qr" />
                </div>
              )}
              <ReflectionsPanel
                event={event} reflections={eventReflections} canManage={canManage}
                dismissedPairs={dismissedReflectionPairs} onDelete={onDeleteReflection}
                onMerge={onMergeReflections} onDismissPair={onDismissReflectionPair}
              />
            </div>
          )}

          {regTab === "certificates" && (
            <div className="space-y-2 text-[12.5px]">
              <div className="flex items-center gap-2" style={{ color: "var(--text-dim)" }}>
                <AlertCircle size={14} className="shrink-0" />Certificate approval mode: <strong style={{ color: "var(--text)" }}>Manual approval</strong>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={previewTemplate} disabled={previewingTemplate} className="whmi-btn-ghost flex items-center gap-1.5"><Eye size={14} />{previewingTemplate ? "Generating…" : "Preview Template"}</button>
                <button className="whmi-btn-ghost flex items-center gap-1.5"><Send size={14} />Send Reflection Requests</button>
              </div>
            </div>
          )}

          {regTab === "qr" && canManage && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="font-semibold text-[13px]">Registration Link</span>
                  <InfoTooltip text="Scanning this code opens the public event page to register, no login required. Print it on posters, flyers, or event signage so people can sign up on the spot." />
                </div>
                <EventQRCode event={event} />
                <p className="text-[11.5px] text-center mt-3 max-w-xs" style={{ color: "var(--text-faint)" }}>
                  Scanning this code opens the public event page to register, no login required. Print it on posters or flyers.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="font-semibold text-[13px]">Online Event Link</span>
                  <InfoTooltip text="Scanning this code joins the online meeting directly. Share it only with confirmed attendees closer to the event, since it goes straight to the Teams/Zoom call rather than a registration page." />
                </div>
                <EventQRCode
                  event={event} url={event.meetingUrl} filenameSuffix="join-meeting"
                  disabled={!event.meetingUrl} disabledMessage="Add a Teams/Zoom meeting link to this event to generate a join code."
                />
                {!event.meetingUrl && onEdit && (
                  <div className="w-full max-w-[220px] flex gap-1.5 mt-3">
                    <input
                      value={meetingUrlDraft} onChange={e => setMeetingUrlDraft(e.target.value)}
                      placeholder="https://teams.microsoft.com/..." className="whmi-input flex-1 px-2 py-1.5 text-[11px]"
                    />
                    <button
                      onClick={() => { if (meetingUrlDraft.trim()) { onEdit({ ...event, meetingUrl: meetingUrlDraft.trim() }); setMeetingUrlDraft(""); } }}
                      className="whmi-btn-primary !px-2.5 text-[11px]"
                    >
                      Save
                    </button>
                  </div>
                )}
                <p className="text-[11.5px] text-center mt-3 max-w-xs" style={{ color: "var(--text-faint)" }}>
                  {event.meetingUrl ? "Scanning this code joins the online meeting directly." : "No meeting link added yet."}
                </p>
              </div>
            </div>
          )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.5)" }} onClick={onClose}>
      <div
        className={bannerUrl ? "whmi-card w-full max-w-3xl max-h-[85vh] overflow-y-auto whmi-scroll whmi-fade-in relative" : "whmi-card w-full max-w-2xl max-h-[85vh] overflow-y-auto whmi-scroll whmi-fade-in relative"}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(0,0,0,.4)" }}>
          <X size={15} color="white" />
        </button>
        {bannerUrl ? (
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr]">
            <div className="w-full h-56 md:h-full flex items-center justify-center overflow-hidden" style={{ background: "var(--surface-2)" }}>
              <img src={bannerUrl} alt="" className="max-w-full max-h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="px-5 pt-5">
                <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--accent-secondary)" }}>{event.topic}</span>
                <h2 className="disp text-[19px] font-extrabold leading-tight break-words">{event.title}</h2>
              </div>
              {infoBody}
            </div>
          </div>
        ) : (
          <>
            <div className="min-h-[92px] relative flex items-end p-5" style={{ background: "var(--accent-primary)" }}>
              <div className="min-w-0 pr-8">
                <span className="text-white/80 text-[11px] font-semibold uppercase tracking-wide">{event.topic}</span>
                <h2 className="disp text-white text-[19px] font-extrabold leading-tight break-words">{event.title}</h2>
              </div>
            </div>
            {infoBody}
          </>
        )}
      </div>
    </div>
  );
}
