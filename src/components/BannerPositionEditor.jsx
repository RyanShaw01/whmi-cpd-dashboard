import { useRef } from "react";
import { Crosshair, Trash2 } from "lucide-react";

// Lets an admin click anywhere on the banner preview to re-centre the crop (stored as a
// 0-100% focal point per event), matching the same wide-strip crop used everywhere the
// banner actually renders (event detail hero, Up Next, Upcoming Events cards).
export default function BannerPositionEditor({ bannerUrl, focalX = 50, focalY = 50, onChangeFocal, onRemove }) {
  const containerRef = useRef(null);

  const handleClick = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    onChangeFocal(Math.min(100, Math.max(0, x)), Math.min(100, Math.max(0, y)));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Banner Position</label>
        <button type="button" onClick={onRemove} className="whmi-btn-ghost !py-1 !px-2 text-[11px] flex items-center gap-1" style={{ color: "#D9534F" }}>
          <Trash2 size={11} />Remove Banner
        </button>
      </div>
      <div
        ref={containerRef}
        onClick={handleClick}
        className="relative w-full h-24 rounded-lg overflow-hidden cursor-crosshair"
        style={{ border: "1px solid var(--border)" }}
        title="Click to set the banner's focal point"
      >
        <img src={bannerUrl} alt="" className="w-full h-full object-cover" style={{ objectPosition: `${focalX}% ${focalY}%` }} draggable={false} />
        <div
          className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center pointer-events-none"
          style={{ left: `${focalX}%`, top: `${focalY}%`, background: "rgba(0,0,0,.45)", border: "1.5px solid white" }}
        >
          <Crosshair size={9} color="white" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>Click the preview to set what stays visible when the banner is cropped.</p>
        {(focalX !== 50 || focalY !== 50) && (
          <button type="button" onClick={() => onChangeFocal(50, 50)} className="whmi-btn-ghost !py-1 !px-2 text-[10.5px] shrink-0">Reset to Center</button>
        )}
      </div>
    </div>
  );
}
