import { useState } from "react";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Check, X } from "lucide-react";
import { splitPeopleList, parsePerson, formatPerson } from "../lib/helpers";

// Add/edit/reorder UI for a comma-separated list stored as one text field underneath
// (event.presenter / event.organisers) — value in, comma-joined string out. Each person gets an
// optional job title alongside their name (kept in the same string via parsePerson/formatPerson,
// so no schema change was needed), shown as its own faint field next to Name.
export default function PeopleListField({ label, value, onChange, placeholder, titlePlaceholder = "Job title (optional)" }) {
  const items = splitPeopleList(value);
  const [newName, setNewName] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editName, setEditName] = useState("");
  const [editTitle, setEditTitle] = useState("");

  const commit = (nextItems) => onChange(nextItems.join(", "));

  const addItem = () => {
    if (!newName.trim()) return;
    commit([...items, formatPerson(newName, newTitle)]);
    setNewName(""); setNewTitle("");
  };
  const startEdit = (i) => {
    const { name, title } = parsePerson(items[i]);
    setEditingIndex(i); setEditName(name); setEditTitle(title);
  };
  const saveEdit = () => {
    if (!editName.trim()) { setEditingIndex(null); return; }
    const next = [...items];
    next[editingIndex] = formatPerson(editName, editTitle);
    commit(next);
    setEditingIndex(null);
  };
  const removeItem = (i) => commit(items.filter((_, idx) => idx !== i));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  };

  return (
    <div>
      <label className="text-[11px] font-semibold block mb-1" style={{ color: "var(--text-faint)" }}>{label}</label>
      <div className="space-y-1.5">
        {items.map((item, i) => {
          const { name, title } = parsePerson(item);
          return (
            <div key={i} className="flex items-center gap-1">
              {editingIndex === i ? (
                <>
                  <input
                    autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); saveEdit(); } if (e.key === "Escape") setEditingIndex(null); }}
                    placeholder="Name" className="whmi-input flex-1 px-2.5 py-1.5 text-[12px]"
                  />
                  <input
                    value={editTitle} onChange={e => setEditTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); saveEdit(); } if (e.key === "Escape") setEditingIndex(null); }}
                    placeholder={titlePlaceholder} className="whmi-input flex-1 px-2.5 py-1.5 text-[12px]"
                  />
                  <button type="button" onClick={saveEdit} className="whmi-btn-ghost !p-1.5"><Check size={12} /></button>
                  <button type="button" onClick={() => setEditingIndex(null)} className="whmi-btn-ghost !p-1.5"><X size={12} /></button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-[12.5px] px-2.5 py-1.5 rounded-lg truncate" style={{ background: "var(--surface-2)" }}>
                    {name}{title && <span style={{ color: "var(--text-faint)" }}> — {title}</span>}
                  </span>
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="whmi-btn-ghost !p-1.5" style={{ opacity: i === 0 ? 0.35 : 1 }}><ArrowUp size={11} /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="whmi-btn-ghost !p-1.5" style={{ opacity: i === items.length - 1 ? 0.35 : 1 }}><ArrowDown size={11} /></button>
                  <button type="button" onClick={() => startEdit(i)} className="whmi-btn-ghost !p-1.5"><Pencil size={11} /></button>
                  <button type="button" onClick={() => removeItem(i)} className="whmi-btn-ghost !p-1.5" style={{ color: "#D9534F" }}><Trash2 size={11} /></button>
                </>
              )}
            </div>
          );
        })}
        {items.length === 0 && <div className="text-[11px]" style={{ color: "var(--text-faint)" }}>None added yet.</div>}
      </div>
      <div className="flex gap-1.5 mt-1.5">
        <input
          value={newName} onChange={e => setNewName(e.target.value)} placeholder={placeholder}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
          className="whmi-input flex-1 px-2.5 py-1.5 text-[12px]"
        />
        <input
          value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder={titlePlaceholder}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
          className="whmi-input flex-1 px-2.5 py-1.5 text-[12px]"
        />
        <button type="button" onClick={addItem} className="whmi-btn-ghost !py-1.5 !px-2.5 text-[11.5px] flex items-center gap-1 shrink-0"><Plus size={12} />Add</button>
      </div>
    </div>
  );
}
