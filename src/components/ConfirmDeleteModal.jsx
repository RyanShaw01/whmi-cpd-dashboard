import { AlertTriangle } from "lucide-react";

export default function ConfirmDeleteModal({ request, onCancel, onConfirm }) {
  if (!request) return null;
  const title = request.title || "Confirm Deletion";
  const message = request.label ? `Are you sure you want to delete ${request.label}?` : request.message;
  const confirmLabel = request.confirmLabel || "Delete";
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.5)" }} onClick={onCancel}>
      <div className="whmi-card w-full max-w-sm p-5 whmi-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={18} style={{ color: "#D9534F" }} />
          <h2 className="disp text-[15px] font-extrabold">{title}</h2>
        </div>
        <p className="text-[13px] mb-5" style={{ color: "var(--text-dim)" }}>{message}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="whmi-btn-ghost flex-1">Cancel</button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-[9px] py-2 font-extrabold text-[13px] text-white"
            style={{ background: "#D9534F" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
