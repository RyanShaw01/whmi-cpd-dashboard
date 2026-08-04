import { useState, useEffect, useRef, useMemo } from "react";
import { Award, CheckCircle2, Mail, Download, Trash2, Plus, Send, ChevronDown, ChevronRight, FolderOpen } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import InfoTooltip from "../components/InfoTooltip";
import { fmtDate } from "../lib/helpers";

const SORT_OPTIONS = [
  { id: "latest", label: "Latest Event" },
  { id: "alpha", label: "Alphabetical" },
];

export default function Certificates({
  certificates, canManage, onRequestDelete, onApprove, highlightId, onCreateCertificate,
  onApproveAndSendAll, onResend, requestConfirm,
}) {
  const [sortBy, setSortBy] = useState("latest");
  const [expanded, setExpanded] = useState({});
  const highlightRef = useRef(null);
  const awaitingCount = certificates.filter(c => c.status === "Awaiting Approval").length;

  const folders = useMemo(() => {
    const groups = new Map();
    for (const c of certificates) {
      const key = c.eventId || `manual-${c.event}`;
      if (!groups.has(key)) groups.set(key, { key, title: c.event, latestDate: c.date, certs: [] });
      const g = groups.get(key);
      g.certs.push(c);
      if (c.date > g.latestDate) g.latestDate = c.date;
    }
    const list = [...groups.values()];
    list.sort((a, b) => sortBy === "alpha" ? a.title.localeCompare(b.title) : (b.latestDate || "").localeCompare(a.latestDate || ""));
    return list;
  }, [certificates, sortBy]);

  const confirmResend = (c) => {
    const history = c.resendCount > 0
      ? ` It's already been resent ${c.resendCount} time${c.resendCount === 1 ? "" : "s"}, most recently on ${fmtDate(c.lastResentAt)}.`
      : "";
    requestConfirm?.({
      title: "Resend certificate?",
      message: `Are you sure you want to re-send this certificate to ${c.recipientEmail}? Originally sent on ${fmtDate(c.sentAt)}.${history}`,
      confirmLabel: "Resend",
      onConfirm: () => onResend?.(c),
    });
  };

  const confirmApproveAndSendAll = () => {
    requestConfirm?.({
      title: "Approve & send all?",
      message: `Approve and email all ${awaitingCount} certificate${awaitingCount === 1 ? "" : "s"} awaiting approval?`,
      confirmLabel: "Approve & Send",
      onConfirm: () => onApproveAndSendAll?.(),
    });
  };

  const confirmApproveAndSendAllForEvent = (folder, awaitingInFolder) => {
    requestConfirm?.({
      title: "Approve & send all for this event?",
      message: `Approve and email all ${awaitingInFolder.length} certificate${awaitingInFolder.length === 1 ? "" : "s"} awaiting approval for "${folder.title}"?`,
      confirmLabel: "Approve & Send",
      onConfirm: () => onApproveAndSendAll?.(awaitingInFolder),
    });
  };

  useEffect(() => {
    if (!highlightId) return;
    const folder = folders.find(f => f.certs.some(c => c.id === highlightId));
    if (folder) setExpanded(e => ({ ...e, [folder.key]: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightId]);

  useEffect(() => {
    if (highlightId && highlightRef.current) highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightId, expanded]);

  const renderCertRow = (c) => (
    <div
      key={c.id}
      ref={c.id === highlightId ? highlightRef : null}
      className="flex items-center justify-between p-3 gap-3 relative rounded-lg"
      style={{ background: c.id === highlightId ? "rgba(217,83,79,.08)" : "var(--surface-2)" }}
    >
      {c.id === highlightId && <span className="absolute top-2 left-2 w-2 h-2 rounded-full" style={{ background: "#D9534F" }} />}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--surface)" }}>
          <Award size={14} style={{ color: "var(--accent-secondary)" }} />
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-[12.5px] truncate">{c.staff}</div>
          <div className="text-[11px] truncate" style={{ color: "var(--text-faint)" }}>{c.recipientEmail} · {fmtDate(c.date)}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <StatusBadge status={c.status} />
        {c.status === "Awaiting Approval" ? (
          <button onClick={() => onApprove?.(c)} className="whmi-btn-primary flex items-center gap-1.5"><CheckCircle2 size={13} />Approve</button>
        ) : (
          <>
            <button onClick={() => confirmResend(c)} className="whmi-btn-ghost !p-2" title="Resend"><Mail size={14} /></button>
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
  );

  return (
    <div className="whmi-fade-in p-6 max-w-[1400px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="disp text-[22px] font-extrabold">Certificates</h1>
          <p className="text-[13px]" style={{ color: "var(--text-dim)" }}>Generated automatically once registration and reflection are confirmed.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="whmi-input px-2.5 py-2 text-[12.5px]">
            {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>Sort: {o.label}</option>)}
          </select>
          {canManage && onApproveAndSendAll && awaitingCount > 0 && (
            <div className="flex items-center gap-1.5">
              <button onClick={confirmApproveAndSendAll} className="whmi-btn-primary flex items-center gap-1.5"><Send size={14} />Approve &amp; Send All ({awaitingCount})</button>
              <InfoTooltip text="Approving generates the certificate and emails it to the recipient automatically." />
            </div>
          )}
          {canManage && onCreateCertificate && (
            <button onClick={onCreateCertificate} className="whmi-btn-primary flex items-center gap-1.5"><Plus size={15} />Create Certificate</button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {folders.map(folder => {
          const awaiting = folder.certs.filter(c => c.status === "Awaiting Approval");
          const sent = folder.certs.filter(c => c.status === "Sent");
          const isOpen = !!expanded[folder.key];
          return (
            <div key={folder.key} className="whmi-card p-4">
              <button onClick={() => setExpanded(e => ({ ...e, [folder.key]: !e[folder.key] }))} className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {isOpen ? <ChevronDown size={13} style={{ color: "var(--text-faint)" }} className="shrink-0" /> : <ChevronRight size={13} style={{ color: "var(--text-faint)" }} className="shrink-0" />}
                  <FolderOpen size={15} style={{ color: "var(--accent-primary)" }} className="shrink-0" />
                  <div className="min-w-0 text-left">
                    <div className="font-semibold text-[13px] truncate">{folder.title}</div>
                    <div className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>{fmtDate(folder.latestDate)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {awaiting.length > 0 && <span className="whmi-badge" style={{ background: "rgba(240,173,78,.15)", color: "#C87F0A" }}>{awaiting.length} awaiting</span>}
                  <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>{folder.certs.length} total</span>
                </div>
              </button>
              {isOpen && (
                <div className="mt-3 space-y-4">
                  {awaiting.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Awaiting Approval ({awaiting.length})</div>
                        {canManage && awaiting.length > 1 && (
                          <button onClick={() => confirmApproveAndSendAllForEvent(folder, awaiting)} className="whmi-btn-ghost !py-1 !px-2.5 text-[11.5px] flex items-center gap-1.5">
                            <Send size={12} />Approve All For This Event
                          </button>
                        )}
                      </div>
                      <div className="space-y-1.5">{awaiting.map(renderCertRow)}</div>
                    </div>
                  )}
                  {sent.length > 0 && (
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-faint)" }}>Sent ({sent.length})</div>
                      <div className="space-y-1.5">{sent.map(renderCertRow)}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {folders.length === 0 && <div className="whmi-card p-8 text-center text-[13px]" style={{ color: "var(--text-faint)" }}>Nothing here.</div>}
      </div>
    </div>
  );
}
