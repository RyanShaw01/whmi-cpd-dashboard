import { useState, useMemo } from "react";
import { NotebookPen, Plus, ChevronDown, ChevronRight, Trash2, Mail, X, Save, Building2 } from "lucide-react";
import { REFLECTION_SECTIONS, REFLECTION_SHORT_FORM } from "../data/reflectionTemplate";
import { fmtDate } from "../lib/helpers";
import AdminReflectionsOverview from "../components/AdminReflectionsOverview";

const SEPARATE_WH_STORAGE_KEY = "whmi_reflection_separate_wh";
export const getSeparateWhDefault = () => {
  try { const v = localStorage.getItem(SEPARATE_WH_STORAGE_KEY); return v === null ? true : v === "true"; } catch { return true; }
};
export const setSeparateWhDefault = (value) => {
  try { localStorage.setItem(SEPARATE_WH_STORAGE_KEY, String(value)); } catch { /* ignore */ }
};

const SORT_OPTIONS = [
  { id: "date-desc", label: "Event Date (Newest - Oldest)" },
  { id: "date-asc", label: "Event Date (Oldest - Newest)" },
  { id: "alpha-asc", label: "Alphabetical (A - Z)" },
  { id: "alpha-desc", label: "Alphabetical (Z - A)" },
];

function AddReflectionForm({ onCancel, onSubmit }) {
  const [activityName, setActivityName] = useState("");
  const [activityDate, setActivityDate] = useState("");
  const [mode, setMode] = useState("full"); // full | short | freeform
  const [answers, setAnswers] = useState({}); // { "sectionId::question": text }
  const [freeformText, setFreeformText] = useState("");
  // Full Template starts fully collapsed (20 questions is a lot to see at once); Short Form
  // starts fully open since it's just the one small section.
  const [expanded, setExpanded] = useState({});

  const sections = mode === "short" ? [REFLECTION_SHORT_FORM] : REFLECTION_SECTIONS;
  const setAnswer = (key, value) => setAnswers(a => ({ ...a, [key]: value }));
  const toggleSection = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));
  const chooseMode = (m) => {
    setMode(m);
    setExpanded(m === "short" ? { [REFLECTION_SHORT_FORM.id]: true } : {});
  };

  const submit = (e) => {
    e.preventDefault();
    if (!activityName.trim() || !activityDate) return;
    onSubmit({ activityName: activityName.trim(), activityDate, mode, answers, freeformText: freeformText.trim() });
  };

  return (
    <form onSubmit={submit} className="whmi-card p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Activity Name</label>
          <input required autoFocus value={activityName} onChange={e => setActivityName(e.target.value)} placeholder="e.g. ASMIRT National Conference" className="whmi-input w-full px-2.5 py-2 mt-1" />
        </div>
        <div>
          <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Activity Date</label>
          <input required type="date" value={activityDate} onChange={e => setActivityDate(e.target.value)} className="whmi-input w-full px-2.5 py-2 mt-1" />
        </div>
      </div>

      <div>
        <label className="text-[11px] font-semibold block mb-1" style={{ color: "var(--text-faint)" }}>Format</label>
        <div className="flex gap-2">
          {[{ id: "full", label: "Full Template" }, { id: "short", label: "Short Form" }, { id: "freeform", label: "Freestyle" }].map(o => (
            <button
              key={o.id} type="button" onClick={() => chooseMode(o.id)}
              className="flex-1 !py-1.5 text-[12px] font-semibold rounded-lg transition"
              style={mode === o.id
                ? { background: "var(--accent-success)", color: "white", border: "1px solid var(--accent-success)" }
                : { background: "var(--surface-2)", color: "var(--text-dim)", border: "1px solid var(--border)" }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {mode === "freeform" ? (
        <div>
          <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Your Reflection</label>
          <textarea value={freeformText} onChange={e => setFreeformText(e.target.value)} rows={8} placeholder="Write freely about what you learned and how you'll apply it..." className="whmi-input w-full px-2.5 py-2 mt-1 resize-none" />
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>Click into any section to answer as many or as few questions as you like.</p>
          {sections.map(section => (
            <div key={section.id} className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <button type="button" onClick={() => toggleSection(section.id)} className="w-full flex items-center justify-between p-2.5" style={{ background: "var(--surface-2)" }}>
                <div className="flex items-center gap-2">
                  {expanded[section.id] ? <ChevronDown size={13} style={{ color: "var(--text-faint)" }} /> : <ChevronRight size={13} style={{ color: "var(--text-faint)" }} />}
                  <span className="font-semibold text-[12.5px]">{section.label}</span>
                </div>
                <span className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>
                  {section.questions.filter(q => (answers[`${section.id}::${q}`] || "").trim()).length}/{section.questions.length} answered
                </span>
              </button>
              {expanded[section.id] && (
                <div className="p-2.5 space-y-2.5">
                  {section.questions.map(q => (
                    <div key={q}>
                      <label className="text-[11.5px] font-medium block mb-1">{q}</label>
                      <textarea
                        value={answers[`${section.id}::${q}`] || ""} onChange={e => setAnswer(`${section.id}::${q}`, e.target.value)}
                        rows={2} className="whmi-input w-full px-2.5 py-1.5 text-[12.5px] resize-none"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="flex-1 flex items-center justify-center gap-1.5 font-semibold rounded-lg py-2 transition"
          style={{ background: "var(--accent-success)", color: "white" }}
        >
          <Save size={13} />Save Reflection
        </button>
        <button type="button" onClick={onCancel} className="whmi-btn-ghost flex-1 flex items-center justify-center gap-1.5"><X size={13} />Cancel</button>
      </div>
    </form>
  );
}

function personalToDisplaySections(r) {
  if (r.mode === "freeform") return r.freeformText ? [{ label: "Reflection", items: [{ question: "", answer: r.freeformText }] }] : [];
  const sections = r.mode === "short" ? [REFLECTION_SHORT_FORM] : REFLECTION_SECTIONS;
  return sections.map(s => ({
    label: s.label,
    items: s.questions.map(q => ({ question: q, answer: r.answers?.[`${s.id}::${q}`] || "" })).filter(i => i.answer.trim()),
  })).filter(s => s.items.length > 0);
}

export function whToDisplaySections(r) {
  const items = [];
  if (r.content) items.push({ question: "Reflection", answer: r.content });
  if (r.mostValuable) items.push({ question: "Most valuable aspect", answer: r.mostValuable });
  if (r.improvements) items.push({ question: "Suggested improvements", answer: r.improvements });
  if (r.futureTopics) items.push({ question: "Future topics of interest", answer: r.futureTopics });
  return items.length > 0 ? [{ label: "Reflection", items }] : [];
}

export default function Reflection({
  session, personalReflections = [], whReflections = [], onAddPersonalReflection, onDeletePersonalReflection, onEmailCopy,
  canManage, registrations = [], previousEvents = [], users = [], onResendReflectionReminder, onSendReflectionsReport,
}) {
  const [adding, setAdding] = useState(false);
  const [sortBy, setSortBy] = useState("date-desc");
  const [separateWh, setSeparateWh] = useState(getSeparateWhDefault);
  const [expandedId, setExpandedId] = useState(null);
  const [emailingId, setEmailingId] = useState(null);
  const [view, setView] = useState("mine");

  const mine = useMemo(() => {
    const personal = personalReflections
      .filter(r => r.userId === session.id)
      .map(r => ({ id: r.id, kind: "personal", name: r.activityName, date: r.activityDate, source: "external", raw: r }));
    const wh = whReflections
      .filter(r => (r.email || "").toLowerCase() === (session.email || "").toLowerCase())
      .map(r => ({ id: r.id, kind: "wh", name: r.eventTitle, date: r.submittedAt?.slice(0, 10), source: "wh", raw: r }));
    return { personal, wh };
  }, [personalReflections, whReflections, session]);

  const sortList = (list) => {
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sortBy === "alpha-asc") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "alpha-desc") return (b.name || "").localeCompare(a.name || "");
      if (sortBy === "date-asc") return (a.date || "").localeCompare(b.date || "");
      return (b.date || "").localeCompare(a.date || "");
    });
    return sorted;
  };

  const toggleSeparateWh = (value) => { setSeparateWh(value); setSeparateWhDefault(value); };

  const combined = sortList([...mine.personal, ...mine.wh]);
  const personalSorted = sortList(mine.personal);
  const whSorted = sortList(mine.wh);

  const emailCopy = async (entry) => {
    setEmailingId(entry.id);
    const sections = entry.kind === "personal" ? personalToDisplaySections(entry.raw) : whToDisplaySections(entry.raw);
    await onEmailCopy?.({ activityName: entry.name, activityDate: entry.date, sections });
    setEmailingId(null);
  };

  const renderEntry = (entry) => {
    const isOpen = expandedId === entry.id;
    const sections = entry.kind === "personal" ? personalToDisplaySections(entry.raw) : whToDisplaySections(entry.raw);
    return (
      <div key={entry.id} className="whmi-card p-3">
        <button onClick={() => setExpandedId(isOpen ? null : entry.id)} className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {isOpen ? <ChevronDown size={13} style={{ color: "var(--text-faint)" }} className="shrink-0" /> : <ChevronRight size={13} style={{ color: "var(--text-faint)" }} className="shrink-0" />}
            <div className="min-w-0 text-left">
              <div className="font-semibold text-[13px] truncate flex items-center gap-1.5">
                {entry.name}
                {entry.source === "wh" && <span className="whmi-badge shrink-0" style={{ background: "rgba(53,168,221,.12)", color: "var(--accent-secondary)" }}><Building2 size={9} className="mr-0.5 inline" />WH</span>}
              </div>
              <div className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>{entry.date ? fmtDate(entry.date) : "—"}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
            <button onClick={() => emailCopy(entry)} disabled={emailingId === entry.id} className="whmi-btn-ghost !p-1.5" title="Email me a copy"><Mail size={13} /></button>
            {entry.kind === "personal" && onDeletePersonalReflection && (
              <button onClick={() => onDeletePersonalReflection(entry.raw)} className="whmi-btn-ghost !p-1.5" style={{ color: "#D9534F" }} title="Delete"><Trash2 size={13} /></button>
            )}
          </div>
        </button>
        {isOpen && (
          <div className="mt-3 space-y-3 text-[12.5px]">
            {sections.length === 0 && <p style={{ color: "var(--text-faint)" }}>No details recorded.</p>}
            {sections.map((s, i) => (
              <div key={i}>
                <div className="font-semibold text-[11px] uppercase tracking-wide mb-1" style={{ color: "var(--text-faint)" }}>{s.label}</div>
                <div className="space-y-1.5">
                  {s.items.map((item, j) => (
                    <div key={j} className="p-2 rounded-lg" style={{ background: "var(--surface-2)" }}>
                      {item.question && <div className="text-[11px] font-medium mb-0.5" style={{ color: "var(--text-faint)" }}>{item.question}</div>}
                      <div style={{ color: "var(--text-dim)" }}>{item.answer}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="whmi-fade-in p-6 max-w-[900px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="disp text-[22px] font-extrabold flex items-center gap-2"><NotebookPen size={20} style={{ color: "var(--accent-primary)" }} />Reflection</h1>
          <p className="text-[13px]" style={{ color: "var(--text-dim)" }}>Your CPD reflections - from Western Health events and any activity you add yourself.</p>
        </div>
        {!adding && view === "mine" && (
          <button onClick={() => setAdding(true)} className="whmi-btn-primary flex items-center gap-1.5"><Plus size={15} />Add Reflection</button>
        )}
      </div>

      {canManage && (
        <div className="flex gap-1 border-b" style={{ borderColor: "var(--border)" }}>
          {[{ id: "mine", label: "My Reflections" }, { id: "all", label: "All Staff Reflections" }].map(t => (
            <button key={t.id} onClick={() => setView(t.id)} className="px-3 py-2 text-[12.5px] font-semibold whitespace-nowrap" style={{ color: view === t.id ? "var(--text)" : "var(--text-faint)", borderBottom: view === t.id ? "2px solid var(--accent-secondary)" : "2px solid transparent" }}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {view === "all" && canManage ? (
        <AdminReflectionsOverview
          registrations={registrations} previousEvents={previousEvents} reflections={whReflections} users={users}
          onResend={onResendReflectionReminder} onSendReport={onSendReflectionsReport}
        />
      ) : (
      <>
      {adding && (
        <AddReflectionForm
          onCancel={() => setAdding(false)}
          onSubmit={(payload) => { onAddPersonalReflection?.(payload); setAdding(false); }}
        />
      )}

      <div className="whmi-card p-3 flex items-center justify-between flex-wrap gap-3">
        <button type="button" onClick={() => toggleSeparateWh(!separateWh)} className="flex items-center gap-2.5">
          <span className="w-10 h-6 rounded-full relative transition shrink-0" style={{ background: separateWh ? "var(--accent-success)" : "var(--surface-2)", border: "1px solid var(--border)" }}>
            <span className="absolute top-0.5 rounded-full bg-white transition" style={{ left: separateWh ? "20px" : "3px", width: 18, height: 18 }} />
          </span>
          <span className="text-[12.5px] font-semibold">Keep Western Health CPD separate from other activities</span>
        </button>
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>Sort by</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="whmi-input px-2 py-1.5 text-[12px]">
            {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {separateWh ? (
        <>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-faint)" }}>Western Health CPD ({whSorted.length})</div>
            <div className="space-y-2">
              {whSorted.map(renderEntry)}
              {whSorted.length === 0 && <div className="whmi-card p-4 text-[12.5px] text-center" style={{ color: "var(--text-faint)" }}>No WH reflections yet.</div>}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-faint)" }}>Other CPD Activities ({personalSorted.length})</div>
            <div className="space-y-2">
              {personalSorted.map(renderEntry)}
              {personalSorted.length === 0 && <div className="whmi-card p-4 text-[12.5px] text-center" style={{ color: "var(--text-faint)" }}>No reflections added yet.</div>}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-2">
          {combined.map(renderEntry)}
          {combined.length === 0 && <div className="whmi-card p-4 text-[12.5px] text-center" style={{ color: "var(--text-faint)" }}>No reflections yet.</div>}
        </div>
      )}
      </>
      )}
    </div>
  );
}
