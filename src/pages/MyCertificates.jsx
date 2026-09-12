import { Award, Download } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import { fmtDate, myCertificates, myCpdTotals } from "../lib/helpers";

export default function MyCertificates({ user, certificates }) {
  const myCerts = myCertificates(certificates, user);
  // Hours are the number people actually need off this page (it's what the MRPBA asks them to
  // evidence), and it was the one thing the list didn't show.
  const { total } = myCpdTotals(certificates, user);
  const sentCount = myCerts.filter(c => c.status === "Sent").length;

  return (
    <div className="whmi-fade-in p-6 max-w-[800px] mx-auto space-y-5">
      <div>
        <h1 className="disp text-[22px] font-extrabold flex items-center gap-2"><Award size={20} style={{ color: "var(--accent-secondary)" }} />My Certificates</h1>
        <p className="text-[13px]" style={{ color: "var(--text-dim)" }}>Every CPD certificate issued to you.</p>
      </div>

      {myCerts.length > 0 && (
        <div className="whmi-card p-4 flex items-center justify-between gap-3 flex-wrap text-[13px]">
          <span style={{ color: "var(--text-dim)" }}><strong style={{ color: "var(--text)" }}>{sentCount}</strong> certificate{sentCount === 1 ? "" : "s"} issued</span>
          <span style={{ color: "var(--text-dim)" }}><strong style={{ color: "var(--text)" }}>{total}</strong> CPD hours in total</span>
        </div>
      )}

      <div className="whmi-card p-5">
        {myCerts.length === 0 && (
          <div className="text-center py-4 space-y-1">
            <div className="text-[13px] font-semibold">No certificates yet</div>
            {/* An empty list with no explanation left people with no idea what to do next -
                the reflection form is the only thing that triggers a certificate. */}
            <p className="text-[12.5px]" style={{ color: "var(--text-faint)" }}>
              After you attend a CPD event, complete its reflection form and your certificate is emailed to you automatically.
            </p>
          </div>
        )}
        <div className="space-y-2">
          {myCerts.map(c => (
            <div key={c.id} className="flex items-center justify-between gap-3 p-3 rounded-xl" style={{ border: "1px solid var(--border)" }}>
              <div className="min-w-0">
                <div className="font-semibold text-[13px] break-words">{c.event}</div>
                <div className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>
                  {fmtDate(c.date)}{c.cpdHours ? ` · ${c.cpdHours} CPD hour${c.cpdHours === 1 ? "" : "s"}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={c.status} />
                {c.status === "Sent" && c.pdfUrl && (
                  // Was an unlabelled icon whose only hint was a hover tooltip - which never
                  // appears at all on a touchscreen.
                  <a href={c.pdfUrl} target="_blank" rel="noreferrer" className="whmi-btn-ghost !py-1.5 !px-2.5 text-[12px] flex items-center gap-1.5">
                    <Download size={13} />Download
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
