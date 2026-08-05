import { CheckCircle2, Calendar, Clock, MapPin } from "lucide-react";
import AddToCalendarMenu from "./AddToCalendarMenu";
import { fmtDate, fmtTimeRange12h, eventLocationSuffix } from "../lib/helpers";

export default function RegistrationSuccessCard({ event, onClose }) {
  return (
    <div className="whmi-card p-5 text-center space-y-3">
      <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(156,203,59,.15)" }}>
        <CheckCircle2 size={32} style={{ color: "var(--accent-success)" }} />
      </div>
      <div>
        <div className="font-extrabold text-[15px]">You're registered!</div>
        <div className="text-[12.5px]" style={{ color: "var(--text-faint)" }}>We've noted your details for this event.</div>
      </div>
      <div className="whmi-card p-3 text-left space-y-1.5" style={{ background: "var(--surface-2)" }}>
        <div className="font-bold text-[13.5px] break-words">{event.title}</div>
        <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--text-dim)" }}><Calendar size={12} className="shrink-0" />{fmtDate(event.date)}</div>
        <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--text-dim)" }}><Clock size={12} className="shrink-0" />{fmtTimeRange12h(event.start, event.end)}</div>
        {(event.campus || event.location) && (
          <div className="flex items-start gap-1.5 text-[12px]" style={{ color: "var(--text-dim)" }}>
            <MapPin size={12} className="shrink-0 mt-0.5" />
            <span>{event.campus && <strong>{event.campus}</strong>}{event.campus && eventLocationSuffix(event) ? " - " : ""}{eventLocationSuffix(event)}</span>
          </div>
        )}
      </div>
      <AddToCalendarMenu event={event} />
      {onClose && <button onClick={onClose} className="whmi-btn-primary w-full mt-1">Done</button>}
    </div>
  );
}
