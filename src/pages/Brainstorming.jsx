import { useState } from "react";
import { Lightbulb, Plus, X, QrCode, User, ChevronDown, ChevronRight } from "lucide-react";
import EventQRCode from "../components/EventQRCode";
import { relativeTime } from "../lib/helpers";
import { BRAINSTORM_CATEGORIES } from "../lib/brainstormCategories";

export default function Brainstorming({ ideas, onAddIdea, onRequestDeleteIdea }) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("topic");
  const [shareOpen, setShareOpen] = useState(false);
  const [openCats, setOpenCats] = useState({});
  const isCatOpen = (id) => openCats[id] !== false;
  const toggleCat = (id) => setOpenCats(o => ({ ...o, [id]: !isCatOpen(id) }));

  const submit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    onAddIdea(content.trim(), category);
    setContent("");
  };

  const submitUrl = `${window.location.origin}/brainstorm/submit`;

  return (
    <div className="whmi-fade-in p-6 max-w-[900px] mx-auto space-y-5">
      <div>
        <h1 className="disp text-[22px] font-extrabold flex items-center gap-2"><Lightbulb size={20} style={{ color: "var(--accent-primary)" }} />CPD Brainstorming</h1>
        <p className="text-[13px]" style={{ color: "var(--text-dim)" }}>A shared space for admins and owners to jot down ideas for future CPD activities — types, subjects, presenters, external workshops, locations, and more.</p>
      </div>

      <div className="whmi-card p-4">
        <button onClick={() => setShareOpen(x => !x)} className="w-full flex items-center justify-between mb-1 -m-1 p-1 rounded-lg whmi-row-hover transition">
          <div className="flex items-center gap-2">
            {shareOpen ? <ChevronDown size={13} style={{ color: "var(--text-faint)" }} /> : <ChevronRight size={13} style={{ color: "var(--text-faint)" }} />}
            <QrCode size={15} style={{ color: "var(--accent-primary)" }} /><div className="font-semibold text-[13px]">Collect Ideas From Staff</div>
          </div>
        </button>
        {shareOpen && (
          <div className="mt-2 max-w-xl">
            <p className="text-[11.5px] mb-3" style={{ color: "var(--text-faint)" }}>Share this link or QR code so staff can submit their own CPD ideas without logging in. Submissions are added to the list below, tagged with their name.</p>
            <EventQRCode event={{ id: "brainstorm", title: "CPD Brainstorming Ideas" }} url={submitUrl} filenameSuffix="idea-form" layout="row" />
          </div>
        )}
      </div>

      <div className="whmi-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={15} style={{ color: "var(--accent-primary)" }} /><div className="font-semibold text-[13px]">Add an Idea</div>
        </div>
        <form onSubmit={submit} className="space-y-2">
          <input value={content} onChange={e => setContent(e.target.value)} placeholder="e.g. Ultrasound-guided procedures workshop with Radiology" className="whmi-input w-full px-2.5 py-2 text-[12.5px]" />
          <div className="flex gap-1.5 flex-wrap">
            <select value={category} onChange={e => setCategory(e.target.value)} className="whmi-input px-2.5 py-2 text-[12.5px]">
              {BRAINSTORM_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <button type="submit" className="whmi-btn-primary flex items-center gap-1.5"><Plus size={14} />Add Idea</button>
          </div>
        </form>
      </div>

      <div className="whmi-card overflow-x-auto whmi-scroll">
        <table className="w-full text-[13px]" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th className="text-left px-4 py-3 font-semibold text-[11.5px] uppercase tracking-wide w-[190px]" style={{ color: "var(--text-faint)" }}>Category</th>
              <th className="text-left px-4 py-3 font-semibold text-[11.5px] uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Ideas</th>
            </tr>
          </thead>
          <tbody>
            {BRAINSTORM_CATEGORIES.map(cat => {
              const catIdeas = ideas.filter(idea => (idea.category || "other") === cat.id);
              const Icon = cat.icon;
              const open = isCatOpen(cat.id);
              return (
                <tr key={cat.id} className="align-top" style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => toggleCat(cat.id)} className="flex items-center gap-1.5 font-semibold text-[12.5px] text-left -m-1 p-1 rounded-lg whmi-row-hover transition">
                      {open ? <ChevronDown size={13} style={{ color: "var(--text-faint)" }} className="shrink-0" /> : <ChevronRight size={13} style={{ color: "var(--text-faint)" }} className="shrink-0" />}
                      <Icon size={14} style={{ color: "var(--accent-primary)" }} className="shrink-0" />
                      <span className="whitespace-nowrap text-left">{cat.label}</span>
                    </button>
                    <div className="text-[11px] mt-0.5" style={{ color: "var(--text-faint)" }}>{catIdeas.length} idea{catIdeas.length === 1 ? "" : "s"}</div>
                  </td>
                  <td className="px-4 py-3">
                    {!open ? null : catIdeas.length === 0 ? (
                      <span className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>No ideas in this category yet.</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {catIdeas.map(idea => (
                          <div key={idea.id} className="group relative rounded-2xl px-3 py-2 max-w-[280px]" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                            <button onClick={() => onRequestDeleteIdea(idea)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition" style={{ background: "#D9534F" }} title="Delete idea">
                              <X size={11} color="white" />
                            </button>
                            <div className="text-[12px] break-words">{idea.content}</div>
                            <div className="text-[10px] mt-1.5 flex items-center gap-1 flex-wrap" style={{ color: "var(--text-faint)" }}>
                              <User size={9} />{idea.addedByName} · {relativeTime(idea.createdAt)}
                            </div>
                            {idea.source === "public" && <span className="whmi-badge mt-1" style={{ background: "rgba(53,168,221,.12)", color: "var(--accent-secondary)" }}>Public link</span>}
                            {idea.source === "member" && <span className="whmi-badge mt-1" style={{ background: "rgba(156,203,59,.15)", color: "#7CA82F" }}>Team suggestion</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
