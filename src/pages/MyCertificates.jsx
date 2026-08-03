import { Award, Download } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import { fmtDate, myCertificates } from "../lib/helpers";

export default function MyCertificates({ user, certificates }) {
  const myCerts = myCertificates(certificates, user);
  return (
    <div className="whmi-fade-in p-6 max-w-[800px] mx-auto space-y-5">
      <div>
        <h1 className="disp text-[22px] font-extrabold flex items-center gap-2"><Award size={20} style={{ color: "var(--accent-secondary)" }} />My Certificates</h1>
        <p className="text-[13px]" style={{ color: "var(--text-dim)" }}>Every CPD certificate issued to you.</p>
      </div>

      <div className="whmi-card p-5">
        {myCerts.length === 0 && <div className="text-[12.5px]" style={{ color: "var(--text-faint)" }}>No certificates yet.</div>}
        <div className="space-y-2">
          {myCerts.map(c => (
            <div key={c.id} className="flex items-center justify-between gap-3 p-3 rounded-xl" style={{ border: "1px solid var(--border)" }}>
              <div className="min-w-0">
                <div className="font-semibold text-[13px] break-words">{c.event}</div>
                <div className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>{fmtDate(c.date)}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={c.status} />
                {c.status === "Sent" && c.pdfUrl && (
                  <a href={c.pdfUrl} target="_blank" rel="noreferrer" className="whmi-btn-ghost !p-2" title="Download PDF"><Download size={14} /></a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
