import { useState, useEffect, useRef, useMemo } from "react";
import { Award, CheckCircle2, Mail, Download, Eye, Trash2, Plus, Send, ChevronDown, ChevronRight, FolderOpen, Clock } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import InfoTooltip from "../components/InfoTooltip";
import { fmtDate } from "../lib/helpers";

const SORT_OPTIONS = [
  { id: "latest", label: "Latest Event" },
  { id: "alpha", label: "Alphabetical" },
];

const CERT_SORT_OPTIONS = [
  { id: "date-desc", label: "Newest - Oldest" },
  { id: "date-asc", label: "Oldest - Newest" },
  { id: "first-asc", label: "First Name (A - Z)" },
  { id: "first-desc", label: "First Name (Z - A)" },
  { id: "last-asc", label: "Last Name (A - Z)" },
  { id: "last-desc", label: "Last Name (Z - A)" },
];

const CERT_STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "sent", label: "Sent" },
  { id: "not-sent", label: "Not Sent" },
];

const firstName = (name) => (name || "").trim().split(/\s+/)[0] || "";
const lastName = (name) => { const parts = (name || "").trim().split(/\s+/); return parts.length > 1 ? parts[parts.length - 1] : ""; };

export default function Certificates({
  certificates, canManage, onRequestDelete, onApprove, highlightId, onCreateCertificate,
  onApproveAndSendAll, onResend, requestConfirm,
}) {
  const [sortBy, setSortBy] = useState("latest");
  const [expanded, setExpanded] = useState({});
  const [openRowId, setOpenRowId] = useState(null);
  const [certSort, setCertSort] = useState({});
  const [certFilter, setCertFilter] = useState({});
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

  const sortCerts = (certs, sortId) => {
    const list = [...certs];
    list.sort((a, b) => {
      if (sortId === "date-asc") return (a.date || "").localeCompare(b.date || "");
      if (sortId === "first-asc") return firstName(a.staff).localeCompare(firstName(b.staff));
      if (sortId === "first-desc") return firstName(b.staff).localeCompare(firstName(a.staff));
      if (sortId === "last-asc") return lastName(a.staff).localeCompare(lastName(b.staff));
      if (sortId === "last-desc") return lastName(b.staff).localeCompare(lastName(a.staff));
      return (b.date || "").localeCompare(a.date || ""); // date-desc, default
    });
    return list;
  };

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
    setOpenRowId(highlightId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightId]);

  useEffect(() => {
    if (highlightId && highlightRef.current) highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightId, expanded]);

  // Awaiting-approval rows: compact, no certificate to view/download yet — just Approve (+ Delete).
  const renderAwaitingRow = (c) => (
    <div
      key={c.id}
      ref={c.id === highlightId ? highlightRef : null}
      className="flex items-center justify-between p-3 gap-3 relative rounded-lg flex-wrap"
      style={{ background: c.id === highlightId ? "rgba(217,83,79,.08)" : "var(--surface-2)" }}
    >
      {c.id === highlightId && <span className="absolute top-2 left-2 w-2 h-2 rounded-full" style={{ background: "#D9534F" }} />}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--surface)" }}>
          <Award size={14} style={{ color: "var(--accent-secondary)" }} />
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-[12.5px] truncate">{c.staff}</div>
          <div className="text-[11px] truncate hidden sm:block" style={{ color: "var(--text-faint)" }}>{c.recipientEmail} · {fmtDate(c.date)}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <StatusBadge status={c.status} />
        <button onClick={() => onApprove?.(c)} className="whmi-btn-primary flex items-center gap-1.5"><CheckCircle2 size={13} />Approve</button>
        {canManage && onRequestDelete && (
          <button onClick={() => onRequestDelete(c)} className="whmi-btn-ghost !p-2" title="Delete" style={{ color: "#D9534F" }}><Trash2 size={14} /></button>
        )}
      </div>
    </div>
  );

  // Sent rows: a collapsible header (name + sent status, legible on phone) that expands to reveal
  // the email, exactly when it was sent (and any resend history), view/download, and resend-with-confirm.
  const renderSentRow = (c) => {
    const isOpen = openRowId === c.id;
    return (
      <div
        key={c.id}
        ref={c.id === highlightId ? highlightRef : null}
        className="rounded-lg overflow-hidden relative"
        style={{ background: c.id === highlightId ? "rgba(217,83,79,.08)" : "var(--surface-2)" }}
      >
        {c.id === highlightId && <span className="absolute top-2 left-2 w-2 h-2 rounded-full z-10" style={{ background: "#D9534F" }} />}
        <button
          onClick={() => setOpenRowId(x => x === c.id ? null : c.id)}
          className="w-full flex items-center justify-between p-3 gap-3 transition"
          onMouseEnter={e => { e.currentTarget.style.background = "var(--surface)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {isOpen ? <ChevronDown size={13} style={{ color: "var(--text-faint)" }} className="shrink-0" /> : <ChevronRight size={13} style={{ color: "var(--text-faint)" }} className="shrink-0" />}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--surface)" }}>
              <Award size={14} style={{ color: "var(--accent-secondary)" }} />
            </div>
            <div className="min-w-0 text-left">
              <div className="font-semibold text-[12.5px] truncate">{c.staff}</div>
              <div className="text-[11px] truncate hidden sm:block" style={{ color: "var(--text-faint)" }}>{c.recipientEmail} · {fmtDate(c.date)}</div>
            </div>
          </div>
          <StatusBadge status={c.status} />
        </button>
        {isOpen && (
          <div className="px-3 pb-3 pt-1 space-y-2.5 text-[12px]" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="sm:hidden" style={{ color: "var(--text-faint)" }}>{c.recipientEmail} · {fmtDate(c.date)}</div>
            <div className="flex items-center gap-1.5" style={{ color: "var(--text-dim)" }}>
              <Clock size={12} className="shrink-0" />
              Sent {fmtDate(c.sentAt)}
              {c.resendCount > 0 && <span style={{ color: "var(--text-faint)" }}>· resent {c.resendCount} time{c.resendCount === 1 ? "" : "s"}, most recently {fmtDate(c.lastResentAt)}</span>}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {c.pdfUrl && (
                <a href={c.pdfUrl} target="_blank" rel="noreferrer" className="whmi-btn-ghost !py-1.5 !px-2.5 text-[11.5px] flex items-center gap-1.5"><Eye size={13} />View</a>
              )}
              {c.pdfUrl && (
                <a href={c.pdfUrl} download target="_blank" rel="noreferrer" className="whmi-btn-ghost !py-1.5 !px-2.5 text-[11.5px] flex items-center gap-1.5"><Download size={13} />Download PDF</a>
              )}
              <button onClick={() => confirmResend(c)} className="whmi-btn-ghost !py-1.5 !px-2.5 text-[11.5px] flex items-center gap-1.5"><Mail size={13} />Resend</button>
              {canManage && onRequestDelete && (
                <button onClick={() => onRequestDelete(c)} className="whmi-btn-ghost !py-1.5 !px-2.5 text-[11.5px] flex items-center gap-1.5 ml-auto" style={{ color: "#D9534F" }}><Trash2 size={13} />Delete</button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

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
          const isOpen = !!expanded[folder.key];
          const sortId = certSort[folder.key] || "date-desc";
          const filterId = certFilter[folder.key] || "all";
          const sorted = sortCerts(folder.certs, sortId);
          const awaiting = sorted.filter(c => c.status === "Awaiting Approval");
          const sent = sorted.filter(c => c.status === "Sent");
          const showAwaiting = filterId !== "sent" && awaiting.length > 0;
          const showSent = filterId !== "not-sent" && sent.length > 0;
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
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <select value={filterId} onChange={e => setCertFilter(f => ({ ...f, [folder.key]: e.target.value }))} className="whmi-input px-2 py-1.5 text-[11.5px]">
                      {CERT_STATUS_FILTERS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                    <select value={sortId} onChange={e => setCertSort(s => ({ ...s, [folder.key]: e.target.value }))} className="whmi-input px-2 py-1.5 text-[11.5px]">
                      {CERT_SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                  </div>
                  {showAwaiting && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Awaiting Approval ({awaiting.length})</div>
                        {canManage && awaiting.length > 1 && (
                          <button onClick={() => confirmApproveAndSendAllForEvent(folder, awaiting)} className="whmi-btn-ghost !py-1 !px-2.5 text-[11.5px] flex items-center gap-1.5">
                            <Send size={12} />Approve All For This Event
                          </button>
                        )}
                      </div>
                      <div className="space-y-1.5">{awaiting.map(renderAwaitingRow)}</div>
                    </div>
                  )}
                  {showSent && (
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-faint)" }}>Sent ({sent.length})</div>
                      <div className="space-y-1.5">{sent.map(renderSentRow)}</div>
                    </div>
                  )}
                  {!showAwaiting && !showSent && (
                    <div className="text-[12px] text-center py-3" style={{ color: "var(--text-faint)" }}>No certificates match this filter.</div>
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
