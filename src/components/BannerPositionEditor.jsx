import { useRef, useState, useEffect, useCallback } from "react";
import { Trash2 } from "lucide-react";

// A representative "wide strip" ratio for the crop-box preview — the shortest/most
// crop-sensitive banner placements (Up Next, Upcoming Events cards) are all this shape.
// It's an approximate guide, not pixel-exact for every placement the banner appears in.
const TARGET_ASPECT = 3.4;
const MIN_ZOOM = 1;
const MAX_ZOOM = 2.5;

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

// Shows the FULL, uncropped flyer image (so nothing is hidden) with a draggable, resizable
// overlay box showing roughly what will stay visible once it's cropped to a banner strip.
// Drag the box to move it, drag the corner handle to shrink/grow it (zoom). Changes are
// applied live while dragging and only persisted (via onChangeCrop) on release.
export default function BannerPositionEditor({ bannerUrl, focalX = 50, focalY = 50, zoom = 1, onChangeCrop, onRemove }) {
  const containerRef = useRef(null);
  const [naturalAspect, setNaturalAspect] = useState(null);
  const [local, setLocal] = useState({ focalX, focalY, zoom });
  const localRef = useRef(local);
  const dragRef = useRef(null); // { mode: "move" | "resize" } | null

  useEffect(() => { localRef.current = local; }, [local]);

  useEffect(() => {
    if (!dragRef.current) setLocal({ focalX, focalY, zoom });
  }, [focalX, focalY, zoom]);

  const handleLoad = (e) => setNaturalAspect(e.target.naturalWidth / e.target.naturalHeight);

  // Base box size at zoom=1 (the largest the crop box can be, i.e. the full un-zoomed crop).
  const wide = naturalAspect != null && naturalAspect >= TARGET_ASPECT;
  const baseDimPct = naturalAspect
    ? (wide ? Math.min(100, (TARGET_ASPECT / naturalAspect) * 100) : Math.min(100, (naturalAspect / TARGET_ASPECT) * 100))
    : 100;

  let box = { left: 0, top: 0, width: 100, height: 100 };
  if (naturalAspect) {
    const dimPct = clamp(baseDimPct / local.zoom, 2, 100);
    if (wide) {
      box = { width: dimPct, height: 100, top: 0, left: clamp(local.focalX - dimPct / 2, 0, 100 - dimPct) };
    } else {
      box = { width: 100, height: dimPct, left: 0, top: clamp(local.focalY - dimPct / 2, 0, 100 - dimPct) };
    }
  }

  const pctFromEvent = useCallback((e) => {
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100),
    };
  }, []);

  const commit = (next) => onChangeCrop(Math.round(next.focalX), Math.round(next.focalY), Math.round(next.zoom * 100) / 100);
  const activeListenersRef = useRef(null);

  // Listeners are attached fresh on every drag start (rather than once via a useEffect keyed
  // on rarely-changing values) so they always close over the current wide/baseDimPct/onChangeCrop
  // — a stale, mount-time-frozen closure here would keep committing against outdated data on
  // every drag after the first.
  const beginDrag = (mode) => (e) => {
    e.preventDefault();
    if (mode === "resize") e.stopPropagation();
    if (!naturalAspect) return;
    dragRef.current = { mode };
    if (mode === "move") {
      const p = pctFromEvent(e);
      setLocal(l => ({ ...l, focalX: p.x, focalY: p.y }));
    }

    const handleMove = (ev) => {
      if (!dragRef.current) return;
      const p = pctFromEvent(ev);
      if (dragRef.current.mode === "move") {
        setLocal(l => ({ ...l, focalX: p.x, focalY: p.y }));
      } else {
        // Distance from the box's current center to the pointer drives the box size:
        // dragging outward grows the box (zooms out toward 1), inward shrinks it (zooms in).
        const centerX = wide ? localRef.current.focalX : 50;
        const centerY = wide ? 50 : localRef.current.focalY;
        const distPct = wide ? Math.abs(p.x - centerX) * 2 : Math.abs(p.y - centerY) * 2;
        const dimPct = clamp(distPct, baseDimPct / MAX_ZOOM, baseDimPct);
        const newZoom = clamp(baseDimPct / dimPct, MIN_ZOOM, MAX_ZOOM);
        setLocal(l => ({ ...l, zoom: newZoom }));
      }
    };
    const handleUp = () => {
      dragRef.current = null;
      activeListenersRef.current = null;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      commit(localRef.current);
    };
    activeListenersRef.current = { handleMove, handleUp };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  // If the component unmounts mid-drag (e.g. the modal is closed while dragging), remove the
  // listeners without committing — there's no longer anywhere to commit to.
  useEffect(() => () => {
    if (activeListenersRef.current) {
      window.removeEventListener("pointermove", activeListenersRef.current.handleMove);
      window.removeEventListener("pointerup", activeListenersRef.current.handleUp);
    }
  }, []);

  const resetView = () => {
    const next = { focalX: 50, focalY: 50, zoom: 1 };
    setLocal(next);
    onChangeCrop(50, 50, 1);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Banner Position</label>
        <button type="button" onClick={onRemove} className="whmi-btn-ghost !py-1 !px-2 text-[11px] flex items-center gap-1" style={{ color: "#D9534F" }}>
          <Trash2 size={11} />Remove Banner
        </button>
      </div>
      <div className="flex justify-center p-2 rounded-lg" style={{ background: "var(--surface-2)" }}>
        <div ref={containerRef} className="relative inline-block overflow-hidden rounded-lg select-none">
          <img
            src={bannerUrl} alt="" onLoad={handleLoad} draggable={false}
            style={{ display: "block", maxWidth: "100%", maxHeight: 320, borderRadius: 8 }}
          />
          {naturalAspect && (
            <div
              onPointerDown={beginDrag("move")}
              className="absolute rounded-md cursor-move"
              style={{
                left: `${box.left}%`, top: `${box.top}%`, width: `${box.width}%`, height: `${box.height}%`,
                border: "2px solid white", boxShadow: "0 0 0 1px rgba(0,0,0,.4), 0 0 0 2000px rgba(0,0,0,.35)",
              }}
            >
              <div
                onPointerDown={beginDrag("resize")}
                className="absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full cursor-nwse-resize"
                style={{ background: "white", border: "2px solid var(--accent-primary)" }}
                title="Drag to resize"
              />
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>Drag the box to move it, drag the corner to resize.</p>
        {(local.focalX !== 50 || local.focalY !== 50 || local.zoom !== 1) && (
          <button type="button" onClick={resetView} className="whmi-btn-ghost !py-1 !px-2 text-[10.5px] shrink-0">Reset</button>
        )}
      </div>
    </div>
  );
}
