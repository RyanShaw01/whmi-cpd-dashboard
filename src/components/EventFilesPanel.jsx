import { useState, useEffect, useRef } from "react";
import { Paperclip, Upload, Trash2, FileText } from "lucide-react";
import { fetchEventFiles, uploadEventFile, deleteEventFile } from "../lib/db";
import { supabaseConfigured } from "../lib/supabaseClient";
import { pdfFirstPageToPngFile } from "../lib/pdfPreview";

const KINDS = [
  { id: "flyer", label: "Promotional Flyer" },
  { id: "slides", label: "Presentation Slides" },
  { id: "handout", label: "Handouts" },
  { id: "supporting", label: "Supporting File" },
];

export default function EventFilesPanel({ eventId, uploadedBy, onFilesChange, readOnly = false }) {
  const [files, setFiles] = useState([]);
  const [busyKind, setBusyKind] = useState(null);
  const inputRefs = useRef({});

  useEffect(() => {
    if (!eventId) return;
    fetchEventFiles(eventId).then(setFiles);
  }, [eventId]);

  const handlePick = (kind) => inputRefs.current[kind]?.click();

  const handleFile = async (kind, e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusyKind(kind);
    const saved = await uploadEventFile({ eventId, kind, file, uploadedBy });
    if (saved) setFiles(prev => [...prev, saved]);
    // A PDF flyer can't be used as an image banner as-is; auto-render its first page to a
    // PNG and upload that alongside, so admins don't have to separately create/upload an
    // image version themselves just to get the banner.
    if (kind === "flyer" && file.type === "application/pdf") {
      try {
        const pngFile = await pdfFirstPageToPngFile(file);
        if (pngFile) {
          const savedPreview = await uploadEventFile({ eventId, kind, file: pngFile, uploadedBy });
          if (savedPreview) setFiles(prev => [...prev, savedPreview]);
        }
      } catch (err) {
        console.error("PDF preview render failed", err);
      }
    }
    setBusyKind(null);
    onFilesChange?.();
  };

  const handleDelete = async (file) => {
    setFiles(prev => prev.filter(f => f.id !== file.id));
    await deleteEventFile(file, uploadedBy);
    onFilesChange?.();
  };

  if (!eventId) {
    return <p className="text-[12px]" style={{ color: "var(--text-faint)" }}>Save the event first to attach files.</p>;
  }
  if (!supabaseConfigured) {
    return <p className="text-[12px]" style={{ color: "var(--text-faint)" }}>File uploads need Supabase configured (Phase 1); connect a project to enable this.</p>;
  }

  return (
    <div className="space-y-3">
      {KINDS.map(k => {
        const kindFiles = files.filter(f => f.kind === k.id);
        if (readOnly && kindFiles.length === 0) return null;
        return (
          <div key={k.id}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11.5px] font-semibold" style={{ color: "var(--text-dim)" }}>{k.label}</span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => handlePick(k.id)}
                  disabled={busyKind === k.id}
                  className="whmi-btn-ghost !py-1 !px-2 text-[11px] flex items-center gap-1"
                >
                  <Upload size={11} />{busyKind === k.id ? "Uploading…" : "Upload"}
                </button>
              )}
              {!readOnly && <input ref={el => (inputRefs.current[k.id] = el)} type="file" className="hidden" onChange={e => handleFile(k.id, e)} />}
            </div>
            {kindFiles.length === 0 ? (
              <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>No file uploaded.</p>
            ) : (
              <div className="space-y-1">
                {kindFiles.map(f => (
                  <div key={f.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg" style={{ background: "var(--surface-2)" }}>
                    <a href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 min-w-0 text-[11.5px] font-semibold" style={{ color: "var(--accent-primary)" }}>
                      <FileText size={12} className="shrink-0" /><span className="truncate">{f.storagePath.split("/").pop()}</span>
                    </a>
                    {!readOnly && <button type="button" onClick={() => handleDelete(f)} className="shrink-0" style={{ color: "#D9534F" }}><Trash2 size={13} /></button>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      {readOnly && files.length === 0 && <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>No files have been added for this event.</p>}
      {!readOnly && <p className="text-[10.5px] flex items-center gap-1" style={{ color: "var(--text-faint)" }}><Paperclip size={10} />Files are stored in Supabase Storage and linked to this event.</p>}
    </div>
  );
}
