import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Clock, ClipboardList, Award, TrendingUp, ChevronRight, MapPin,
  Calendar, UserPlus, Download, Link2, MessageSquareText, UserCircle2,
} from "lucide-react";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { fmtDate, daysUntil, formatCountdown, canJoinMeeting, fmtTimeRange12h, eventBannerUrl, relativeTime, ACTION_LABELS, eventLocationSuffix } from "../lib/helpers";
import { cpdHoursDelivered, monthlyHours, modeSplit, outstandingReflections, avgFeedback } from "../lib/analytics";

const QUICK_ACTIONS = [
  { id: "upcoming", label: "Add/Edit Event", icon: Calendar, color: "var(--accent-primary)" },
  { id: "certificates", label: "Make Certificate", icon: Award, color: "var(--accent-secondary)" },
  { id: "staff", label: "Add Staff", icon: UserPlus, color: "var(--accent-success)" },
  { id: "reports", label: "Export Reports", icon: Download, color: "var(--accent-primary)" },
];

// Groups consecutive same-actor/same-action entries (already ordered newest-first) into one
// line, e.g. "Leah Biffin updated 3 events" instead of three separate rows.
function groupActivity(auditLog, users) {
  const groups = [];
  for (const entry of auditLog) {
    const last = groups[groups.length - 1];
    if (last && last.actorId === entry.actorId && last.action === entry.action) {
      last.count += 1;
      last.latest = entry.createdAt;
    } else {
      // auditLog is newest-first, so the entry that starts a new group is also the most recent
      // one affected by it — that's what a click on a merged "(3 times)" row will jump to.
      groups.push({ actorId: entry.actorId, action: entry.action, count: 1, latest: entry.createdAt, entityType: entry.entityType, entityId: entry.entityId });
    }
  }
  return groups.map(g => {
    const actor = users.find(u => u.id === g.actorId);
    const label = ACTION_LABELS[g.action] || g.action;
    const text = g.count > 1 ? `${actor?.name || "Someone"} ${label} (${g.count} times)` : `${actor?.name || "Someone"} ${label}`;
    return { key: `${g.actorId}-${g.action}-${g.latest}`, text, time: relativeTime(g.latest), entityType: g.entityType, entityId: g.entityId };
  });
}

