// A thin grip on a modal's right edge for dragging it wider - see useResizableWidth. Only ever
// rendered when that hook's isDesktop is true, so this never shows up on mobile/tablet.
export default function ModalResizeHandle({ onMouseDown, dragging }) {
  return (
    <div
      onMouseDown={onMouseDown}
      title="Drag to resize"
      className="absolute top-0 right-0 h-full flex items-center justify-center z-20 transition"
      style={{ width: 10, marginRight: -5, cursor: "ew-resize" }}
    >
      <div
        className="rounded-full transition"
        style={{ width: 4, height: 44, background: dragging ? "var(--accent-primary)" : "var(--border)" }}
        onMouseEnter={e => { if (!dragging) e.currentTarget.style.background = "var(--accent-secondary)"; }}
        onMouseLeave={e => { if (!dragging) e.currentTarget.style.background = "var(--border)"; }}
      />
    </div>
  );
}
