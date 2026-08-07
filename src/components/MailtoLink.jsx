import { useState } from "react";
import { Check } from "lucide-react";

// Clicking copies the address straight to the clipboard and shows a small temporary
// confirmation — simpler than a mailto: link, which silently does nothing on plenty of
// browsers/devices with no default mail client configured.
export default function MailtoLink({ email, className, style, children }) {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <span className="relative inline-block">
      <button type="button" onClick={copyEmail} className={className} style={{ textDecoration: "underline", textUnderlineOffset: 2, ...style }}>
        {children || email}
      </button>
      {copied && (
        <span
          className="absolute left-1/2 -translate-x-1/2 -top-7 whitespace-nowrap px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 whmi-fade-in z-10"
          style={{ background: "var(--text)", color: "var(--surface)" }}
        >
          <Check size={11} />Copied!
        </span>
      )}
    </span>
  );
}
