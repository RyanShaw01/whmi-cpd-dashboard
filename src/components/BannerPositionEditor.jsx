import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";

// A representative "wide strip" ratio for the crop-box preview — the shortest/most
// crop-sensitive banner placements (Up Next, Upcoming Events cards) are all this shape.
// It's an approximate guide, not pixel-exact for every placement the banner appears in.
const TARGET_ASPECT = 3.4;

// Shows the FULL, uncropped flyer image (so nothing is hidden) with an overlay box showing
// roughly what will stay visible once it's cropped to a banner strip. Click anywhere to move
// the box there. Replaces the old approach of clicking on an already-cropped preview, whose
// click coordinates didn't correspond to a correct focal point.
export default function BannerPositionEditor({ bannerUrl, focalX = 50, focalY = 50, onChangeFocal, onRemove }) {
  const containerRef = useRef(null);
  const [naturalAspect, setNaturalAspect] = useState(null);

  const handleLoad = (e) => setNaturalAspect(e.target.naturalWidth / e.target.naturalHeight);

  const handleClick = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    onChangeFocal(Math.min(100, Math.max(0, x)), Math.min(100, Math.max(0, y)));
  };

  let box = { left: 0, top: 0, width: 100, height: 100 };
  if (naturalAspect) {
    if (naturalAspect >= TARGET_ASPECT) {
      const widthPct = Math.min(100, (TARGET_ASPECT / naturalAspect) * 100);
      box = { width: widthPct, height: 100, top: 0, left: Math.min(Math.max(focalX - widthPct / 2, 0), 100 - widthPct) };
    } else {
      const heightPct = Math.min(100, (naturalAspect / TARGET_ASPECT) * 100);
      box = { width: 100, height: heightPct, left: 0, top: Math.min(Math.max(focalY - heightPct / 2, 0), 100 - heightPct) };
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Banner Position</label>
        <button type="button" onClick={onRemove} className="whmi-btn-ghost !py-1 !px-2 text-[11px] flex items-center gap-1" style={{ color: "#D9534F" }}>
          <Trash2 size={11} />Remove Banner
        </button>
      </div>
      <div className="flex justify-center p-2 rounded-lg" style={{ background: "var(--surface-2)" }}>
        <div ref={containerRef} onClick={handleClick} className="relative inline-block cursor-crosshair overflow-hidden rounded-lg" title="Click to move the crop box">
          <img
            src={bannerUrl} alt="" onLoad={handleLoad} draggable={false}
            style={{ display: "block", maxWidth: "100%", maxHeight: 320, borderRadius: 8 }}
          />
          {naturalAspect && (
            <div
              className="absolute pointer-events-none rounded-md"
              style={{
                left: `${box.left}%`, top: `${box.top}%`, width: `${box.width}%`, height: `${box.height}%`,
                border: "2px solid white", boxShadow: "0 0 0 1px rgba(0,0,0,.4), 0 0 0 2000px rgba(0,0,0,.35)",
              }}
            />
          )}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>The boxed area is roughly what stays visible on the dashboard/event cards. Click to move it.</p>
        {(focalX !== 50 || focalY !== 50) && (
          <button type="button" onClick={() => onChangeFocal(50, 50)} className="whmi-btn-ghost !py-1 !px-2 text-[10.5px] shrink-0">Reset to Center</button>
        )}
      </div>
    </div>
  );
}
