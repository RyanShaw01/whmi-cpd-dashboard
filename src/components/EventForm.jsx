import { useState } from "react";
import { Save, X } from "lucide-react";
import { TOPICS, CAMPUS_OPTIONS } from "../data/mockData";
import { formatDuration } from "../lib/helpers";
import EventFilesPanel from "./EventFilesPanel";

const MODE_OPTIONS = ["In-person", "Online", "Hybrid"];
const STATUS_OPTIONS = ["Draft", "Awaiting Approval", "Registration Open", "Registration Closed", "Completed", "Archived"];

const REFLECTION_METHODS = [
  { id: "link", label: "Direct web link" },
  { id: "qr", label: "QR code on slides" },
  { id: "auto-email", label: "Automatic email after event" },
];

const emptyEvent = {
  title: "", topic: TOPICS[0], tags: [], description: "", learningObjectives: "",
  presenter: "", organisers: "", supportingStaff: "",
  date: "", start: "", end: "", location: "", campus: "", mode: "In-person",
  meetingUrl: "", room: "", capacity: "", onlineCapacity: "", inPersonCapacity: "",
  waitlist: 0, status: "Draft", registered: 0, reflectionMethod: "link", asmirtCode: "",
  cpdTypeId: null, openToExternal: true,
};

const field = "text-[11px] font-semibold block mb-1";

// DB rows use null for "not set"; text/number inputs need "" so they stay controlled.
const nullsToEmpty = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v == null ? "" : v]));

