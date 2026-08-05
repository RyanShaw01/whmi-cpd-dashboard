import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, Lock, Link2, Copy, Check } from "lucide-react";

export default function EventQRCode({ event, path = "", filenameSuffix = "qr", url: urlOverride, disabled = false, disabledMessage, layout = "column" }) {
  const canvasRef = useRef(null);
  const url = urlOverride || `${window.location.origin}/event/${event.id}${path}`;
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);

  useEffect(() => {
    if (canvasRef.current && !disabled) {
      QRCode.toCanvas(canvasRef.current, url, { width: 180, margin: 1 }, () => {});
    }
  }, [url, disabled]);

  const flattenedCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const flat = document.createElement("canvas");
    flat.width = canvas.width;
    flat.height = canvas.height;
    const ctx = flat.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, flat.width, flat.height);
    ctx.drawImage(canvas, 0, 0);
    return flat;
  };

  const downloadJpeg = () => {
    const flat = flattenedCanvas();
    if (!flat || disabled) return;
    const link = document.createElement("a");
    link.download = `${event.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${filenameSuffix}.jpg`;
    link.href = flat.toDataURL("image/jpeg", 0.95);
    link.click();
  };

  // Falls back to a hidden textarea + execCommand for browsers/contexts where the async
  // Clipboard API is unavailable or rejects (e.g. some older Safari versions, non-secure
  // contexts) — writeText() failing silently was leaving the button saying "Copied!" with
  // nothing actually on the clipboard.
  const copyLink = () => {
    const markCopied = () => { setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); };
    const fallbackCopy = () => {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        if (document.execCommand("copy")) markCopied();
      } catch { /* give up silently, button just won't flip to "Copied!" */ }
      document.body.removeChild(textarea);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(markCopied).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
  };

  const copyImage = () => {
    const flat = flattenedCanvas();
    if (!flat || disabled || !navigator.clipboard?.write) return;
    flat.toBlob(blob => {
      if (!blob) return;
      navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]).then(() => {
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2000);
      });
    }, "image/png");
  };

  if (disabled) {
    return (
      <div className="whmi-card p-4 flex flex-col items-center gap-3" style={{ opacity: 0.5 }}>
        <div className="rounded-lg flex flex-col items-center justify-center gap-2" style={{ width: 180, height: 180, background: "var(--surface-2)" }}>
          <Lock size={22} style={{ color: "var(--text-faint)" }} />
        </div>
        <p className="text-[11px] text-center" style={{ color: "var(--text-faint)" }}>{disabledMessage || "Not available yet."}</p>
        <button disabled className="whmi-btn-ghost flex items-center gap-1.5 w-full justify-center" style={{ cursor: "not-allowed" }}>
          <Download size={13} />Download JPEG
        </button>
      </div>
    );
  }

  if (layout === "row") {
    return (
      <div className="whmi-card p-4 flex flex-col md:flex-row items-center md:items-start gap-4">
        <canvas ref={canvasRef} className="shrink-0" />
        <div className="flex flex-col gap-1.5 min-w-0 flex-1 w-full">
          <p className="text-[11px] break-all md:text-left text-center" style={{ color: "var(--text-faint)" }}>{url}</p>
          <button onClick={copyLink} className="whmi-btn-ghost flex items-center gap-1.5 w-full justify-center">
            {copiedLink ? <><Check size={13} />Copied!</> : <><Link2 size={13} />Copy Link</>}
          </button>
          {!!navigator.clipboard?.write && (
            <button onClick={copyImage} className="whmi-btn-ghost flex items-center gap-1.5 w-full justify-center">
              {copiedImage ? <><Check size={13} />Copied!</> : <><Copy size={13} />Copy QR Code</>}
            </button>
          )}
          <button onClick={downloadJpeg} className="whmi-btn-ghost flex items-center gap-1.5 w-full justify-center">
            <Download size={13} />Download JPEG
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="whmi-card p-4 flex flex-col items-center gap-3">
      <canvas ref={canvasRef} />
      <p className="text-[11px] text-center break-all" style={{ color: "var(--text-faint)" }}>{url}</p>
      <div className="w-full grid grid-cols-1 gap-1.5">
        <button onClick={copyLink} className="whmi-btn-ghost flex items-center gap-1.5 w-full justify-center">
          {copiedLink ? <><Check size={13} />Copied!</> : <><Link2 size={13} />Copy Link</>}
        </button>
        {!!navigator.clipboard?.write && (
          <button onClick={copyImage} className="whmi-btn-ghost flex items-center gap-1.5 w-full justify-center">
            {copiedImage ? <><Check size={13} />Copied!</> : <><Copy size={13} />Copy QR Code</>}
          </button>
        )}
        <button onClick={downloadJpeg} className="whmi-btn-ghost flex items-center gap-1.5 w-full justify-center">
          <Download size={13} />Download JPEG
        </button>
      </div>
    </div>
  );
}
