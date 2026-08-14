import { useState, useEffect, useRef } from "react";
import { Save, X, Plus } from "lucide-react";
import { CAMPUS_OPTIONS, LOCATION_OPTIONS } from "../data/mockData";
import { formatDuration } from "../lib/helpers";
import EventFilesPanel from "./EventFilesPanel";
import BannerPositionEditor from "./BannerPositionEditor";
import InfoTooltip from "./InfoTooltip";
import TimeInput12h from "./TimeInput12h";
import PeopleListField from "./PeopleListField";
import { eventBannerUrl, tagIsModality } from "../lib/helpers";

const STATUS_OPTIONS = ["Draft", "Awaiting Approval", "Registration Open", "Informational", "Registration Closed", "Completed", "Archived"];

const RECURRENCE_FREQUENCIES = [
  { id: "daily", label: "Day(s)" },
  { id: "weekly", label: "Week(s)" },
  { id: "fortnightly", label: "Fortnight(s)" },
  { id: "monthly", label: "Month(s)" },
];

// Builds the list of occurrence dates (YYYY-MM-DD) for a recurring series, starting from and
// including the base event's own date. Capped at 52 to guard against a runaway series.
function generateRecurrenceDates(startDateStr, freq, interval, endType, endCount, endDate) {
  const step = Math.max(1, Number(interval) || 1);
  const dates = [startDateStr];
  const d = new Date(`${startDateStr}T00:00:00`);
  const until = endType === "until" && endDate ? new Date(`${endDate}T23:59:59`) : null;
  const maxCount = endType === "count" ? Math.min(52, Math.max(1, Number(endCount) || 1)) : 52;
  while (dates.length < maxCount) {
    if (freq === "daily") d.setDate(d.getDate() + step);
    else if (freq === "weekly") d.setDate(d.getDate() + 7 * step);
    else if (freq === "fortnightly") d.setDate(d.getDate() + 14 * step);
    else if (freq === "monthly") d.setMonth(d.getMonth() + step);
    if (until && d > until) break;
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

const emptyEvent = {
  title: "", tags: [], description: "",
  presenter: "", organisers: "",
  date: "", start: "", end: "", location: "", campus: "", mode: "In-person",
  meetingUrl: "", room: "", level: "", capacity: "", onlineCapacity: "", inPersonCapacity: "",
  waitlist: 0, status: "Draft", registered: 0, reflectionAutoEmail: true, asmirtCode: "",
  cpdTypeId: null, openToExternal: true, showRegCountExternal: false, certificatesEnabled: true,
  externalPrice: "", reflectionEmailOffsetMinutes: 20, reflectionEmailOffsetDirection: "before",
};

const field = "text-[11px] font-semibold block mb-1";

// DB rows use null for "not set"; text/number inputs need "" so they stay controlled.
const nullsToEmpty = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v == null ? "" : v]));

