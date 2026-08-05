import { useState, useRef, useEffect } from "react";
import { CalendarPlus, ChevronDown } from "lucide-react";
import { icsDownloadUrl, googleCalendarUrl, outlookWebUrl } from "../lib/calendar";

export default function AddToCalendarMenu({ event, className, label = "Save to Calendar" }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const downloadIcs = () => {
    const link = document.createElement("a");
    link.href = icsDownloadUrl(event);
    link.download = `${event.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;
    link.click();
    setOpen(false);
  };

  return (
    <div className={`relative ${className || ""}`} ref={rootRef}>
      <button type="button" onClick={() => setOpen(o => !o)} className="whmi-btn-ghost w-full flex items-center justify-center gap-1.5">
        <CalendarPlus size={14} />{label}<ChevronDown size={12} style={{ opacity: 0.6 }} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 whmi-card p-1.5 z-30 whmi-fade-in">
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
      )}
    </div>
  );
}
