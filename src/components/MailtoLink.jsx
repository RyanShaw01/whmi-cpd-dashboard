import { useState } from "react";
import { Mail, Copy, Check, X } from "lucide-react";

// A plain "mailto:" link is unreliable — plenty of browsers/devices have no default mail client
// configured and just silently fail. This shows a small popup instead, letting people copy the
// address themselves or attempt to open their mail app.
export default function MailtoLink({ email, className, style, children }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className} style={{ textDecoration: "underline", textUnderlineOffset: 2, ...style }}>
        {children || email}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.5)" }} onClick={() => setOpen(false)}>
          <div className="whmi-card w-full max-w-xs whmi-fade-in p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-[14px] flex items-center gap-1.5" style={{ color: "var(--text)" }}>
                <Mail size={15} style={{ color: "var(--accent-primary)" }} />Contact WHMI Education
              </div>
              <button onClick={() => setOpen(false)} className="whmi-btn-ghost !p-1.5"><X size={13} /></button>
            </div>
            <div className="text-[12.5px] mb-3 break-all" style={{ color: "var(--text-dim)" }}>{email}</div>
            <div className="flex gap-2">
              <button onClick={copyEmail} className="whmi-btn-ghost flex-1 flex items-center justify-center gap-1.5 text-[12.5px]">
                {copied ? <Check size={13} /> : <Copy size={13} />}{copied ? "Copied!" : "Copy Address"}
              </button>
              <a href={`mailto:${email}`} onClick={() => setOpen(false)} className="whmi-btn-primary flex-1 flex items-center justify-center gap-1.5 text-[12.5px]">
                <Mail size={13} />Open Email App
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
