import { useState, useEffect, useCallback, useRef } from "react";

// Below this, dragging is disabled entirely and the modal just uses its normal responsive
// width - there's no useful "wider" on a phone/tablet screen, and a drag handle would just be
// something to fat-finger by accident.
const DESKTOP_BREAKPOINT = 900;

// Lets a modal remember a wider-than-default width the user drags it to, per modal "kind"
// (storageKey), persisted in localStorage so it stays wide next time they open one. Never lets
// the width go below `defaultWidthPx` - that's the floor, not just the initial value, so it also
// clamps a stale saved width down if the default itself grows later (e.g. a banner appears).
export function useResizableWidth(storageKey, defaultWidthPx) {
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== "undefined" && window.innerWidth >= DESKTOP_BREAKPOINT);
  const [width, setWidth] = useState(() => {
    if (typeof window === "undefined") return defaultWidthPx;
    const saved = Number(window.localStorage.getItem(storageKey));
    return saved > defaultWidthPx ? saved : defaultWidthPx;
  });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(null);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // A previously-saved width should never render smaller than today's default (e.g. this same
  // event now has a banner, raising the default) - re-clamp whenever the default changes.
  useEffect(() => { setWidth(w => Math.max(w, defaultWidthPx)); }, [defaultWidthPx]);

  const startResize = useCallback((e) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startWidth: width };
    setDragging(true);
    const onMove = (ev) => {
      if (!dragRef.current) return;
      // The handle sits on the modal's right edge and the modal is horizontally centred, so
      // growing the box by `delta` only moves the visible edge by `delta / 2`. Doubling the
      // delta here makes the edge track the cursor 1:1, like dragging a real window edge.
      const delta = (ev.clientX - dragRef.current.startX) * 2;
      const maxWidth = window.innerWidth - 32;
      const next = Math.min(maxWidth, Math.max(defaultWidthPx, dragRef.current.startWidth + delta));
      setWidth(next);
    };
    const onUp = () => {
      dragRef.current = null;
      setDragging(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setWidth(w => { window.localStorage.setItem(storageKey, String(w)); return w; });
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [width, defaultWidthPx, storageKey]);

  return { width: isDesktop ? width : null, isDesktop, dragging, startResize };
}
