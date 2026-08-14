import { useState, useEffect, useCallback, useRef } from "react";

// Below this, dragging is disabled entirely and the modal just uses its normal responsive
// width/height - there's no useful "bigger" on a phone/tablet screen, and a drag handle would
// just be something to fat-finger by accident.
const DESKTOP_BREAKPOINT = 900;

// One resizable axis (width or height), factored out since both behave identically - just
// swapping which mouse coordinate/window dimension they read.
function useResizableAxis(storageKey, defaultSizePx, { clientPos, windowSize }) {
  const [size, setSize] = useState(() => {
    if (typeof window === "undefined") return defaultSizePx;
    const saved = Number(window.localStorage.getItem(storageKey));
    return saved > defaultSizePx ? saved : defaultSizePx;
  });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(null);

  // A previously-saved size should never render smaller than today's default (e.g. this same
  // event now has a banner, raising the default width) - re-clamp whenever the default changes.
  useEffect(() => { setSize(s => Math.max(s, defaultSizePx)); }, [defaultSizePx]);

  const startResize = useCallback((e) => {
    e.preventDefault();
    dragRef.current = { start: clientPos(e), startSize: size };
    setDragging(true);
    const onMove = (ev) => {
      if (!dragRef.current) return;
      // The handle sits on the modal's edge and the modal is centred on that axis, so growing
      // the box by `delta` only moves the visible edge by `delta / 2`. Doubling the delta here
      // makes the edge track the cursor 1:1, like dragging a real window edge.
      const delta = (clientPos(ev) - dragRef.current.start) * 2;
      const max = windowSize() - 32;
      const next = Math.min(max, Math.max(defaultSizePx, dragRef.current.startSize + delta));
      setSize(next);
    };
    const onUp = () => {
      dragRef.current = null;
      setDragging(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setSize(s => { window.localStorage.setItem(storageKey, String(s)); return s; });
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [size, defaultSizePx, storageKey, clientPos, windowSize]);

  return { size, dragging, startResize };
}

// Lets a modal remember a bigger-than-default width and/or height the user drags it to, per
// modal "kind" (storageKey), persisted in localStorage so it stays that size next time they open
// one. Never lets either dimension go below its default - that's the floor, not just the initial
// value, so it also clamps a stale saved size down if the default itself grows later (e.g. a
// banner appears, raising the default width).
export function useResizableWidth(storageKey, defaultWidthPx, defaultHeightPx) {
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== "undefined" && window.innerWidth >= DESKTOP_BREAKPOINT);
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Width keeps the original unsuffixed key (this hook resized width only, before height support
  // was added) so nobody's already-saved width gets reset by this change.
  const w = useResizableAxis(storageKey, defaultWidthPx, { clientPos: e => e.clientX, windowSize: () => window.innerWidth });
  // Height resizing is optional - most callers only pass a width - so the Y axis hook still runs
  // (hooks can't be conditional) but with a harmless default when unused.
  const h = useResizableAxis(`${storageKey}_h`, defaultHeightPx ?? 0, { clientPos: e => e.clientY, windowSize: () => window.innerHeight });

  return {
    width: isDesktop ? w.size : null,
    height: isDesktop && defaultHeightPx ? h.size : null,
    isDesktop,
    dragging: w.dragging || h.dragging,
    startResize: w.startResize,
    startResizeHeight: h.startResize,
  };
}
