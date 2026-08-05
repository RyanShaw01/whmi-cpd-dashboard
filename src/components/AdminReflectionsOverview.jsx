import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Mail, Send, Users, UserX, BarChart3 } from "lucide-react";
import { fmtDate, relativeTime } from "../lib/helpers";
import { whToDisplaySections } from "../pages/Reflection";

function buildPeople({ registrations, previousEvents, reflections, users }) {
  const eventById = new Map(previousEvents.map(e => [e.id, e]));
  const staffEmails = new Set(users.map(u => (u.email || "").toLowerCase()).filter(Boolean));
  const people = new Map();

  for (const reg of registrations) {
    const event = eventById.get(reg.eventId);
    if (!event || !reg.email) continue;
    const key = reg.email.toLowerCase();
    if (!people.has(key)) {
      people.set(key, { email: reg.email, name: reg.name, isStaff: staffEmails.has(key), rows: [] });
    }
    const person = people.get(key);
    const reflection = reflections.find(r => r.eventId === event.id && (r.email || "").toLowerCase() === key);
    person.rows.push({ reg, event, reflection });
  }

  for (const person of people.values()) {
    person.rows.sort((a, b) => (b.event.date || "").localeCompare(a.event.date || ""));
    person.submittedCount = person.rows.filter(r => r.reflection).length;
    person.outstandingCount = person.rows.filter(r => !r.reflection).length;
    person.emailsSentCount = person.rows.filter(r => r.reg.reflectionEmailSentAt).length;
  }

  return [...people.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function PersonRow({ person, onResend, onSendReport, sendingReport }) {
  const [open, setOpen] = useState(false);
  const initials = person.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const sendReport = () => {
    const entries = person.rows
      .filter(r => r.reflection)
      .map(r => ({ activityName: r.event.title, activityDate: r.event.date, sections: whToDisplaySections(r.reflection) }));
    if (entries.length === 0) return;
    onSendReport({ email: person.email, name: person.name, entries });
  };

  return (
    <div className="whmi-card overflow-hidden">
      <button onClick={() => setOpen(x => !x)} className="w-full flex items-center gap-3 p-3 text-left">
        {open ? <ChevronDown size={14} style={{ color: "var(--text-faint)" }} className="shrink-0" /> : <ChevronRight size={14} style={{ color: "var(--text-faint)" }} className="shrink-0" />}
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0" style={{ background: "var(--accent-secondary)" }}>{initials}</div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-[13px] truncate">{person.name}</div>
          <div className="text-[11px] truncate" style={{ color: "var(--text-faint)" }}>{person.email}</div>
        </div>
        <div className="hidden sm:flex items-center gap-4 shrink-0 text-[11.5px]" style={{ color: "var(--text-dim)" }}>
          <div className="text-center"><div className="font-bold text-[13.5px]" style={{ color: "var(--accent-success)" }}>{person.submittedCount}</div>submitted</div>
          <div className="text-center"><div className="font-bold text-[13.5px]">{person.emailsSentCount}</div>emailed</div>
          <div className="text-center"><div className="font-bold text-[13.5px]" style={{ color: person.outstandingCount > 0 ? "#D9534F" : "var(--text-dim)" }}>{person.outstandingCount}</div>outstanding</div>
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex justify-end pt-2">
            <button onClick={sendReport} disabled={sendingReport || person.submittedCount === 0} className="whmi-btn-ghost !py-1 !px-2 text-[11px] flex items-center gap-1">
              <Send size={12} />Send all reflections as one report
            </button>
          </div>
          {person.rows.map(({ reg, event, reflection }) => (
            <div key={reg.id} className="p-2.5 rounded-lg" style={{ background: "var(--surface-2)" }}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="min-w-0">
                  <div className="font-semibold text-[12.5px] truncate">{event.title}</div>
                  <div className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>{fmtDate(event.date)}</div>
                </div>
                {reflection ? (
                  <span className="whmi-badge shrink-0" style={{ background: "rgba(156,203,59,.15)", color: "#7CA82F" }}>Submitted</span>
                ) : (
                  <span className="whmi-badge shrink-0" style={{ background: "rgba(217,83,79,.12)", color: "#D9534F" }}>Outstanding</span>
                )}
              </div>
              {reflection ? (
                <div className="mt-2 space-y-1.5 text-[11.5px]">
                  {whToDisplaySections(reflection).map((s, i) => (
                    <div key={i}>
                      {s.items.map((item, j) => (
                        <div key={j} className="mb-1">
                          {item.question && <div className="font-medium" style={{ color: "var(--text-faint)" }}>{item.question}</div>}
                          <div style={{ color: "var(--text-dim)" }}>{item.answer}</div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-[10.5px] flex items-center gap-1" style={{ color: "var(--text-faint)" }}>
                    <Mail size={11} />
                    {reg.reflectionEmailSentAt ? `Reminder sent ${relativeTime(reg.reflectionEmailSentAt)}` : "No reminder sent yet"}
                  </div>
                  <button onClick={() => onResend(reg, event)} className="whmi-btn-ghost !py-1 !px-2 text-[11px] flex items-center gap-1">
                    <Mail size={11} />{reg.reflectionEmailSentAt ? "Resend" : "Send"} Reminder
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminReflectionsOverview({ registrations = [], previousEvents = [], reflections = [], users = [], onResend, onSendReport }) {
  const [sendingReport, setSendingReport] = useState(false);

  const people = useMemo(
    () => buildPeople({ registrations, previousEvents, reflections, users }),
    [registrations, previousEvents, reflections, users]
  );
  const staff = people.filter(p => p.isStaff);
  const externals = people.filter(p => !p.isStaff);

  const totals = useMemo(() => people.reduce((acc, p) => ({
    submitted: acc.submitted + p.submittedCount,
    emailed: acc.emailed + p.emailsSentCount,
    outstanding: acc.outstanding + p.outstandingCount,
  }), { submitted: 0, emailed: 0, outstanding: 0 }), [people]);

  const sendReport = async (payload) => {
    setSendingReport(true);
    await onSendReport?.(payload);
    setSendingReport(false);
  };

  return (
    <div className="space-y-5">
      <div className="whmi-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={15} style={{ color: "var(--accent-primary)" }} /><div className="font-semibold text-[13px]">Quick Stats</div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="whmi-card p-3" style={{ background: "var(--surface-2)" }}>
            <div className="font-extrabold text-[20px]">{people.length}</div>
            <div className="text-[11px]" style={{ color: "var(--text-faint)" }}>People tracked</div>
          </div>
          <div className="whmi-card p-3" style={{ background: "var(--surface-2)" }}>
            <div className="font-extrabold text-[20px]" style={{ color: "var(--accent-success)" }}>{totals.submitted}</div>
            <div className="text-[11px]" style={{ color: "var(--text-faint)" }}>Reflections submitted</div>
          </div>
          <div className="whmi-card p-3" style={{ background: "var(--surface-2)" }}>
            <div className="font-extrabold text-[20px]">{totals.emailed}</div>
            <div className="text-[11px]" style={{ color: "var(--text-faint)" }}>Reminder emails sent</div>
          </div>
          <div className="whmi-card p-3" style={{ background: "var(--surface-2)" }}>
            <div className="font-extrabold text-[20px]" style={{ color: totals.outstanding > 0 ? "#D9534F" : "var(--text-dim)" }}>{totals.outstanding}</div>
            <div className="text-[11px]" style={{ color: "var(--text-faint)" }}>Outstanding reflections</div>
          </div>
        </div>
      </div>

      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5" style={{ color: "var(--text-faint)" }}><Users size={12} />Staff ({staff.length})</div>
        <div className="space-y-2">
          {staff.map(p => <PersonRow key={p.email} person={p} onResend={onResend} onSendReport={sendReport} sendingReport={sendingReport} />)}
          {staff.length === 0 && <div className="whmi-card p-4 text-[12.5px] text-center" style={{ color: "var(--text-faint)" }}>No staff registrations for past events yet.</div>}
        </div>
      </div>

      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5" style={{ color: "var(--text-faint)" }}><UserX size={12} />Externals ({externals.length})</div>
        <div className="space-y-2">
          {externals.map(p => <PersonRow key={p.email} person={p} onResend={onResend} onSendReport={sendReport} sendingReport={sendingReport} />)}
          {externals.length === 0 && <div className="whmi-card p-4 text-[12.5px] text-center" style={{ color: "var(--text-faint)" }}>No external registrations for past events yet.</div>}
        </div>
      </div>
    </div>
  );
}
