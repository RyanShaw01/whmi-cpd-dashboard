// A thin grip on a modal's edge for dragging it bigger - see useResizableWidth. Only ever
// rendered when that hook's isDesktop is true, so this never shows up on mobile/tablet.
// `axis="x"` (default) sits on the right edge and resizes width; `axis="y"` sits on the bottom
// edge and resizes height.
export default function ModalResizeHandle({ onMouseDown, dragging, axis = "x" }) {
  const isX = axis === "x";
  return (
    <div
      onMouseDown={onMouseDown}
      title="Drag to resize"
      className={isX ? "absolute top-0 right-0 h-full flex items-center justify-center z-20 transition" : "absolute bottom-0 left-0 w-full flex items-center justify-center z-20 transition"}
      style={isX ? { width: 10, marginRight: -5, cursor: "ew-resize" } : { height: 10, marginBottom: -5, cursor: "ns-resize" }}
    >
      <div
        className="rounded-full transition"
        style={isX ? { width: 4, height: 44, background: dragging ? "var(--accent-primary)" : "var(--border)" } : { height: 4, width: 44, background: dragging ? "var(--accent-primary)" : "var(--border)" }}
        onMouseEnter={e => { if (!dragging) e.currentTarget.style.background = "var(--accent-secondary)"; }}
        onMouseLeave={e => { if (!dragging) e.currentTarget.style.background = "var(--border)"; }}
      />
    </div>
  );
}
