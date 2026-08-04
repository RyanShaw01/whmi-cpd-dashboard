import { useState } from "react";
import { X, Lightbulb, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { BRAINSTORM_CATEGORIES } from "../lib/brainstormCategories";

export default function SuggestIdeaModal({ session, onClose, onSubmit }) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("topic");
  const [drafts, setDrafts] = useState([]); // ideas queued before the final submit
  const [submitted, setSubmitted] = useState(false);

  const categoryLabel = (id) => BRAINSTORM_CATEGORIES.find(c => c.id === id)?.label || id;

  const addAnother = () => {
    if (!content.trim()) return;
    setDrafts(d => [...d, { content: content.trim(), category }]);
    setContent("");
  };
  const removeDraft = (i) => setDrafts(d => d.filter((_, idx) => idx !== i));

  const submitAll = (e) => {
    e.preventDefault();
    const all = [...drafts, ...(content.trim() ? [{ content: content.trim(), category }] : [])];
    if (all.length === 0) return;
    onSubmit(all);
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.5)" }} onClick={onClose}>
      <div className="whmi-card w-full max-w-md max-h-[85vh] overflow-y-auto whmi-scroll whmi-fade-in" onClick={e => e.stopPropagation()}>
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="disp text-[16px] font-extrabold flex items-center gap-2"><Lightbulb size={17} style={{ color: "var(--accent-primary)" }} />Suggest CPD Ideas</h2>
          <button onClick={onClose} className="whmi-btn-ghost !p-2"><X size={14} /></button>
        </div>
        <div className="p-5">
          {submitted ? (
            <div className="whmi-card p-4 flex items-center gap-2" style={{ color: "var(--accent-success)" }}>
              <CheckCircle2 size={18} /><span className="font-semibold text-[13.5px]">Thanks! Your idea{drafts.length > 0 ? "s have" : " has"} been added to the WHMI Education Team's brainstorm list.</span>
            </div>
          ) : (
            <form onSubmit={submitAll} className="space-y-3">
              <p className="text-[12px]" style={{ color: "var(--text-faint)" }}>Got a CPD type, subject, presenter, external workshop, or location you'd like to see run? Add as many as you like, then submit them all at once.</p>

              {drafts.length > 0 && (
                <div className="space-y-1.5">
                  {drafts.map((d, i) => (
                    <div key={i} className="flex items-start justify-between gap-2 p-2.5 rounded-lg" style={{ background: "var(--surface-2)" }}>
                      <div className="min-w-0">
                        <div className="text-[12px] break-words">{d.content}</div>
                        <div className="text-[10.5px] mt-0.5" style={{ color: "var(--text-faint)" }}>{categoryLabel(d.category)}</div>
                      </div>
                      <button type="button" onClick={() => removeDraft(i)} className="whmi-btn-ghost !p-1.5 shrink-0" style={{ color: "#D9534F" }}><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>{drafts.length > 0 ? "Next Idea" : "Your Idea"}</label>
                <textarea autoFocus value={content} onChange={e => setContent(e.target.value)} rows={3} placeholder="e.g. A hands-on workshop on ultrasound-guided procedures with Radiology" className="whmi-input w-full px-2.5 py-2 mt-1 resize-none" />
              </div>
              <div>
                <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>What kind of idea is this?</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1">
                  {BRAINSTORM_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <button type="button" onClick={addAnother} disabled={!content.trim()} className="whmi-btn-ghost w-full flex items-center justify-center gap-1.5" style={{ opacity: content.trim() ? 1 : 0.5 }}>
                <Plus size={13} />Add Another Idea
              </button>
              <button type="submit" disabled={drafts.length === 0 && !content.trim()} className="whmi-btn-primary w-full" style={{ opacity: (drafts.length === 0 && !content.trim()) ? 0.5 : 1 }}>
                Submit {drafts.length + (content.trim() ? 1 : 0) > 1 ? `All ${drafts.length + (content.trim() ? 1 : 0)} Ideas` : "Idea"}
              </button>
              <p className="text-[10.5px] text-center" style={{ color: "var(--text-faint)" }}>Submitting as {session?.name || "you"}.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
