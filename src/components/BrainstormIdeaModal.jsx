import { useState, useEffect } from "react";
import { X, Trash2, Save, Pencil, Lightbulb, User } from "lucide-react";
import { BRAINSTORM_CATEGORIES } from "../lib/brainstormCategories";
import { relativeTime } from "../lib/helpers";

export default function BrainstormIdeaModal({ idea, onClose, onSave, onRequestDelete }) {
  const [mode, setMode] = useState("view");
  const [content, setContent] = useState(idea?.content || "");
  const [category, setCategory] = useState(idea?.category || "other");
  const [addedByName, setAddedByName] = useState(idea?.addedByName || "");

  // Every time a (new) idea is opened, land on the read-only view first.
  useEffect(() => {
    if (!idea) return;
    setMode("view");
    setContent(idea.content || "");
    setCategory(idea.category || "other");
    setAddedByName(idea.addedByName || "");
  }, [idea]);

  if (!idea) return null;

  const cat = BRAINSTORM_CATEGORIES.find(c => c.id === (idea.category || "other"));
  const CatIcon = cat?.icon;

  const submit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSave(idea, { content: content.trim(), category, addedByName: addedByName.trim() || null });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.5)" }} onClick={onClose}>
      <div className="whmi-card w-full max-w-sm whmi-fade-in" onClick={e => e.stopPropagation()}>
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="disp text-[16px] font-extrabold flex items-center gap-2"><Lightbulb size={17} style={{ color: "var(--accent-primary)" }} />CPD Idea</h2>
          <button onClick={onClose} className="whmi-btn-ghost !p-2"><X size={14} /></button>
        </div>

        {mode === "view" ? (
          <div className="p-5 space-y-3">
            <div>
              <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Idea</label>
              <p className="text-[14px] mt-1 break-words leading-snug">{idea.content}</p>
            </div>
            <div>
              <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Category</label>
              <div className="flex items-center gap-1.5 mt-1 text-[13px] font-medium">
                {CatIcon && <CatIcon size={14} style={{ color: "var(--accent-primary)" }} />}
                {cat?.label || "Other"}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold flex items-center gap-1" style={{ color: "var(--text-faint)" }}><User size={11} />Proposed by</label>
              <div className="text-[13px] mt-1">{idea.addedByName || "Someone"}</div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] flex-wrap" style={{ color: "var(--text-faint)" }}>
              {relativeTime(idea.createdAt)}
              {idea.source === "public" && <span className="whmi-badge" style={{ background: "rgba(53,168,221,.12)", color: "var(--accent-secondary)" }}>Public link</span>}
              {idea.source === "member" && <span className="whmi-badge" style={{ background: "rgba(156,203,59,.15)", color: "#7CA82F" }}>Team suggestion</span>}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button" onClick={() => setMode("edit")}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-[13px] font-semibold transition"
                style={{ border: "1px solid var(--border)", color: "var(--text)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-2)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                <Pencil size={13} />Edit
              </button>
              <button
                type="button" onClick={() => { onRequestDelete(idea); onClose(); }}
                className="flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-[13px] font-semibold transition"
                style={{ border: "1px solid rgba(217,83,79,.4)", color: "#D9534F" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(217,83,79,.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                <Trash2 size={13} />Delete
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 space-y-3">
            <div>
              <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Idea</label>
              <textarea required autoFocus value={content} onChange={e => setContent(e.target.value)} rows={3} className="whmi-input w-full px-2.5 py-2 mt-1 resize-none" />
            </div>
            <div>
              <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1">
                {BRAINSTORM_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold flex items-center gap-1" style={{ color: "var(--text-faint)" }}><User size={11} />Proposed by</label>
              <input value={addedByName} onChange={e => setAddedByName(e.target.value)} placeholder="Someone" className="whmi-input w-full px-2.5 py-1.5 mt-1 text-[12.5px]" />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" className="whmi-btn-primary flex-1 flex items-center justify-center gap-1.5"><Save size={13} />Save</button>
              <button type="button" onClick={() => setMode("view")} className="whmi-btn-ghost flex items-center justify-center gap-1.5">Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
