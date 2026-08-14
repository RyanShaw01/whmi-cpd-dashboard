import { useState } from "react";
import { Mail, ChevronDown, AlertCircle } from "lucide-react";
import { relativeTime } from "../lib/helpers";

const TEMPLATE_LABELS = {
  registration_confirmation: "Registration Confirmation",
  post_event_thank_you: "Thank You / Reflection Request",
  reflection_reminder: "Reflection Reminder",
  certificate: "CPD Certificate",
  presenter_thank_you: "Presenter Thank You",
  reflection_copy: "Reflection Copy",
  reflections_report: "Reflections Report",
};
function templateLabel(key) {
  if (key?.startsWith("test_")) return `Test: ${TEMPLATE_LABELS[key.slice(5)] || key.slice(5)}`;
  return TEMPLATE_LABELS[key] || key;
}

// Per-recipient send log for one event - who was emailed what, and when. `log` is fetched once by
// the parent modal (see EventDetailModal/PreviousEventDetailModal) and shared with the individual
// send buttons on each row, rather than this panel fetching its own separate copy.
export default function EmailLogPanel({ log }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="whmi-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 p-3 text-left whmi-row-hover transition"
      >
        <span className="flex items-center gap-2 text-[12.5px] font-semibold">
          <Mail size={14} style={{ color: "var(--text-faint)" }} />Email Log
        </span>
        <ChevronDown size={14} style={{ color: "var(--text-faint)", transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-1.5">
          {log == null && <div className="text-[12px] py-1" style={{ color: "var(--text-faint)" }}>Loading...</div>}
          {log?.length === 0 && <div className="text-[12px] py-1" style={{ color: "var(--text-faint)" }}>No emails sent for this event yet.</div>}
          {log?.map(entry => (
            <div key={entry.id} className="flex items-center justify-between gap-2 text-[11.5px] px-2 py-1.5 rounded-md" style={{ background: "var(--surface-2)" }}>
              <div className="min-w-0">
                <div className="font-semibold truncate">{entry.recipientName || entry.recipientEmail}</div>
                <div className="truncate" style={{ color: "var(--text-faint)" }}>{entry.recipientEmail} · {templateLabel(entry.templateKey)}</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {entry.status === "failed" && <AlertCircle size={12} style={{ color: "#D9534F" }} title="Failed to send" />}
                <span style={{ color: entry.status === "failed" ? "#D9534F" : "var(--text-faint)" }}>{relativeTime(entry.sentAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
