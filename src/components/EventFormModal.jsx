import { X } from "lucide-react";
import EventForm from "./EventForm";

export default function EventFormModal({ open, onClose, event, onSave, uploadedBy, cpdTypes }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.5)" }} onClick={onClose}>
      <div className="whmi-card w-full max-w-lg max-h-[85vh] overflow-y-auto whmi-scroll whmi-fade-in" onClick={e => e.stopPropagation()}>
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="disp text-[16px] font-extrabold">{event ? "Edit Event" : "New Event"}</h2>
          <button onClick={onClose} className="whmi-btn-ghost !p-2"><X size={14} /></button>
        </div>
        <div className="p-5">
          <EventForm event={event} onSave={(payload) => { onSave(payload); onClose(); }} onCancel={onClose} uploadedBy={uploadedBy} cpdTypes={cpdTypes} />
        </div>
      </div>
    </div>
  );
}
