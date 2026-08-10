import { useState } from "react";
import { CalendarPlus, ChevronDown, X } from "lucide-react";
import { icsDownloadUrl, googleCalendarUrl, outlookWebUrl } from "../lib/calendar";

// Renders as a centred popup with a blurred backdrop rather than an absolute-positioned
// dropdown, since the dropdown used to render below whatever card this sits in and could get
// clipped or pushed off-screen depending on scroll position (most visibly on the public
// registration success card).
export default function AddToCalendarMenu({ event, className, label = "Save to Calendar" }) {
  const [open, setOpen] = useState(false);

  const downloadIcs = () => {
    const link = document.createElement("a");
    link.href = icsDownloadUrl(event);
    link.download = `${event.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;
    link.click();
    setOpen(false);
  };

  return (
    <div className={className || ""}>
      <button type="button" onClick={() => setOpen(true)} className="whmi-btn-ghost w-full flex items-center justify-center gap-1.5">
        <CalendarPlus size={14} />{label}<ChevronDown size={12} style={{ opacity: 0.6 }} />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,.5)", backdropFilter: "blur(3px)" }}
          onClick={() => setOpen(false)}
        >
          <div className="whmi-card w-full max-w-xs p-1.5 whmi-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-2.5 py-2">
              <span className="text-[12px] font-bold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Add to Calendar</span>
              <button type="button" onClick={() => setOpen(false)} className="whmi-btn-ghost !p-1.5"><X size={13} /></button>
            </div>
            <a href={googleCalendarUrl(event)} target="_blank" rel="noreferrer" onClick={() => setOpen(false)} className="block w-full text-left px-2.5 py-2 rounded-lg text-[12.5px] font-semibold whmi-row-hover">
              Google Calendar
            </a>
            <a href={outlookWebUrl(event)} target="_blank" rel="noreferrer" onClick={() => setOpen(false)} className="block w-full text-left px-2.5 py-2 rounded-lg text-[12.5px] font-semibold whmi-row-hover">
              Outlook
            </a>
            <button type="button" onClick={downloadIcs} className="block w-full text-left px-2.5 py-2 rounded-lg text-[12.5px] font-semibold whmi-row-hover">
              Apple / iOS Calendar (.ics)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
