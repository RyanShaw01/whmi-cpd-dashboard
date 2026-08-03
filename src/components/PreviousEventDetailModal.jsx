import { useState } from "react";
import { X, Calendar, UserCircle2, Star, Video, Save, Download, Info } from "lucide-react";
import StatusBadge from "./StatusBadge";
import ModeBadge from "./ModeBadge";
import EventFilesPanel from "./EventFilesPanel";
import ReflectionsPanel from "./ReflectionsPanel";
import RegistrationsPanel from "./RegistrationsPanel";
import { fmtDate } from "../lib/helpers";

const TABS = ["overview", "attendance", "files", "recording", "reflections", "certificates"];

function avg(nums) {
  const vals = nums.filter(n => n != null);
  if (vals.length === 0) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

export default function PreviousEventDetailModal({
  event, onClose, registrations, certificates, reflections, session, onEdit,
  dismissedReflectionPairs, onMergeReflections, onDismissReflectionPair, onDeleteReflection,
  onDeleteRegistration, onUpdateRegistration, onUpdateAttendanceStatus,
  dismissedRegistrationPairs, onMergeRegistrations, onDismissRegistrationPair,
}) {
  const [tab, setTab] = useState("overview");
  const [recordingUrl, setRecordingUrl] = useState(event?.recordingUrl || "");
  const [savedNote, setSavedNote] = useState(false);
  if (!event) return null;

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
        <div className="min-h-[92px] relative flex items-end p-5" style={{ background: "var(--accent-primary)" }}>
          <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,.25)" }}>
            <X size={15} color="white" />
          </button>
          <div className="min-w-0 pr-8">
            <span className="text-white/80 text-[11px] font-semibold uppercase tracking-wide">{event.topic}</span>
            <h2 className="disp text-white text-[19px] font-extrabold leading-tight break-words">{event.title}</h2>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status="Completed" />
            {event.mode && <ModeBadge mode={event.mode} />}
          </div>

          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <div className="flex items-center gap-2"><Calendar size={14} style={{ color: "var(--text-faint)" }} className="shrink-0" /><span className="break-words">{fmtDate(event.date)}</span></div>
            <div className="flex items-center gap-2"><UserCircle2 size={14} style={{ color: "var(--text-faint)" }} className="shrink-0" /><span className="break-words">{event.presenter}</span></div>
          </div>

          <div className="whmi-card p-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatButton value={`${attended}/${event.capacity ?? "—"}`} label="Attended" onClick={() => setTab("attendance")} />
            <StatButton value={noShow} label="No-show" onClick={() => setTab("attendance")} />
            <StatButton
              value={event.feedback != null ? <><Star size={14} fill="#F59E0B" color="#F59E0B" />{event.feedback}</> : "—"}
              label="Avg Feedback" onClick={() => setTab("reflections")}
            />
            <StatButton value={`${sentCerts.length}/${eventCertificates.length}`} label="Certificates Sent" onClick={() => setTab("certificates")} />
          </div>

          <div className="flex gap-1 border-b overflow-x-auto whmi-scroll" style={{ borderColor: "var(--border)" }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} className="px-3 py-2 text-[12.5px] font-semibold capitalize whitespace-nowrap" style={{ color: tab === t ? "var(--text)" : "var(--text-faint)", borderBottom: tab === t ? "2px solid var(--accent-secondary)" : "2px solid transparent" }}>
                {t}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <div className="space-y-2 text-[12.5px]">
              {event.description && <p style={{ color: "var(--text-dim)" }}>{event.description}</p>}
              {event.location && <div><span className="font-semibold">Location:</span> <span style={{ color: "var(--text-dim)" }}>{event.location}</span></div>}
              {!event.description && !event.location && <p style={{ color: "var(--text-faint)" }}>No additional details recorded for this event.</p>}
            </div>
          )}

          {tab === "attendance" && (
            <RegistrationsPanel
              event={event} registrations={eventRegistrations} canManage
              onDelete={onDeleteRegistration} onUpdate={onUpdateRegistration} onUpdateAttendanceStatus={onUpdateAttendanceStatus}
              dismissedPairs={dismissedRegistrationPairs} onMerge={onMergeRegistrations} onDismissPair={onDismissRegistrationPair}
            />
          )}

          {tab === "files" && <EventFilesPanel eventId={event.id} uploadedBy={session?.id} />}

          {tab === "recording" && (
            <div className="space-y-2">
              <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Recording Link</label>
              <div className="flex gap-2">
                <input value={recordingUrl} onChange={e => setRecordingUrl(e.target.value)} placeholder="https://teams.microsoft.com/..." className="whmi-input flex-1 px-2.5 py-2" />
                <button onClick={saveRecording} className="whmi-btn-primary flex items-center gap-1.5 shrink-0"><Save size={13} />Save</button>
              </div>
              {savedNote && <p className="text-[11px]" style={{ color: "var(--accent-success)" }}>Saved.</p>}
              {event.recordingUrl && (
                <a href={event.recordingUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[12.5px] font-semibold mt-1" style={{ color: "var(--accent-secondary)" }}>
                  <Video size={14} />Open recording
                </a>
              )}
            </div>
          )}

          {tab === "reflections" && (
            <div className="space-y-3">
              {eventReflections.length > 0 && (
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
              <ReflectionsPanel
                event={event} reflections={eventReflections} canManage
                dismissedPairs={dismissedReflectionPairs} onDelete={onDeleteReflection}
                onMerge={onMergeReflections} onDismissPair={onDismissReflectionPair}
              />
            </div>
          )}

          {tab === "certificates" && (
            <div className="space-y-4">
              <div>
                <div className="text-[10.5px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-faint)" }}>Sent ({sentCerts.length})</div>
                {sentCerts.length === 0 && <div className="text-[12px] pb-2" style={{ color: "var(--text-faint)" }}>None yet.</div>}
                <div className="space-y-1.5">
                  {sentCerts.map(c => (
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
                  {awaitingCerts.map(c => (
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

              <div>
                <div className="text-[10.5px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-faint)" }}>Awaiting Reflection ({awaitingReflection.length})</div>
                <p className="text-[11px] mb-1.5" style={{ color: "var(--text-faint)" }}>Registrants who haven't submitted a reflection yet; no certificate has been generated for them.</p>
                {awaitingReflection.length === 0 && <div className="text-[12px] pb-2" style={{ color: "var(--text-faint)" }}>Everyone's reflected.</div>}
                <div className="space-y-1.5">
                  {awaitingReflection.map(r => (
                    <div key={r.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg" style={{ background: "var(--surface-2)" }}>
                      <div className="min-w-0">
                        <div className="text-[12.5px] font-semibold truncate">{r.name}</div>
                        <div className="text-[11px] truncate" style={{ color: "var(--text-faint)" }}>{r.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
