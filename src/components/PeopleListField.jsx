import { useState } from "react";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Check, X } from "lucide-react";
import { splitPeopleList } from "../lib/helpers";

// Add/edit/reorder UI for a comma-separated list stored as one text field underneath
// (event.presenter / event.organisers) — value in, comma-joined string out.
export default function PeopleListField({ label, value, onChange, placeholder }) {
  const items = splitPeopleList(value);
  const [newItem, setNewItem] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState("");

  const commit = (nextItems) => onChange(nextItems.join(", "));

  const addItem = () => {
    if (!newItem.trim()) return;
    commit([...items, newItem.trim()]);
    setNewItem("");
  };
  const startEdit = (i) => { setEditingIndex(i); setEditValue(items[i]); };
  const saveEdit = () => {
    if (!editValue.trim()) { setEditingIndex(null); return; }
    const next = [...items];
    next[editingIndex] = editValue.trim();
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
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-1">
            {editingIndex === i ? (
              <>
                <input
                  autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); saveEdit(); } if (e.key === "Escape") setEditingIndex(null); }}
                  className="whmi-input flex-1 px-2.5 py-1.5 text-[12px]"
                />
                <button type="button" onClick={saveEdit} className="whmi-btn-ghost !p-1.5"><Check size={12} /></button>
                <button type="button" onClick={() => setEditingIndex(null)} className="whmi-btn-ghost !p-1.5"><X size={12} /></button>
              </>
            ) : (
              <>
                <span className="flex-1 text-[12.5px] px-2.5 py-1.5 rounded-lg truncate" style={{ background: "var(--surface-2)" }}>{item}</span>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="whmi-btn-ghost !p-1.5" style={{ opacity: i === 0 ? 0.35 : 1 }}><ArrowUp size={11} /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="whmi-btn-ghost !p-1.5" style={{ opacity: i === items.length - 1 ? 0.35 : 1 }}><ArrowDown size={11} /></button>
                <button type="button" onClick={() => startEdit(i)} className="whmi-btn-ghost !p-1.5"><Pencil size={11} /></button>
                <button type="button" onClick={() => removeItem(i)} className="whmi-btn-ghost !p-1.5" style={{ color: "#D9534F" }}><Trash2 size={11} /></button>
              </>
            )}
          </div>
        ))}
        {items.length === 0 && <div className="text-[11px]" style={{ color: "var(--text-faint)" }}>None added yet.</div>}
      </div>
      <div className="flex gap-1.5 mt-1.5">
        <input
          value={newItem} onChange={e => setNewItem(e.target.value)} placeholder={placeholder}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
          className="whmi-input flex-1 px-2.5 py-1.5 text-[12px]"
        />
        <button type="button" onClick={addItem} className="whmi-btn-ghost !py-1.5 !px-2.5 text-[11.5px] flex items-center gap-1 shrink-0"><Plus size={12} />Add</button>
      </div>
    </div>
  );
}
