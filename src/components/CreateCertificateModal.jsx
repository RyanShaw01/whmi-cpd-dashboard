import { useState, useEffect } from "react";
import { X, Award, Download } from "lucide-react";
import { createManualCertificate } from "../lib/db";

// For someone with no account in the system: an admin/owner types the details directly and
// gets a downloadable certificate PDF immediately. Skips email entirely (see
// supabase/functions/create-manual-certificate) since this is a one-off admin action.
export default function CreateCertificateModal({ open, onClose, cpdTypes = [], onCreated }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [date, setDate] = useState("");
  const [cpdHours, setCpdHours] = useState("1");
  const [cpdTypeId, setCpdTypeId] = useState("");
  const [status, setStatus] = useState("idle"); // idle | working | done | error
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!open) return;
    setName(""); setEmail(""); setSessionName(""); setDate(""); setCpdHours("1"); setCpdTypeId("");
    setStatus("idle"); setResult(null);
  }, [open]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !sessionName.trim() || !date) return;
    setStatus("working");
    const res = await createManualCertificate({
      name: name.trim(), email: email.trim(), sessionName: sessionName.trim(), date,
      cpdHours: Number(cpdHours) || 1, cpdTypeId: cpdTypeId || null,
    });
    if (res.ok) {
      setStatus("done");
      setResult(res);
      onCreated?.();
    } else {
      setStatus("error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.5)" }} onClick={onClose}>
      <div className="whmi-card w-full max-w-md max-h-[85vh] overflow-y-auto whmi-scroll whmi-fade-in" onClick={e => e.stopPropagation()}>
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="disp text-[16px] font-extrabold flex items-center gap-2"><Award size={17} style={{ color: "var(--accent-secondary)" }} />Create Certificate</h2>
          <button onClick={onClose} className="whmi-btn-ghost !p-2"><X size={14} /></button>
        </div>

        {status === "done" && result ? (
          <div className="p-5 space-y-3">
            <p className="text-[13px]" style={{ color: "var(--accent-success)" }}>Certificate created for {name}.</p>
            {result.pdfUrl && (
              <a href={result.pdfUrl} target="_blank" rel="noreferrer" className="whmi-btn-primary w-full flex items-center justify-center gap-1.5"><Download size={14} />Download PDF</a>
            )}
            <button onClick={onClose} className="whmi-btn-ghost w-full">Close</button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 space-y-3">
            <p className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>For someone who doesn't have an account in the system. They'll be listed under Staff &gt; Certificate Recipients.</p>
            <div>
              <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Recipient Name</label>
              <input required value={name} onChange={e => setName(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1" />
            </div>
            <div>
              <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Recipient Email</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1" />
            </div>
            <div>
              <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Session / Event Name</label>
              <input required value={sessionName} onChange={e => setSessionName(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Date</label>
                <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1" />
              </div>
              <div>
                <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>CPD Hours</label>
                <input required type="number" min="0.5" step="0.5" value={cpdHours} onChange={e => setCpdHours(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>CPD Type</label>
              <select value={cpdTypeId} onChange={e => setCpdTypeId(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1">
                <option value="">No matching CPD type</option>
                {cpdTypes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.appellationCode})</option>)}
              </select>
              <p className="text-[10.5px] mt-1" style={{ color: "var(--text-faint)" }}>
                {cpdTypeId ? "The matching appellation code will appear on the certificate." : "No ASMIRT-endorsed code will be added; a generic attendance certificate is generated."}
              </p>
            </div>
            {status === "error" && <div className="text-[12px] font-semibold" style={{ color: "#D9534F" }}>Something went wrong generating the certificate. Please try again.</div>}
            <button type="submit" disabled={status === "working"} className="whmi-btn-primary w-full flex items-center justify-center gap-1.5" style={{ opacity: status === "working" ? 0.7 : 1 }}>
              <Award size={14} />{status === "working" ? "Generating…" : "Generate Certificate"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