export default function Dashboard({ events, previousEvents, registrations, reflections, certificates, files, auditLog = [], users = [], openEvent, setPage, layoutOrder, primaryHex, secondaryHex, successHex, userName, onCreateCertificate, onAddStaff, onAddEvent, onActivityClick }) {
  // Re-render every minute so countdowns (and join-meeting availability) stay fresh.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const dueSoonEvents = events
    .filter(ev => ev.status === "Registration Open")
    .map(ev => ({ ...ev, dayOffset: daysUntil(ev.date) }))
    .filter(ev => ev.dayOffset >= 0 && ev.dayOffset <= 14)
    .sort((a, b) => new Date(`${a.date}T${a.start}`) - new Date(`${b.date}T${b.start}`));

  const openEvents = events.filter(ev => ev.status === "Registration Open");
  const openEventIds = new Set(openEvents.map(ev => ev.id));
  const currentRegistrations = registrations.filter(r => openEventIds.has(r.eventId) && r.attendanceStatus !== "Cancelled").length;
  const awaitingCerts = certificates.filter(c => c.status === "Awaiting Approval");
  const oldestCertDays = awaitingCerts.length > 0
    ? Math.max(0, Math.round((Date.now() - Math.min(...awaitingCerts.map(c => new Date(`${c.date}T00:00:00`).getTime()))) / 86400000))
    : null;
  const feedbackAvg = avgFeedback(reflections, { limit: 6 });
  const outstanding = outstandingReflections(events, registrations, reflections);
  const hoursYtd = Math.round(cpdHoursDelivered(previousEvents) * 10) / 10;
  const hoursData = monthlyHours(previousEvents);
  const modeData = modeSplit(previousEvents);

  const sections = {
    stats: (
      <div key="stats" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="CPD Hours Delivered (YTD)" value={hoursYtd} sub={`${previousEvents.length} events this year`} icon={Clock} accent={primaryHex} />
        <StatCard label="Current Registrations" value={currentRegistrations} sub={`across ${openEvents.length} open events`} icon={ClipboardList} accent={successHex} />
        <StatCard label="Certificates Awaiting Approval" value={awaitingCerts.length} sub={oldestCertDays != null ? `oldest: ${oldestCertDays} days` : undefined} icon={Award} accent={secondaryHex} />
        <StatCard label="Avg. Feedback Rating" value={feedbackAvg != null ? `${feedbackAvg} / 10` : "—"} sub="from last 6 events" icon={TrendingUp} accent={primaryHex} />
        <StatCard label="Outstanding Reflections" value={outstanding.count} sub={`across ${outstanding.eventCount} events`} icon={MessageSquareText} accent={secondaryHex} />
      </div>
    ),
    upNext: (
      <div key="upNext" className="whmi-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="disp text-[15px] font-bold">Up Next</h2>
          <span className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>{events.length} upcoming</span>
        </div>
        <div className="space-y-3">
          {events.slice(0, 4).map(ev => {
            const bannerUrl = eventBannerUrl(files, ev.id);
            return (
              <button key={ev.id} onClick={() => openEvent(ev)} className="whmi-row-hover w-full flex flex-col p-3 rounded-xl text-left transition" style={{ border: "1px solid var(--border)" }}>
                {bannerUrl && (
                  <div className="w-full h-20 rounded-lg mb-3 overflow-hidden">
                    <img
                      src={bannerUrl} alt="" className="w-full h-full object-cover"
                      style={{
                        objectPosition: `${ev.bannerFocalX ?? 50}% ${ev.bannerFocalY ?? 50}%`,
                        transform: `scale(${ev.bannerZoom ?? 1})`, transformOrigin: `${ev.bannerFocalX ?? 50}% ${ev.bannerFocalY ?? 50}%`,
                      }}
                    />
                  </div>
                )}
                <div className="w-full flex items-start gap-4">
                  <div className="w-14 h-14 rounded-lg shrink-0 flex flex-col items-center justify-center" style={{ background: primaryHex }}>
                    <span className="text-white text-[10px] font-bold uppercase">{fmtDate(ev.date).split(" ")[2]}</span>
                    <span className="text-white text-[16px] font-extrabold leading-none">{fmtDate(ev.date).split(" ")[1]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-[13.5px] break-words">{ev.title}</div>
                      <ChevronRight size={16} style={{ color: "var(--text-faint)" }} className="shrink-0" />
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-1.5 text-[11.5px]" style={{ color: "var(--text-dim)" }}>
                      <span className="flex items-center gap-1"><Clock size={11} className="shrink-0" />{fmtTimeRange12h(ev.start, ev.end)}</span>
                      <span className="flex items-center gap-1"><MapPin size={11} className="shrink-0" /><span className="truncate">{ev.campus && <strong>{ev.campus}</strong>}{ev.campus && eventLocationSuffix(ev) ? " - " : ""}{eventLocationSuffix(ev)}</span></span>
                      <span className="flex items-center gap-1"><UserCircle2 size={11} className="shrink-0" /><span className="truncate">{ev.presenter}</span></span>
                      <span className="flex items-center gap-1 font-bold whitespace-nowrap">{ev.capacity == null ? `Registered: ${ev.registered}` : `Registered ${ev.registered}/${ev.capacity}`}</span>
                    </div>
                    <div className="mt-1.5"><StatusBadge status={ev.status} /></div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    ),
    activity: (
      <div key="activity" className="whmi-card p-5">
        <h2 className="disp text-[15px] font-bold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {groupActivity(auditLog, users).slice(0, 8).map(a => {
            const clickable = !!(onActivityClick && a.entityId);
            const Row = clickable ? "button" : "div";
            return (
              <Row key={a.key} onClick={clickable ? () => onActivityClick(a) : undefined} className={`flex gap-3 w-full text-left${clickable ? " whmi-row-hover rounded-lg -m-1 p-1 transition" : ""}`}>
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: primaryHex }} />
                <div className="min-w-0">
                  <div className="text-[12.5px] leading-snug break-words">{a.text}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: "var(--text-faint)" }}>{a.time}</div>
                </div>
              </Row>
            );
          })}
          {auditLog.length === 0 && <div className="text-[12.5px]" style={{ color: "var(--text-faint)" }}>No activity recorded yet.</div>}
        </div>
      </div>
    ),
    hoursChart: (
      <div key="hoursChart" className="whmi-card p-5">
        <h2 className="disp text-[15px] font-bold mb-1">CPD Hours by Month</h2>
        <p className="text-[11.5px] mb-3" style={{ color: "var(--text-faint)" }}>Hours delivered across all WHMI CPD activities</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={hoursData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="hours" stroke={primaryHex} strokeWidth={2.5} fill={primaryHex} fillOpacity={0.16} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    ),
    modeChart: (
      <div key="modeChart" className="whmi-card p-5">
        <h2 className="disp text-[15px] font-bold mb-1">Attendance Mode</h2>
        <p className="text-[11.5px] mb-2" style={{ color: "var(--text-faint)" }}>In-person vs online, completed events</p>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={modeData} dataKey="value" innerRadius={50} outerRadius={75} paddingAngle={3}>
              {modeData.map((e, i) => <Cell key={i} fill={[primaryHex, secondaryHex][i]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 -mt-2">
          {modeData.map((e, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[11.5px]">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: [primaryHex, secondaryHex][i] }} />{e.name} {e.value}%
            </div>
          ))}
        </div>
      </div>
    ),
  };

  return (
    <div className="whmi-fade-in p-6 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="disp text-[22px] font-extrabold">Good afternoon, {userName}</h1>
        <p className="text-[13px]" style={{ color: "var(--text-dim)" }}>Here's what's happening across WHMI CPD today, {new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}.</p>

        {dueSoonEvents.length > 0 && (
          <ul className="mt-2 space-y-1 pl-5" style={{ listStyleType: "disc" }}>
            {dueSoonEvents.map(ev => {
              const joinable = ev.meetingUrl && canJoinMeeting(ev.date, ev.start, ev.end);
              return (
                <li key={ev.id} className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[13px]">
                  <button onClick={() => openEvent(ev)} className="font-medium underline-offset-2 hover:underline" style={{ color: "var(--text)" }}>{ev.title}</button>
                  <span style={{ color: "var(--text-faint)" }}>·</span>
                  <span className="font-extrabold" style={{ color: primaryHex }}>{formatCountdown(ev.date, ev.start)}</span>
                  {joinable && (
                    <a href={ev.meetingUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[12px] font-semibold" style={{ color: secondaryHex }}>
                      <Link2 size={12} />Join meeting here
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="whmi-quick-actions-group">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map(a => (
            <button
              key={a.id}
              onClick={() => {
                if (a.id === "certificates") onCreateCertificate();
                else if (a.id === "staff") onAddStaff();
                else if (a.id === "upcoming") onAddEvent();
                else setPage(a.id);
              }}
              className="whmi-quick-action"
            >
              <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: a.color + "22" }}>
                <a.icon size={14} style={{ color: a.color }} />
              </div>
              <div className="text-[12px] font-bold truncate">{a.label}</div>
            </button>
          ))}
        </div>
      </div>

      {(() => {
        const visible = layoutOrder.filter(id => sections[id]);
        const pairCharts = visible.includes("hoursChart") && visible.includes("modeChart");
        const rendered = new Set();
        return visible.map(id => {
          if (rendered.has(id)) return null;
          if (pairCharts && (id === "hoursChart" || id === "modeChart")) {
            rendered.add("hoursChart");
            rendered.add("modeChart");
            return (
              <div key="charts-row" className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">{sections.hoursChart}</div>
                <div className="md:col-span-1">{sections.modeChart}</div>
              </div>
            );
          }
          return sections[id];
        });
      })()}
    </div>
  );
}
