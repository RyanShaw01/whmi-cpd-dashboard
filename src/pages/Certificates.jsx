import { useState, useEffect, useRef } from "react";
import { Award, CheckCircle2, Mail, Download, Trash2, Plus } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import { fmtDate } from "../lib/helpers";

export default function Certificates({ certificates, canManage, onRequestDelete, onApprove, highlightId, onCreateCertificate }) {
  const [tab, setTab] = useState("Awaiting Approval");
  const filtered = certificates.filter(c => c.status === tab);
  const highlightRef = useRef(null);

  useEffect(() => {
    if (highlightId) setTab("Awaiting Approval");
  }, [highlightId]);

  useEffect(() => {
    if (highlightId && highlightRef.current) highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightId, tab]);

  return (
    <div className="whmi-fade-in p-6 max-w-[1400px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="disp text-[22px] font-extrabold">Certificates</h1>
          <p className="text-[13px]" style={{ color: "var(--text-dim)" }}>Generated automatically once registration and reflection are confirmed.</p>
        </div>
        {canManage && onCreateCertificate && (
          <button onClick={onCreateCertificate} className="whmi-btn-primary flex items-center gap-1.5"><Plus size={15} />Create Certificate</button>
        )}
      </div>

      <div className="flex gap-2">
        {["Awaiting Approval", "Sent"].map(t => (
          <button key={t} onClick={() => setTab(t)} className="whmi-nav-btn" style={{ background: tab === t ? "var(--surface-2)" : "transparent", border: "1px solid " + (tab === t ? "var(--border)" : "transparent") }}>
            {t} ({certificates.filter(c => c.status === t).length})
          </button>
        ))}
      </div>

      <div className="whmi-card divide-y" style={{ borderColor: "var(--border)" }}>
        {filtered.map(c => (
          <div
            key={c.id}
            ref={c.id === highlightId ? highlightRef : null}
            className="flex items-center justify-between p-4 gap-3 relative"
            style={{ borderColor: "var(--border)", background: c.id === highlightId ? "rgba(217,83,79,.08)" : undefined }}
          >
            {c.id === highlightId && <span className="absolute top-2 left-2 w-2 h-2 rounded-full" style={{ background: "#D9534F" }} />}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--surface-2)" }}>
                <Award size={16} style={{ color: "var(--accent-secondary)" }} />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-[13px] truncate">{c.staff}</div>
                <div className="text-[11.5px] truncate" style={{ color: "var(--text-faint)" }}>{c.event} · {fmtDate(c.date)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={c.status} />
              {tab === "Awaiting Approval" ? (
                <button onClick={() => onApprove?.(c)} className="whmi-btn-primary flex items-center gap-1.5"><CheckCircle2 size={13} />Approve</button>
              ) : (
                <>
                  <button className="whmi-btn-ghost !p-2" title="Resend"><Mail size={14} /></button>
                  {c.pdfUrl && (
                    <a href={c.pdfUrl} target="_blank" rel="noreferrer" className="whmi-btn-ghost !p-2" title="Download"><Download size={14} /></a>
                  )}
                </>
              )}
              {canManage && onRequestDelete && (
                <button onClick={() => onRequestDelete(c)} className="whmi-btn-ghost !p-2" title="Delete" style={{ color: "#D9534F" }}><Trash2 size={14} /></button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="p-8 text-center text-[13px]" style={{ color: "var(--text-faint)" }}>Nothing here.</div>}
      </div>
    </div>
  );
}
