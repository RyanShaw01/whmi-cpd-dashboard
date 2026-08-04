import { useState } from "react";
import { X, Lightbulb, CheckCircle2 } from "lucide-react";
import { BRAINSTORM_CATEGORIES } from "../lib/brainstormCategories";

export default function SuggestIdeaModal({ session, onClose, onSubmit }) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("topic");
  const [submitted, setSubmitted] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSubmit(content.trim(), category);
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.5)" }} onClick={onClose}>
      <div className="whmi-card w-full max-w-md whmi-fade-in" onClick={e => e.stopPropagation()}>
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="disp text-[16px] font-extrabold flex items-center gap-2"><Lightbulb size={17} style={{ color: "var(--accent-primary)" }} />Suggest a CPD Idea</h2>
          <button onClick={onClose} className="whmi-btn-ghost !p-2"><X size={14} /></button>
        </div>
        <div className="p-5">
          {submitted ? (
            <div className="whmi-card p-4 flex items-center gap-2" style={{ color: "var(--accent-success)" }}>
              <CheckCircle2 size={18} /><span className="font-semibold text-[13.5px]">Thanks! Your idea has been added to the WHMI Education Team's brainstorm list.</span>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <p className="text-[12px]" style={{ color: "var(--text-faint)" }}>Got a CPD type, subject, presenter, external workshop, or location you'd like to see run? Let us know.</p>
              <div>
                <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Your Idea</label>
                <textarea required autoFocus value={content} onChange={e => setContent(e.target.value)} rows={4} placeholder="e.g. A hands-on workshop on ultrasound-guided procedures with Radiology" className="whmi-input w-full px-2.5 py-2 mt-1 resize-none" />
              </div>
              <div>
                <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>What kind of idea is this?</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1">
                  {BRAINSTORM_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <button type="submit" className="whmi-btn-primary w-full">Submit Idea</button>
              <p className="text-[10.5px] text-center" style={{ color: "var(--text-faint)" }}>Submitting as {session?.name || "you"}.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
