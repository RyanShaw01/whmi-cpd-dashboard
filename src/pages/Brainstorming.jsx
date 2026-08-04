import { useState } from "react";
import { Lightbulb, Plus, Trash2, ChevronDown, ChevronRight, QrCode, User } from "lucide-react";
import EventQRCode from "../components/EventQRCode";
import { relativeTime } from "../lib/helpers";

export default function Brainstorming({ ideas, onAddIdea, onRequestDeleteIdea }) {
  const [content, setContent] = useState("");
  const [listExpanded, setListExpanded] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    onAddIdea(content.trim());
    setContent("");
  };

  const submitUrl = `${window.location.origin}/brainstorm/submit`;

  return (
    <div className="whmi-fade-in p-6 max-w-[900px] mx-auto space-y-5">
      <div>
        <h1 className="disp text-[22px] font-extrabold flex items-center gap-2"><Lightbulb size={20} style={{ color: "var(--accent-primary)" }} />Brainstorming</h1>
        <p className="text-[13px]" style={{ color: "var(--text-dim)" }}>A shared space for admins and owners to jot down ideas for future CPD activities — types, subjects, presenters, external workshops, locations, and more.</p>
      </div>

      <div className="whmi-card p-4">
        <button onClick={() => setShareOpen(x => !x)} className="w-full flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            {shareOpen ? <ChevronDown size={13} style={{ color: "var(--text-faint)" }} /> : <ChevronRight size={13} style={{ color: "var(--text-faint)" }} />}
            <QrCode size={15} style={{ color: "var(--accent-primary)" }} /><div className="font-semibold text-[13px]">Collect Ideas From Staff</div>
          </div>
        </button>
        {shareOpen && (
          <div className="mt-2 max-w-xs">
            <p className="text-[11.5px] mb-3" style={{ color: "var(--text-faint)" }}>Share this link or QR code so staff can submit their own CPD ideas without logging in. Submissions are added to the list below, tagged with their name.</p>
            <EventQRCode event={{ id: "brainstorm", title: "Brainstorming Ideas" }} url={submitUrl} filenameSuffix="idea-form" />
          </div>
        )}
      </div>

      <div className="whmi-card p-4">
        <button onClick={() => setListExpanded(x => !x)} className="w-full flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            {listExpanded ? <ChevronDown size={13} style={{ color: "var(--text-faint)" }} /> : <ChevronRight size={13} style={{ color: "var(--text-faint)" }} />}
            <Lightbulb size={15} style={{ color: "var(--accent-primary)" }} /><div className="font-semibold text-[13px]">Idea List</div>
          </div>
          <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>{ideas.length}</span>
        </button>
        {listExpanded && (
          <>
            <form onSubmit={submit} className="flex gap-1.5 mb-3 mt-2">
              <input value={content} onChange={e => setContent(e.target.value)} placeholder="e.g. Ultrasound-guided procedures workshop with Radiology" className="whmi-input flex-1 px-2.5 py-2 text-[12.5px]" />
              <button type="submit" className="whmi-btn-primary flex items-center gap-1.5 shrink-0"><Plus size={14} />Add</button>
            </form>
            <div className="space-y-1.5">
              {ideas.map(idea => (
                <div key={idea.id} className="flex items-start justify-between gap-2 p-2.5 rounded-lg" style={{ background: "var(--surface-2)" }}>
                  <div className="min-w-0 flex gap-2">
                    <span style={{ color: "var(--text-faint)" }}>•</span>
                    <div className="min-w-0">
                      <div className="text-[12.5px] break-words">{idea.content}</div>
                      <div className="text-[10.5px] flex items-center gap-1 mt-0.5" style={{ color: "var(--text-faint)" }}>
                        <User size={10} />{idea.addedByName}{idea.source === "public" && <span className="whmi-badge" style={{ background: "rgba(53,168,221,.12)", color: "var(--accent-secondary)" }}>Staff submission</span>}
                        <span>· {relativeTime(idea.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => onRequestDeleteIdea(idea)} className="whmi-btn-ghost !p-1.5 shrink-0" style={{ color: "#D9534F" }}><Trash2 size={13} /></button>
                </div>
              ))}
              {ideas.length === 0 && <div className="text-[12px]" style={{ color: "var(--text-faint)" }}>No ideas yet — add one above, or share the staff submission link.</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
