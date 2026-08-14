import { useState } from "react";
import { Award, Mail, MailCheck } from "lucide-react";
import { sendHistoryFor, relativeTime, fmtDateTime } from "../lib/helpers";

// One presenter's own row: name, cert-inclusion state, and an individual send button with its
// own inline confirm (mirrors the attendee individual-send button in RegistrationsPanel, but this
// one's confirm also asks about a CPD certificate since presenters get one on request).
function PresenterRow({ presenter, emailLog, onSend, onRefresh }) {
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [includeCert, setIncludeCert] = useState(false);
  const history = sendHistoryFor(emailLog, presenter.email, "presenter_thank_you");
  const hasSent = history.length > 0;
  const tooltip = hasSent
    ? `Sent ${history.length} time${history.length === 1 ? "" : "s"}:\n${history.map(h => fmtDateTime(h.sentAt)).join("\n")}`
    : "Send Presenter Thank-You";

  const confirmSend = async () => {
    setSending(true);
    await onSend([{ id: presenter.id, includeCertificate: includeCert }]);
    await onRefresh();
    setSending(false);
    setConfirming(false);
    setIncludeCert(false);
  };

  return (
    <div className="p-2 rounded-md" style={{ background: "var(--surface-2)" }}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] truncate">{presenter.name}</span>
        {!confirming && (
          <div className="flex flex-col items-end gap-0.5 shrink-0" title={tooltip}>
            <button
              onClick={() => setConfirming(true)}
              className="flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-semibold transition hover:brightness-110"
              style={hasSent
                ? { color: "var(--text-faint)", border: "1px solid var(--border)" }
                : { color: "white", background: "var(--accent-secondary)" }}
            >
              {hasSent ? <MailCheck size={11} /> : <Mail size={11} />}Presenter Thank-You Email
            </button>
            {hasSent && (
              <span className="text-[9.5px]" style={{ color: "var(--text-faint)" }}>
                {history.length > 1 ? `Sent ${history.length}x, last ` : "Sent "}{relativeTime(history[0].sentAt)}
              </span>
            )}
          </div>
        )}
      </div>
      {confirming && (
        <div className="mt-1.5 pt-1.5 space-y-1.5" style={{ borderTop: "1px solid var(--border)" }}>
          {hasSent && (
            <div className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>
              Already sent{history.length > 1 ? ` ${history.length}x` : ""}, last {relativeTime(history[0].sentAt)} - resend?
            </div>
          )}
          <label className="flex items-center gap-1.5 text-[11px] cursor-pointer" style={{ color: "var(--text-dim)" }}>
            <input type="checkbox" checked={includeCert} onChange={e => setIncludeCert(e.target.checked)} />
            Include CPD certificate
          </label>
          <div className="flex items-center justify-end gap-1.5">
            <button onClick={() => setConfirming(false)} className="whmi-btn-ghost !py-1 !px-2 text-[11px]">Cancel</button>
            <button onClick={confirmSend} disabled={sending} className="whmi-btn-primary !py-1 !px-2.5 text-[11px]">{sending ? "Sending..." : `Confirm${hasSent ? " Resend" : ""}`}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Presenters get their own thank-you flow, entirely separate from the attendee-facing thank-you
// (no reflection-form ask), with an optional CPD certificate - both individually (per presenter,
// above) and in bulk (below). Shared by EventDetailModal and PreviousEventDetailModal so upcoming
// and past events behave identically.
export default function PresentersSection({ event, presenters, emailLog, onSendPresenterThankYou, onRefreshEmailLog, canManage }) {
  const [bulkCertIds, setBulkCertIds] = useState(new Set());
  const [confirmingBulk, setConfirmingBulk] = useState(false);
  const [sendingBulk, setSendingBulk] = useState(false);

  if (!canManage || !onSendPresenterThankYou || presenters.length === 0) return null;

  const unsent = presenters.filter(r => sendHistoryFor(emailLog, r.email, "presenter_thank_you").length === 0);
  const toggleBulkCert = (id) => setBulkCertIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const certCount = [...bulkCertIds].filter(id => unsent.some(p => p.id === id)).length;

  const confirmBulkSend = async () => {
    setSendingBulk(true);
    await onSendPresenterThankYou(unsent.map(r => ({ id: r.id, includeCertificate: bulkCertIds.has(r.id) })));
    await onRefreshEmailLog();
    setSendingBulk(false);
    setConfirmingBulk(false);
    setBulkCertIds(new Set());
  };

  return (
    <div className="whmi-card p-3 space-y-2">
      <div className="text-[10.5px] font-bold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Presenters ({presenters.length})</div>
      <div className="space-y-1">
        {presenters.map(r => (
          <PresenterRow key={r.id} presenter={r} emailLog={emailLog} onSend={onSendPresenterThankYou} onRefresh={onRefreshEmailLog} />
        ))}
      </div>

      {unsent.length > 0 && (
        confirmingBulk ? (
          <div className="pt-1.5 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="text-[11.5px]" style={{ color: "var(--text-dim)" }}>
              Send to {unsent.length} presenter{unsent.length === 1 ? "" : "s"}{certCount > 0 ? ` (${certCount} with a CPD certificate)` : ""}?
            </div>
            <div className="space-y-1">
              {unsent.map(r => (
                <label key={r.id} className="flex items-center gap-2 text-[11.5px] cursor-pointer" style={{ color: "var(--text-faint)" }}>
                  <input type="checkbox" checked={bulkCertIds.has(r.id)} onChange={() => toggleBulkCert(r.id)} />
                  {r.name} - include certificate
                </label>
              ))}
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <button onClick={() => setConfirmingBulk(false)} className="whmi-btn-ghost !py-1.5 text-[11.5px]">Cancel</button>
              <button onClick={confirmBulkSend} disabled={sendingBulk} className="whmi-btn-primary !py-1.5 text-[11.5px]">{sendingBulk ? "Sending..." : "Confirm & Send"}</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingBulk(true)}
            className="whmi-btn-primary w-full !py-1.5 text-[12px] flex items-center justify-center gap-1.5 transition hover:brightness-110"
          >
            <Award size={13} />Send Thank-You to Presenters ({unsent.length})
          </button>
        )
      )}
    </div>
  );
}