export default function EventForm({ event, onSave, onCancel, uploadedBy, cpdTypes = [] }) {
  const [form, setForm] = useState(event ? { ...emptyEvent, ...nullsToEmpty(event), tags: event.tags || [] } : emptyEvent);
  const isEdit = Boolean(event);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleTag = (t) => setForm(f => ({ ...f, tags: f.tags.includes(t) ? f.tags.filter(x => x !== t) : [...f.tags, t] }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date || !form.start || !form.end) return;
    const payload = {
      ...form,
      id: form.id || "e" + Date.now(),
      capacity: form.capacity === "" ? null : Number(form.capacity),
      onlineCapacity: form.onlineCapacity === "" ? null : Number(form.onlineCapacity),
      inPersonCapacity: form.inPersonCapacity === "" ? null : Number(form.inPersonCapacity),
      waitlist: Number(form.waitlist) || 0,
      registered: Number(form.registered) || 0,
    };
    onSave(payload);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className={field}>Event Title</label>
        <input required value={form.title} onChange={e => set("title", e.target.value)} className="whmi-input w-full px-2.5 py-2" />
      </div>

      <div>
        <label className={field}>Description</label>
        <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} className="whmi-input w-full px-2.5 py-2 resize-none" />
      </div>

      <div>
        <label className={field}>Learning Objectives</label>
        <textarea value={form.learningObjectives} onChange={e => set("learningObjectives", e.target.value)} rows={2} placeholder="One per line" className="whmi-input w-full px-2.5 py-2 resize-none" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={field}>Primary Topic</label>
          <select value={form.topic} onChange={e => set("topic", e.target.value)} className="whmi-input w-full px-2.5 py-2">
            {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={field}>Status</label>
          <select value={form.status} onChange={e => set("status", e.target.value)} className="whmi-input w-full px-2.5 py-2">
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={field}>Tags</label>
        <div className="flex flex-wrap gap-1.5">
          {TOPICS.map(t => (
            <button key={t} type="button" onClick={() => toggleTag(t)} className="whmi-badge" style={{ background: form.tags.includes(t) ? "var(--accent-primary)" : "var(--surface-2)", color: form.tags.includes(t) ? "white" : "var(--text-dim)" }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={field}>Presenter(s)</label>
          <input value={form.presenter} onChange={e => set("presenter", e.target.value)} placeholder="Comma-separated" className="whmi-input w-full px-2.5 py-2" />
        </div>
        <div>
          <label className={field}>Organisers</label>
          <input value={form.organisers} onChange={e => set("organisers", e.target.value)} placeholder="Comma-separated" className="whmi-input w-full px-2.5 py-2" />
        </div>
      </div>
      <div>
        <label className={field}>Supporting Staff</label>
        <input value={form.supportingStaff} onChange={e => set("supportingStaff", e.target.value)} placeholder="Comma-separated" className="whmi-input w-full px-2.5 py-2" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={field}>Date</label>
          <input required type="date" value={form.date} onChange={e => set("date", e.target.value)} className="whmi-input w-full px-2.5 py-2" />
        </div>
        <div>
          <label className={field}>Start Time</label>
          <input required type="time" value={form.start} onChange={e => set("start", e.target.value)} className="whmi-input w-full px-2.5 py-2" />
        </div>
        <div>
          <label className={field}>Finish Time</label>
          <input required type="time" value={form.end} onChange={e => set("end", e.target.value)} className="whmi-input w-full px-2.5 py-2" />
        </div>
      </div>
      <p className="text-[11px] -mt-2" style={{ color: "var(--text-faint)" }}>Duration: <strong style={{ color: "var(--text-dim)" }}>{formatDuration(form.start, form.end)}</strong> (calculated automatically)</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={field}>Mode</label>
          <select value={form.mode} onChange={e => set("mode", e.target.value)} className="whmi-input w-full px-2.5 py-2">
            {MODE_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className={field}>Campus</label>
          <select value={form.campus} onChange={e => set("campus", e.target.value)} className="whmi-input w-full px-2.5 py-2">
            <option value="">—</option>
            {CAMPUS_OPTIONS.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={field}>Location</label>
          <input value={form.location} onChange={e => set("location", e.target.value)} className="whmi-input w-full px-2.5 py-2" />
        </div>
        <div>
          <label className={field}>Room</label>
          <input value={form.room} onChange={e => set("room", e.target.value)} className="whmi-input w-full px-2.5 py-2" />
        </div>
      </div>

      {form.mode !== "In-person" && (
        <div>
          <label className={field}>Teams Meeting Link</label>
          <input value={form.meetingUrl} onChange={e => set("meetingUrl", e.target.value)} placeholder="https://teams.microsoft.com/..." className="whmi-input w-full px-2.5 py-2" />
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={field}>Total Capacity</label>
          <input type="number" min="0" value={form.capacity} onChange={e => set("capacity", e.target.value)} className="whmi-input w-full px-2.5 py-2" />
        </div>
        {form.mode === "Hybrid" && (
          <>
            <div>
              <label className={field}>Online Capacity</label>
              <input type="number" min="0" value={form.onlineCapacity} onChange={e => set("onlineCapacity", e.target.value)} className="whmi-input w-full px-2.5 py-2" />
            </div>
            <div>
              <label className={field}>In-person Capacity</label>
              <input type="number" min="0" value={form.inPersonCapacity} onChange={e => set("inPersonCapacity", e.target.value)} className="whmi-input w-full px-2.5 py-2" />
            </div>
          </>
        )}
      </div>

      <div>
        <label className={field}>CPD Type</label>
        <select value={form.cpdTypeId || ""} onChange={e => set("cpdTypeId", e.target.value || null)} className="whmi-input w-full px-2.5 py-2">
          <option value="">No matching CPD type</option>
          {cpdTypes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.appellationCode})</option>)}
        </select>
        <p className="text-[10.5px] mt-1" style={{ color: "var(--text-faint)" }}>
          {form.cpdTypeId
            ? "The matching appellation code will appear on the auto-generated certificate."
            : "If this event doesn't match a CPD type, no ASMIRT-endorsed certificate will be sent, only a generic attendance certificate."}
        </p>
      </div>

      <div className="flex items-center justify-between p-3 rounded-xl" style={{ border: "1px solid var(--border)" }}>
        <div>
          <div className="text-[12.5px] font-semibold">Open to external participants</div>
          <div className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>External accounts can browse and register for this event.</div>
        </div>
        <button type="button" onClick={() => set("openToExternal", !form.openToExternal)} className="w-10 h-6 rounded-full relative transition shrink-0" style={{ background: form.openToExternal ? "var(--accent-success)" : "var(--surface-2)", border: "1px solid var(--border)" }}>
          <span className="absolute top-0.5 rounded-full bg-white transition" style={{ left: form.openToExternal ? "20px" : "3px", width: 18, height: 18 }} />
        </button>
      </div>

      <div>
        <label className={field}>Reflection Collection Method</label>
        <select value={form.reflectionMethod} onChange={e => set("reflectionMethod", e.target.value)} className="whmi-input w-full px-2.5 py-2">
          {REFLECTION_METHODS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
        {form.reflectionMethod === "auto-email" && (
          <p className="text-[10.5px] mt-1" style={{ color: "var(--text-faint)" }}>Note: sending automatic emails needs real email infrastructure, which isn't connected yet; attendees can still submit via the same link in the meantime.</p>
        )}
      </div>

      {isEdit && (
        <div className="pt-2 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="text-[11px] font-semibold mb-2 mt-3" style={{ color: "var(--text-faint)" }}>FILES</div>
          <EventFilesPanel eventId={form.id} uploadedBy={uploadedBy} />
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button type="submit" className="whmi-btn-primary flex-1 flex items-center justify-center gap-1.5"><Save size={13} />{isEdit ? "Save Changes" : "Create Event"}</button>
        <button type="button" onClick={onCancel} className="whmi-btn-ghost flex-1 flex items-center justify-center gap-1.5"><X size={13} />Cancel</button>
      </div>
    </form>
  );
}