export default function EventForm({ event, onSave, onCancel, uploadedBy, cpdTypes = [], tags = [], onSaveTag, initialStatus, onFilesChange, files, onUpdateBannerCrop, onRemoveBanner, onDirtyChange, highlightMissing }) {
  const initialForm = event
    ? { ...emptyEvent, ...nullsToEmpty(event), tags: event.tags || [] }
    : { ...emptyEvent, status: initialStatus || emptyEvent.status };
  const [form, setForm] = useState(initialForm);
  const [newTag, setNewTag] = useState("");
  const isEdit = Boolean(event);

  // Recurrence only applies when creating a brand-new event — once a series exists each
  // occurrence is just its own independent event row, edited individually.
  const [recurring, setRecurring] = useState(false);
  const [recurFreq, setRecurFreq] = useState("weekly");
  const [recurInterval, setRecurInterval] = useState(1);
  const [recurEndType, setRecurEndType] = useState("count"); // count | until
  const [recurEndCount, setRecurEndCount] = useState(4);
  const [recurEndDate, setRecurEndDate] = useState("");
  const [groupInUpcoming, setGroupInUpcoming] = useState(true);
  const [groupInPrevious, setGroupInPrevious] = useState(false);
  const initialFormRef = useRef(initialForm);
  useEffect(() => {
    onDirtyChange?.(JSON.stringify(form) !== JSON.stringify(initialFormRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  // Opened from an "event needs more detail" notification: ring the still-empty required
  // fields so it's obvious at a glance what's left to fill in, without blocking anything else.
  const missingStyle = (empty) => (highlightMissing && empty ? { outline: "2px solid #D9534F", outlineOffset: 1 } : undefined);
  const toggleTag = (t) => setForm(f => ({ ...f, tags: f.tags.includes(t) ? f.tags.filter(x => x !== t) : [...f.tags, t] }));
  const addCustomTag = () => {
    const t = newTag.trim();
    if (t && !form.tags.includes(t)) {
      setForm(f => ({ ...f, tags: [...f.tags, t] }));
      onSaveTag?.(t);
    }
    setNewTag("");
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date || !form.start || !form.end) return;
    const basePayload = {
      ...form,
      topic: form.tags[0] || "",
      capacity: form.capacity === "" ? null : Number(form.capacity),
      onlineCapacity: form.onlineCapacity === "" ? null : Number(form.onlineCapacity),
      inPersonCapacity: form.inPersonCapacity === "" ? null : Number(form.inPersonCapacity),
      waitlist: Number(form.waitlist) || 0,
      registered: Number(form.registered) || 0,
      // The banner position/zoom are saved instantly (via BannerPositionEditor, bypassing this
      // form entirely) as soon as they're dragged, so `form` still holds whatever stale
      // snapshot it was initialized with at mount. Carry the *live* event's values forward here
      // instead, or a full-form save would silently revert any banner adjustment just made.
      ...(event ? { bannerFocalX: event.bannerFocalX, bannerFocalY: event.bannerFocalY, bannerZoom: event.bannerZoom } : {}),
    };

    if (!isEdit && recurring) {
      const dates = generateRecurrenceDates(form.date, recurFreq, recurInterval, recurEndType, recurEndCount, recurEndDate);
      const recurrenceGroupId = "rg" + Date.now();
      const occurrences = dates.map((date, i) => ({
        ...basePayload,
        id: "e" + Date.now() + "_" + i,
        date,
        recurrenceGroupId,
        groupInUpcoming,
        groupInPrevious,
      }));
      onSave(occurrences);
      return;
    }

    onSave({ ...basePayload, id: form.id || "e" + Date.now() });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className={field}>Event Title</label>
        <input required value={form.title} onChange={e => set("title", e.target.value)} className="whmi-input w-full px-2.5 py-2" style={missingStyle(!form.title.trim())} />
      </div>

      <div>
        <label className={field}>Description</label>
        <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} className="whmi-input w-full px-2.5 py-2 resize-none" />
      </div>

      <div>
        <div className="flex items-center gap-1.5">
          <label className={field}>Status</label>
          <InfoTooltip text={'"Informational" is visible to everyone the same as "Registration Open" - but there\'s no Register button, and no registrations/attendance are collected. Use it for anything you just want to list (e.g. an external conference, a drop-in session).'} />
        </div>
        <select value={form.status} onChange={e => set("status", e.target.value)} className="whmi-input w-full px-2.5 py-2">
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {!isEdit && (
        <div className="p-3 rounded-xl" style={{ border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[12.5px] font-semibold">Recurring Event</span>
              <InfoTooltip text="Creates a whole series of events at once, each its own event card that can be edited or set to a different status independently. Grouped events show as tabs when you open any one of them." />
            </div>
            <button type="button" onClick={() => setRecurring(r => !r)} className="w-10 h-6 rounded-full relative transition shrink-0" style={{ background: recurring ? "var(--accent-success)" : "var(--surface-2)", border: "1px solid var(--border)" }}>
              <span className="absolute top-0.5 rounded-full bg-white transition" style={{ left: recurring ? "20px" : "3px", width: 18, height: 18 }} />
            </button>
          </div>
          {recurring && (
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-[11.5px] font-semibold shrink-0" style={{ color: "var(--text-dim)" }}>Repeat every</label>
                <input type="number" min="1" step="1" value={recurInterval} onChange={e => setRecurInterval(e.target.value === "" ? "" : Number(e.target.value))} className="whmi-input px-2 py-1.5 w-16 text-center" />
                <select value={recurFreq} onChange={e => setRecurFreq(e.target.value)} className="whmi-input px-2 py-1.5">
                  {RECURRENCE_FREQUENCIES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3 flex-wrap text-[11.5px]" style={{ color: "var(--text-dim)" }}>
                <label className="flex items-center gap-1.5 font-semibold">
                  <input type="radio" checked={recurEndType === "count"} onChange={() => setRecurEndType("count")} />After
                </label>
                <input type="number" min="1" step="1" disabled={recurEndType !== "count"} value={recurEndCount} onChange={e => setRecurEndCount(e.target.value === "" ? "" : Number(e.target.value))} className="whmi-input px-2 py-1.5 w-16 text-center" style={{ opacity: recurEndType === "count" ? 1 : 0.5 }} />
                <span>occurrences</span>
                <label className="flex items-center gap-1.5 font-semibold">
                  <input type="radio" checked={recurEndType === "until"} onChange={() => setRecurEndType("until")} />Until
                </label>
                <input type="date" disabled={recurEndType !== "until"} value={recurEndDate} onChange={e => setRecurEndDate(e.target.value)} className="whmi-input px-2 py-1.5" style={{ opacity: recurEndType === "until" ? 1 : 0.5 }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold">Group these events together in Upcoming Events</span>
                <button type="button" onClick={() => setGroupInUpcoming(g => !g)} className="w-10 h-6 rounded-full relative transition shrink-0" style={{ background: groupInUpcoming ? "var(--accent-success)" : "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <span className="absolute top-0.5 rounded-full bg-white transition" style={{ left: groupInUpcoming ? "20px" : "3px", width: 18, height: 18 }} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold">Keep grouped once they move to Previous Events</span>
                <button type="button" onClick={() => setGroupInPrevious(g => !g)} className="w-10 h-6 rounded-full relative transition shrink-0" style={{ background: groupInPrevious ? "var(--accent-success)" : "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <span className="absolute top-0.5 rounded-full bg-white transition" style={{ left: groupInPrevious ? "20px" : "3px", width: 18, height: 18 }} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <label className={field}>Topics</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.filter(t => tagIsModality(t)).map(t => (
            <button key={t.id} type="button" onClick={() => toggleTag(t.name)} className="whmi-badge" style={{ background: form.tags.includes(t.name) ? "var(--accent-primary)" : "var(--surface-2)", color: form.tags.includes(t.name) ? "white" : "var(--text-dim)" }}>
              {t.name}
            </button>
          ))}
        </div>
        {tags.some(t => tagIsModality(t)) && tags.some(t => !tagIsModality(t)) && (
          <div className="my-2" style={{ borderTop: "1px solid var(--border)" }} />
        )}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.filter(t => !tagIsModality(t)).map(t => (
            <button key={t.id} type="button" onClick={() => toggleTag(t.name)} className="whmi-badge" style={{ background: form.tags.includes(t.name) ? "var(--accent-primary)" : "var(--surface-2)", color: form.tags.includes(t.name) ? "white" : "var(--text-dim)" }}>
              {t.name}
            </button>
          ))}
          {form.tags.filter(t => !tags.some(tag => tag.name === t)).map(t => (
            <button key={t} type="button" onClick={() => toggleTag(t)} className="whmi-badge flex items-center gap-1" style={{ background: "var(--accent-primary)", color: "white" }}>
              {t}<X size={10} />
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <input
            value={newTag} onChange={e => setNewTag(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomTag(); } }}
            placeholder="Add a custom tag" className="whmi-input flex-1 px-2.5 py-1.5 text-[12px]"
          />
          <button type="button" onClick={addCustomTag} className="whmi-btn-ghost !py-1.5 !px-2.5 text-[12px] flex items-center gap-1"><Plus size={12} />Add</button>
        </div>
      </div>

      <div className="space-y-5">
        <div style={missingStyle(!form.presenter.trim())} className="rounded-xl">
          <PeopleListField label="Presenter(s)" value={form.presenter} onChange={v => set("presenter", v)} placeholder="Add a presenter" />
        </div>
        <PeopleListField label="Organisers" value={form.organisers} onChange={v => set("organisers", v)} placeholder="Add an organiser" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={field}>Date</label>
          <input required type="date" value={form.date} onChange={e => set("date", e.target.value)} className="whmi-input w-full px-2.5 py-2" style={missingStyle(!form.date)} />
        </div>
        <div style={missingStyle(!form.start)} className="rounded-lg">
          <label className={field}>Start Time</label>
          <TimeInput12h value={form.start} onChange={v => set("start", v)} />
        </div>
        <div style={missingStyle(!form.end)} className="rounded-lg">
          <label className={field}>Finish Time</label>
          <TimeInput12h value={form.end} onChange={v => set("end", v)} />
        </div>
      </div>
      <p className="text-[11px] -mt-2" style={{ color: "var(--text-faint)" }}>Duration: <strong style={{ color: "var(--text-dim)" }}>{formatDuration(form.start, form.end)}</strong> (calculated automatically)</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={field}>Mode</label>
          <select value={form.mode} onChange={e => set("mode", e.target.value)} className="whmi-input w-full px-2.5 py-2">
            <option value="In-person">In-person</option>
            <option value="Online">Online</option>
            <option value="Hybrid">Hybrid (In-person &amp; Online)</option>
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

      <div>
        <label className={field}>Location</label>
        <input value={form.location} onChange={e => set("location", e.target.value)} list="location-options" placeholder="e.g. Sunshine Hospital, Education Wing" className="whmi-input w-full px-2.5 py-2" style={missingStyle(!form.location.trim() && !form.campus)} />
        <datalist id="location-options">
          {LOCATION_OPTIONS.map(l => <option key={l} value={l} />)}
        </datalist>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={field}>Level (optional)</label>
          <input value={form.level} onChange={e => set("level", e.target.value)} placeholder="e.g. Level 2" className="whmi-input w-full px-2.5 py-2" />
        </div>
        <div>
          <label className={field}>Room Number (optional)</label>
          <input value={form.room} onChange={e => set("room", e.target.value)} placeholder="e.g. Room 204" className="whmi-input w-full px-2.5 py-2" />
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
          <input type="number" min="0" value={form.capacity} onChange={e => set("capacity", e.target.value)} placeholder="∞ Unlimited" className="whmi-input w-full px-2.5 py-2" />
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

      {form.openToExternal && (
        <div>
          <label className={field}>Price for external participants</label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] font-semibold" style={{ color: "var(--text-faint)" }}>$</span>
            <input
              type="number" min="0" step="0.01" value={form.externalPrice}
              onChange={e => set("externalPrice", e.target.value)}
              placeholder="0.00"
              className="whmi-input w-full pl-6 pr-12 py-2"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>AUD</span>
          </div>
          <p className="text-[10.5px] mt-1" style={{ color: "var(--text-faint)" }}>Shown to external participants when registering. Internal WH staff never see a price.</p>
        </div>
      )}

      <div className="flex items-center justify-between p-3 rounded-xl" style={{ border: "1px solid var(--border)" }}>
        <div>
          <div className="text-[12.5px] font-semibold">Show registration numbers to external viewers</div>
          <div className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>Off by default; internal staff never see registration counts on an unlimited-capacity event either way.</div>
        </div>
        <button type="button" onClick={() => set("showRegCountExternal", !form.showRegCountExternal)} className="w-10 h-6 rounded-full relative transition shrink-0" style={{ background: form.showRegCountExternal ? "var(--accent-success)" : "var(--surface-2)", border: "1px solid var(--border)" }}>
          <span className="absolute top-0.5 rounded-full bg-white transition" style={{ left: form.showRegCountExternal ? "20px" : "3px", width: 18, height: 18 }} />
        </button>
      </div>

      <div className="flex items-center justify-between p-3 rounded-xl" style={{ border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-1.5">
          <span className="text-[12.5px] font-semibold">Allow CPD certificates to be sent</span>
          <InfoTooltip text="Turn off for events that don't carry a CPD certificate (e.g. informal sessions). Attendees can still leave feedback, but no certificate will be generated or sent for this event." />
        </div>
        <button type="button" onClick={() => set("certificatesEnabled", !form.certificatesEnabled)} className="w-10 h-6 rounded-full relative transition shrink-0" style={{ background: form.certificatesEnabled ? "var(--accent-success)" : "var(--surface-2)", border: "1px solid var(--border)" }}>
          <span className="absolute top-0.5 rounded-full bg-white transition" style={{ left: form.certificatesEnabled ? "20px" : "3px", width: 18, height: 18 }} />
        </button>
      </div>

      <div className="p-3 rounded-xl" style={{ border: "1px solid var(--border)" }}>
        <p className="text-[11.5px] mb-2" style={{ color: "var(--text-dim)" }}>Attendees can always leave feedback via a direct link or the QR code on your slides.</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[12.5px] font-semibold">Send follow-up email after event</span>
            <InfoTooltip text="Automatically emails attendees a link to submit their reflection a set time after the event ends, in addition to the link and QR code." />
          </div>
          <button type="button" onClick={() => set("reflectionAutoEmail", !form.reflectionAutoEmail)} className="w-10 h-6 rounded-full relative transition shrink-0" style={{ background: form.reflectionAutoEmail ? "var(--accent-success)" : "var(--surface-2)", border: "1px solid var(--border)" }}>
            <span className="absolute top-0.5 rounded-full bg-white transition" style={{ left: form.reflectionAutoEmail ? "20px" : "3px", width: 18, height: 18 }} />
          </button>
        </div>
        {form.reflectionAutoEmail && (
          <>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <label className="text-[11.5px] font-semibold shrink-0" style={{ color: "var(--text-dim)" }}>Send</label>
              <input
                type="number" min="0" step="1" value={form.reflectionEmailOffsetMinutes}
                onChange={e => set("reflectionEmailOffsetMinutes", e.target.value === "" ? "" : Number(e.target.value))}
                className="whmi-input px-2 py-1.5 w-20 text-center"
              />
              <label className="text-[11.5px] font-semibold" style={{ color: "var(--text-dim)" }}>minutes</label>
              <select
                value={form.reflectionEmailOffsetDirection}
                onChange={e => set("reflectionEmailOffsetDirection", e.target.value)}
                className="whmi-input px-2 py-1.5"
              >
                <option value="before">before</option>
                <option value="after">after</option>
              </select>
              <label className="text-[11.5px] font-semibold" style={{ color: "var(--text-dim)" }}>the event ends</label>
            </div>
            <p className="text-[10.5px] mt-1.5" style={{ color: "var(--text-faint)" }}>Note: sending automatic emails needs a scheduled job, which isn't connected yet; the link and QR code work today.</p>
          </>
        )}
      </div>

      {isEdit && (
        <div className="pt-2 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="text-[11px] font-semibold mb-2 mt-3" style={{ color: "var(--text-faint)" }}>FILES</div>
          <EventFilesPanel eventId={form.id} uploadedBy={uploadedBy} onFilesChange={onFilesChange} />
          {eventBannerUrl(files, event.id) && (
            <div className="mt-3">
              <BannerPositionEditor
                bannerUrl={eventBannerUrl(files, event.id)}
                focalX={event.bannerFocalX ?? 50} focalY={event.bannerFocalY ?? 50} zoom={event.bannerZoom ?? 1}
                onChangeCrop={(x, y, z) => onUpdateBannerCrop(event, x, y, z)}
                onRemove={() => onRemoveBanner(event)}
              />
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button type="submit" className="whmi-btn-primary flex-1 flex items-center justify-center gap-1.5"><Save size={13} />{isEdit ? "Save Changes" : "Create Event"}</button>
        <button type="button" onClick={onCancel} className="whmi-btn-ghost flex-1 flex items-center justify-center gap-1.5"><X size={13} />Cancel</button>
      </div>
    </form>
  );
}
