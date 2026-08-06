import { useState, useRef, useEffect } from "react";
import { Bell, X, CheckCheck } from "lucide-react";

export default function NotificationBell({ groups, redDotsEnabled, onNavigate, onAcknowledgeGroup, onAcknowledgeAll }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const hasUnread = groups.length > 0;

  return (
    <div className="relative" ref={rootRef}>
      <button onClick={() => setOpen(o => !o)} className="whmi-btn-ghost !p-2 relative" title="Notifications">
        <Bell size={15} />
        {hasUnread && redDotsEnabled && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: "#D9534F" }} />
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-11 whmi-card w-80 max-h-96 overflow-y-auto whmi-scroll whmi-fade-in z-50 p-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="text-[12px] font-bold">Notifications</div>
            {hasUnread && (
              <button onClick={onAcknowledgeAll} className="text-[11px] font-semibold flex items-center gap-1" style={{ color: "var(--accent-primary)" }}>
                <CheckCheck size={12} />Acknowledge all
              </button>
            )}
          </div>

          {!hasUnread && (
            <p className="text-[12px] px-1 py-3" style={{ color: "var(--text-faint)" }}>You're all caught up.</p>
          )}

          <div className="space-y-1.5">
            {groups.map(g => {
              // "what and who" detail for the hover tooltip — a couple of the underlying
              // items' names/titles, so the group summary line has something to hover for.
              const detail = (g.items || [])
                .slice(0, 5)
                .map(it => it.name || it.staff || it.title || it.email)
                .filter(Boolean)
                .join(", ");
              return (
                <div key={g.id} className="flex items-center gap-2 p-1 rounded-lg" style={{ background: "var(--surface-2)" }}>
                  <button
                    onClick={() => { onNavigate(g); setOpen(false); }}
                    className="flex-1 text-left text-[12.5px] font-semibold whmi-row-hover transition rounded-lg p-1.5"
                    title={detail || undefined}
                  >
                    {g.label}
                  </button>
                  <button onClick={() => onAcknowledgeGroup(g)} className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 whmi-row-hover transition" title="Acknowledge" style={{ color: "var(--text-faint)" }}>
                    <X size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
