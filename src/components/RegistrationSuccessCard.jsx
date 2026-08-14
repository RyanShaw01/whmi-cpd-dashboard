import { CheckCircle2 } from "lucide-react";
import AddToCalendarMenu from "./AddToCalendarMenu";

// Deliberately just the confirmation itself - no repeated event title/date/time/location, since
// the registrant already saw all of that on the form they just submitted.
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
      <AddToCalendarMenu event={event} />
      {onClose && <button onClick={onClose} className="whmi-btn-primary w-full mt-1">Done</button>}
    </div>
  );
}
