import { useState } from "react";
import { X } from "lucide-react";
import EventForm from "./EventForm";

export default function EventFormModal({ open, onClose, event, onSave, uploadedBy, cpdTypes, tags, onSaveTag, initialStatus }) {
  const [dirty, setDirty] = useState(false);
  if (!open) return null;

  const attemptClose = () => {
    if (dirty && !window.confirm("You have unsaved changes. Are you sure you want to leave without saving?")) return;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.5)" }} onClick={attemptClose}>
      <div className="whmi-card w-full max-w-3xl max-h-[85vh] overflow-y-auto whmi-scroll whmi-fade-in" onClick={e => e.stopPropagation()}>
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="disp text-[16px] font-extrabold">{event ? "Edit Event" : "New Event"}</h2>
          <button onClick={attemptClose} className="whmi-btn-ghost !p-2"><X size={14} /></button>
        </div>
        <div className="p-5">
          <EventForm event={event} onSave={(payload) => { onSave(payload); onClose(); }} onCancel={attemptClose} onDirtyChange={setDirty} uploadedBy={uploadedBy} cpdTypes={cpdTypes} tags={tags} onSaveTag={onSaveTag} initialStatus={initialStatus} />
        </div>
      </div>
    </div>
  );
}
