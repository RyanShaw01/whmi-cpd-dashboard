import { useState } from "react";
import { Link } from "react-router-dom";
import { Lightbulb, CheckCircle2 } from "lucide-react";
import { BRAINSTORM_CATEGORIES } from "../lib/brainstormCategories";

export default function BrainstormSubmitPage({ session, onSubmit }) {
  const [name, setName] = useState(session?.name || "");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("topic");
  const [submitted, setSubmitted] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    onSubmit(content.trim(), name.trim(), category);
    setSubmitted(true);
    setContent("");
  };

  return (
    <div className="whmi-root light min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-lg mx-auto p-6 space-y-5">
        <Link to="/" className="whmi-logo-full block mx-auto" style={{ width: 150, height: 77 }} />

        <div className="whmi-card overflow-hidden">
          <div className="h-32 flex items-center justify-center relative" style={{ background: "var(--accent-primary)" }}>
            <Lightbulb size={34} color="white" />
          </div>
          <div className="p-6 space-y-4">
            <div>
              <h1 className="disp text-[20px] font-extrabold">Got a CPD Idea?</h1>
              <p className="text-[13px] mt-1" style={{ color: "var(--text-faint)" }}>Suggest a CPD type, subject, presenter, external workshop, location, or anything else you'd like to see run. No login required — the WHMI Education Team reviews every submission.</p>
            </div>

            {submitted ? (
              <div className="whmi-card p-4 flex items-center gap-2" style={{ color: "var(--accent-success)" }}>
                <CheckCircle2 size={18} /><span className="font-semibold text-[13.5px]">Thanks! Your idea has been added.</span>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Your Name</label>
                  <input required disabled={!!session} value={name} onChange={e => setName(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Your Idea</label>
                  <textarea required value={content} onChange={e => setContent(e.target.value)} rows={4} placeholder="e.g. A hands-on workshop on ultrasound-guided procedures with Radiology" className="whmi-input w-full px-2.5 py-2 mt-1 resize-none" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>What kind of idea is this?</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1">
                    {BRAINSTORM_CATEGORIES.filter(c => c.id !== "other").map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    <option value="other">Other</option>
                  </select>
                </div>
                <button type="submit" className="whmi-btn-primary w-full">Submit Idea</button>
              </form>
            )}
            {submitted && (
              <button onClick={() => setSubmitted(false)} className="whmi-btn-ghost w-full">Submit Another Idea</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
