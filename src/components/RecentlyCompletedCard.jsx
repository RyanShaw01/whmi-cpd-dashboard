import { Link } from "react-router-dom";
import { CheckCircle2, MessageSquareText } from "lucide-react";
import { fmtDate, eventBannerUrl } from "../lib/helpers";

// Shown in place of the normal big card for the 24h grace window between an event ending and
// complete-finished-events actually moving it to Previous Events (see isRecentlyCompleted in
// helpers.js) - stripped down to just name/date, a big green "Completed" banner, and (only for
// the person who was actually registered) a button straight into their reflection form.
export default function RecentlyCompletedCard({ event, files, openEvent, registered, accentHex = "var(--accent-primary)" }) {
  const bannerUrl = eventBannerUrl(files, event.id);
  return (
    <div className="w-full flex flex-col rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      <button onClick={() => openEvent(event)} className="relative h-28 w-full overflow-hidden text-left" style={!bannerUrl ? { background: accentHex } : undefined}>
        {bannerUrl && (
          <img src={bannerUrl} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" style={{ filter: "blur(2px) brightness(0.7)" }} />
        )}
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(20,70,30,.4)" }}>
          <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-full font-extrabold text-[13px] uppercase tracking-wide shadow" style={{ background: "var(--accent-success)", color: "white" }}>
            <CheckCircle2 size={16} />Completed
          </span>
        </div>
      </button>
      <div className="p-4">
        <div className="font-semibold text-[14.5px] break-words">{event.title}</div>
        <div className="text-[11.5px] mt-0.5" style={{ color: "var(--text-faint)" }}>{fmtDate(event.date)}</div>
        {registered && (
          <Link to={`/event/${event.id}/reflect`} className="whmi-btn-primary w-full mt-3 flex items-center justify-center gap-1.5 text-[12.5px]">
            <MessageSquareText size={14} />Leave Feedback & Get Certificate
          </Link>
        )}
      </div>
    </div>
  );
}
