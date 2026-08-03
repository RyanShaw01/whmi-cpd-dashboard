import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Download, Lock } from "lucide-react";

export default function EventQRCode({ event, path = "", filenameSuffix = "qr", url: urlOverride, disabled = false, disabledMessage }) {
  const canvasRef = useRef(null);
  const url = urlOverride || `${window.location.origin}/event/${event.id}${path}`;

  useEffect(() => {
    if (canvasRef.current && !disabled) {
      QRCode.toCanvas(canvasRef.current, url, { width: 180, margin: 1 }, () => {});
    }
  }, [url, disabled]);

  const downloadJpeg = () => {
    const canvas = canvasRef.current;
    if (!canvas || disabled) return;
    const flat = document.createElement("canvas");
    flat.width = canvas.width;
    flat.height = canvas.height;
    const ctx = flat.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, flat.width, flat.height);
    ctx.drawImage(canvas, 0, 0);
    const link = document.createElement("a");
    link.download = `${event.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${filenameSuffix}.jpg`;
    link.href = flat.toDataURL("image/jpeg", 0.95);
    link.click();
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

  return (
    <div className="whmi-card p-4 flex flex-col items-center gap-3">
      <canvas ref={canvasRef} />
      <p className="text-[11px] text-center break-all" style={{ color: "var(--text-faint)" }}>{url}</p>
      <button onClick={downloadJpeg} className="whmi-btn-ghost flex items-center gap-1.5 w-full justify-center">
        <Download size={13} />Download JPEG
      </button>
    </div>
  );
}
