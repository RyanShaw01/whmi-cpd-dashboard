import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Clock, ClipboardList, Award, TrendingUp, ChevronRight, MapPin,
  Calendar, UserPlus, Download, Link2, MessageSquareText, UserCircle2, CalendarCheck2, LayoutGrid, List, Users, Radio,
  CheckCircle2, Maximize2, X,
} from "lucide-react";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import ModeBadge from "../components/ModeBadge";
import RegisterOrUnregister from "../components/EventRegisterControl";
import RecentlyCompletedCard from "../components/RecentlyCompletedCard";
import PresenterLine from "../components/PresenterLine";
import { fmtDate, daysUntil, formatCountdown, canJoinMeeting, fmtTimeRange12h, eventBannerUrl, relativeTime, ACTION_LABELS, activityEntityName, eventLocationSuffix, eventCountdownText, isRecentlyCompleted, getShowDueSoonDefault, getShowDueSoonDatesDefault, getDashboardEventViewDefault, setDashboardEventViewDefault } from "../lib/helpers";
import { cpdHoursDelivered, monthlyHours, modeSplit, outstandingReflections, avgFeedback } from "../lib/analytics";

const QUICK_ACTIONS = [
  { id: "upcoming", label: "Add/Edit Event", icon: Calendar, color: "var(--accent-primary)" },
  { id: "register", label: "Register for an Event", icon: ClipboardList, color: "var(--accent-success)" },
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
      groups.push({ actorId: entry.actorId, action: entry.action, count: 1, latest: entry.createdAt, entityType: entry.entityType, entityId: entry.entityId, details: entry.details });
    }
  }
  return groups.map(g => {
    const actor = users.find(u => u.id === g.actorId);
    const label = ACTION_LABELS[g.action] || g.action;
    const entityName = g.count === 1 ? activityEntityName(g.action, g.details) : null;
    const text = g.count > 1
      ? `${actor?.name || "Someone"} ${label} (${g.count} times)`
      : `${actor?.name || "Someone"} ${label}${entityName ? ` "${entityName}"` : ""}`;
    return { key: `${g.actorId}-${g.action}-${g.latest}`, text, time: relativeTime(g.latest), entityType: g.entityType, entityId: g.entityId };
  });
}

export default function Dashboard({
  events, previousEvents, registrations, reflections, certificates, files, auditLog = [], users = [], openEvent, setPage, layoutOrder, primaryHex, secondaryHex, successHex, userName, onCreateCertificate, onAddStaff, onAddEvent, onOpenRegister, onActivityClick,
  onOpenReports, onOpenCurrentRegistrations, onOpenCertificatesAwaiting, onOpenReportsFeedback, onOpenOutstandingReflections, onOpenEventsCurrentlyOpen,
  registeredIds, onUnregister,
}) {
  // Up Next's own big-card/compact-list choice, independent of the Upcoming Events page's.
  const [upNextView, setUpNextViewState] = useState(getDashboardEventViewDefault);
  const setUpNextView = (v) => { setUpNextViewState(v); setDashboardEventViewDefault(v); };

  // Full-size poster viewer and the "you're leaving the dashboard" confirmation for the Happening
  // Now / Recently Ended featured cards below — module-level state since only one of each can be
  // open at a time regardless of which card triggered it.
  const [expandedPoster, setExpandedPoster] = useState(null); // { url, event } | null
  const [joinConfirmEvent, setJoinConfirmEvent] = useState(null);

  // Re-render every minute so countdowns (and join-meeting availability) stay fresh.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  // Events in progress right now come out of Up Next/due-soon entirely and get their own
  // "Happening Now" section instead — an event finishing doesn't move it to Completed by
  // itself (that's a 24h-later lifecycle transition), so it falls back into the normal lists
  // once it's no longer live.
  const liveEvents = events.filter(ev => eventCountdownText(ev.date, ev.start, ev.end)?.happening);
  const liveIds = new Set(liveEvents.map(ev => ev.id));
  // An event that just finished stays in this same featured spot (badged "Recently Ended"
  // instead of "Live Now") for the same 24h grace window used elsewhere, rather than dropping
  // straight back into the plain Up Next grid.
  const recentlyEndedEvents = events.filter(ev => !liveIds.has(ev.id) && isRecentlyCompleted(ev.date, ev.end));
  const featuredEvents = [...liveEvents, ...recentlyEndedEvents];
  const featuredIds = new Set(featuredEvents.map(ev => ev.id));
  const nonLiveEvents = events.filter(ev => !featuredIds.has(ev.id));

  const dueSoonEvents = nonLiveEvents
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
  const hoursData = monthlyHours(previousEvents, 12);
  const modeData = modeSplit(previousEvents);

  const sections = {
    stats: (
      <div key="stats" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="CPD Hours Delivered (YTD)" value={hoursYtd} sub={`${previousEvents.length} events this year`} icon={Clock} accent={primaryHex} onClick={onOpenReports} />
        <StatCard label="Current Registrations" value={currentRegistrations} sub={`across ${openEvents.length} open events`} icon={ClipboardList} accent={successHex} onClick={onOpenCurrentRegistrations} />
        <StatCard label="Events Currently Open" value={openEvents.length} sub="accepting registrations" icon={CalendarCheck2} accent={successHex} onClick={onOpenEventsCurrentlyOpen} />
        <StatCard label="Certificates Awaiting Approval" value={awaitingCerts.length} sub={oldestCertDays != null ? `oldest: ${oldestCertDays} days` : undefined} icon={Award} accent={secondaryHex} onClick={onOpenCertificatesAwaiting} />
        <StatCard label="Outstanding Reflections" value={outstanding.count} sub={`across ${outstanding.eventCount} events`} icon={MessageSquareText} accent={secondaryHex} onClick={onOpenOutstandingReflections} />
        <StatCard label="Avg. Feedback Rating" value={feedbackAvg != null ? `${feedbackAvg} / 10` : "—"} sub="from last 6 events" icon={TrendingUp} accent={primaryHex} onClick={onOpenReportsFeedback} />
      </div>
    ),
    upNext: (
      <div key="upNext" className="whmi-card p-5">
        <div className="flex items-center justify-between mb-4 gap-2">
          <h2 className="disp text-[15px] font-bold">Up Next</h2>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>{nonLiveEvents.length} upcoming</span>
            <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <button onClick={() => setUpNextView("grid")} className="px-2 py-1.5 flex items-center" style={{ background: upNextView === "grid" ? "var(--accent-primary)" : "transparent", color: upNextView === "grid" ? "white" : "var(--text-dim)" }} title="Big cards">
                <LayoutGrid size={12} />
              </button>
              <button onClick={() => setUpNextView("list")} className="px-2 py-1.5 flex items-center" style={{ background: upNextView === "list" ? "var(--accent-primary)" : "transparent", color: upNextView === "list" ? "white" : "var(--text-dim)" }} title="Compact list">
                <List size={12} />
              </button>
            </div>
          </div>
        </div>
        {upNextView === "list" ? (
          <div className="space-y-1.5">
            {nonLiveEvents.slice(0, 6).map(ev => {
              const bannerUrl = eventBannerUrl(files, ev.id);
              const registered = registeredIds?.has(ev.id);
              // fmtDate() already returns e.g. "Mon, 10 Aug" (comma baked in by the locale
              // formatter) — only pull day/month out of it for the date box, never the
              // weekday token, or re-adding a comma in the label below double-punctuates it.
              const [, day, month] = fmtDate(ev.date).split(" ");
              return (
                <button key={ev.id} onClick={() => openEvent(ev)} className="whmi-row-hover w-full flex items-center gap-3.5 p-2 rounded-xl text-left transition">
                  <div className="w-[58px] h-[58px] rounded-lg shrink-0 relative overflow-hidden p-1.5 flex flex-col items-start justify-start" style={!bannerUrl ? { background: primaryHex } : undefined}>
                    {bannerUrl && (
                      <img src={bannerUrl} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" style={{ filter: "blur(3px) saturate(1.25) brightness(0.9)", transform: "scale(1.15)" }} />
                    )}
                    <span className="relative text-white text-[9px] font-bold uppercase leading-none" style={{ textShadow: "0 1px 3px rgba(0,0,0,.6)" }}>{month}</span>
                    <span className="relative text-white text-[17px] font-extrabold leading-none mt-0.5" style={{ textShadow: "0 1px 3px rgba(0,0,0,.6)" }}>{day}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[13px] break-words leading-snug">{ev.title}</div>
                    <div className="flex items-center gap-x-2.5 gap-y-0.5 text-[11px] flex-wrap mt-1" style={{ color: "var(--text-faint)" }}>
                      <span className="flex items-center gap-1"><Calendar size={10} className="shrink-0" />{fmtDate(ev.date)}</span>
                      <span className="flex items-center gap-1"><Clock size={10} className="shrink-0" />{fmtTimeRange12h(ev.start, ev.end)}</span>
                      <span className="flex items-center gap-1 truncate"><MapPin size={10} className="shrink-0" />{ev.campus || eventLocationSuffix(ev) || "—"}</span>
                    </div>
                  </div>
                  <StatusBadge status={ev.status} />
                  {onOpenRegister && (registered || ev.status === "Registration Open") && (
                    <RegisterOrUnregister
                      registered={registered}
                      onRegister={() => onOpenRegister(ev.id)}
                      onUnregister={() => onUnregister?.(ev.id)}
                    />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {nonLiveEvents.slice(0, 6).map(ev => {
            const bannerUrl = eventBannerUrl(files, ev.id);
            const registered = registeredIds?.has(ev.id);
            if (isRecentlyCompleted(ev.date, ev.end)) {
              return <RecentlyCompletedCard key={ev.id} event={ev} files={files} openEvent={openEvent} registered={registered} accentHex={primaryHex} />;
            }
            return (
              <div key={ev.id} className="w-full flex flex-col p-4 rounded-xl" style={{ border: "1px solid var(--border)" }}>
                <button onClick={() => openEvent(ev)} className="whmi-row-hover w-full flex flex-col text-left transition rounded-lg -m-1 p-1">
                  {bannerUrl && (
                    <div className="w-full h-28 rounded-lg mb-3 overflow-hidden" style={{ border: "1px solid var(--border)" }}>
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
                    <div className="w-16 h-16 rounded-lg shrink-0 flex flex-col items-center justify-center" style={{ background: primaryHex }}>
                      <span className="text-white text-[10.5px] font-bold uppercase">{fmtDate(ev.date).split(" ")[2]}</span>
                      <span className="text-white text-[18px] font-extrabold leading-none">{fmtDate(ev.date).split(" ")[1]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-[14.5px] break-words">{ev.title}</div>
                        <ChevronRight size={16} style={{ color: "var(--text-faint)" }} className="shrink-0" />
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-1.5 text-[11.5px]" style={{ color: "var(--text-dim)" }}>
                        <span className="flex items-center gap-1 min-w-0"><Clock size={11} className="shrink-0" /><span className="truncate">{fmtTimeRange12h(ev.start, ev.end)}</span></span>
                        <span className="flex items-center gap-1 min-w-0"><MapPin size={11} className="shrink-0" /><span className="truncate">{ev.campus && <strong>{ev.campus}</strong>}{ev.campus && eventLocationSuffix(ev) ? " - " : ""}{eventLocationSuffix(ev)}</span></span>
                        <span className="flex items-center gap-1 min-w-0"><UserCircle2 size={11} className="shrink-0" /><PresenterLine presenter={ev.presenter} className="truncate" /></span>
                        <span className="flex items-center gap-1 font-bold min-w-0"><Users size={11} className="shrink-0" /><span className="truncate">{ev.capacity == null ? `Registered: ${ev.registered}` : `Registered ${ev.registered}/${ev.capacity}`}</span></span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-2">
                        <StatusBadge status={ev.status} />
                        <ModeBadge mode={ev.mode} />
                      </div>
                      {ev.openToExternal !== false && ev.externalPrice != null && (
                        <div className="mt-2 text-[11.5px] font-semibold" style={{ color: "var(--accent-success)" }}>External price: ${Number(ev.externalPrice).toFixed(2)} AUD</div>
                      )}
                    </div>
                  </div>
                </button>
                {onOpenRegister && (registered || ev.status === "Registration Open") && (
                  <div className="flex justify-end mt-3">
                    <RegisterOrUnregister
                      registered={registered} size="md" corner={false}
                      onRegister={() => onOpenRegister(ev.id)}
                      onUnregister={() => onUnregister?.(ev.id)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}
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
            {/* Percentage-based (not fixed pixel) radii so the pie scales down with the card
                instead of overflowing/getting clipped on narrower desktop widths. */}
            <Pie data={modeData} dataKey="value" innerRadius="45%" outerRadius="70%" paddingAngle={3}>
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

        {getShowDueSoonDefault() && dueSoonEvents.length > 0 && (
          <ul className="mt-2 space-y-0.5 pl-5" style={{ listStyleType: "disc" }}>
            {dueSoonEvents.slice(0, 5).map(ev => {
              const joinable = ev.meetingUrl && canJoinMeeting(ev.date, ev.start, ev.end);
              return (
                <li key={ev.id} className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <button onClick={() => openEvent(ev)} className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[12px] sm:text-[13px] px-1 py-1 -mx-1 rounded-lg whmi-row-hover transition text-left w-full">
                      <span className="font-medium" style={{ color: "var(--text)" }}>{ev.title}</span>
                      <span className="flex items-center gap-x-2 whitespace-nowrap shrink-0">
                        <span style={{ color: "var(--text-faint)" }}>·</span>
                        <span className="font-extrabold" style={{ color: primaryHex }}>{formatCountdown(ev.date, ev.start)}</span>
                        {getShowDueSoonDatesDefault() && (
                          <>
                            <span style={{ color: "var(--text-faint)" }}>·</span>
                            <span style={{ color: "var(--text-faint)" }}>({fmtDate(ev.date)} · {fmtTimeRange12h(ev.start, ev.end)})</span>
                          </>
                        )}
                      </span>
                    </button>
                    {joinable && (
                      <a href={ev.meetingUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[12px] font-semibold shrink-0 mt-0.5" style={{ color: secondaryHex }}>
                        <Link2 size={12} />Join meeting here
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
            {dueSoonEvents.length > 5 && (
              <li>
                <button onClick={() => setPage("upcoming")} className="text-[12px] font-semibold px-2 py-1 -mx-2 rounded-lg whmi-row-hover transition" style={{ color: primaryHex }}>
                  Show {dueSoonEvents.length - 5} more →
                </button>
              </li>
            )}
          </ul>
        )}
      </div>

      <div className="whmi-quick-actions-group">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {QUICK_ACTIONS.map(a => (
            <button
              key={a.id}
              onClick={() => {
                if (a.id === "certificates") onCreateCertificate();
                else if (a.id === "staff") onAddStaff();
                else if (a.id === "upcoming") onAddEvent();
                else if (a.id === "register") onOpenRegister();
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

      {featuredEvents.length > 0 && (
        <div className="whmi-card p-5" style={{ borderColor: liveEvents.length > 0 ? "#D9534F" : "var(--accent-success)" }}>
          <div className="flex items-center gap-2 mb-4">
            <span className={`w-2 h-2 rounded-full${liveEvents.length > 0 ? " animate-pulse" : ""}`} style={{ background: liveEvents.length > 0 ? "#D9534F" : "var(--accent-success)" }} />
            <h2 className="disp text-[15px] font-extrabold uppercase tracking-wide" style={{ color: liveEvents.length > 0 ? "#D9534F" : "var(--accent-success)" }}>
              {liveEvents.length > 0 ? "Happening Now" : "Recently Ended"}
            </h2>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {featuredEvents.map(ev => {
              const isLive = liveIds.has(ev.id);
              const bannerUrl = eventBannerUrl(files, ev.id);
              const registered = registeredIds?.has(ev.id);
              const accent = isLive ? "#D9534F" : "var(--accent-success)";
              return (
                <div
                  key={ev.id}
                  className="rounded-xl overflow-hidden flex flex-col sm:flex-row whmi-row-hover transition"
                  style={{ border: `1px solid ${isLive ? "rgba(217,83,79,.35)" : "var(--border)"}`, background: isLive ? "rgba(217,83,79,.06)" : "var(--surface)" }}
                >
                  {bannerUrl && (
                    <div className="relative w-full sm:w-36 h-32 sm:h-auto shrink-0 overflow-hidden">
                      <img
                        src={bannerUrl} alt="" className="w-full h-full object-cover cursor-pointer"
                        style={{
                          objectPosition: `${ev.bannerFocalX ?? 50}% ${ev.bannerFocalY ?? 50}%`,
                          transform: `scale(${ev.bannerZoom ?? 1})`, transformOrigin: `${ev.bannerFocalX ?? 50}% ${ev.bannerFocalY ?? 50}%`,
                        }}
                        onClick={() => setExpandedPoster({ url: bannerUrl, event: ev })}
                      />
                      <button
                        onClick={() => setExpandedPoster({ url: bannerUrl, event: ev })}
                        className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center transition hover:scale-110"
                        style={{ background: "rgba(0,0,0,.45)" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,.75)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,.45)"; }}
                        title="View full poster" type="button"
                      >
                        <Maximize2 size={12} color="white" />
                      </button>
                    </div>
                  )}
                  <div className="p-4 flex-1 min-w-0 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="whmi-badge flex items-center gap-1 font-extrabold" style={{ background: accent, color: "white" }}>
                        {isLive ? <><Radio size={11} />LIVE NOW</> : <><CheckCircle2 size={11} />RECENTLY ENDED</>}
                      </span>
                      <ModeBadge mode={ev.mode} />
                    </div>
                    <button onClick={() => openEvent(ev)} className="text-left">
                      <div className="font-bold text-[14.5px] break-words">{ev.title}</div>
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-[11.5px]" style={{ color: "var(--text-dim)" }}>
                      <span className="flex items-center gap-1 min-w-0"><Clock size={11} className="shrink-0" /><span className="truncate">{fmtTimeRange12h(ev.start, ev.end)}</span></span>
                      <span className="flex items-center gap-1 min-w-0"><MapPin size={11} className="shrink-0" /><span className="truncate">{ev.campus && <strong>{ev.campus}</strong>}{ev.campus && eventLocationSuffix(ev) ? " - " : ""}{eventLocationSuffix(ev)}</span></span>
                      {ev.presenter && <span className="flex items-center gap-1 min-w-0"><UserCircle2 size={11} className="shrink-0" /><PresenterLine presenter={ev.presenter} className="truncate" /></span>}
                      <span className="flex items-center gap-1 font-bold min-w-0"><Users size={11} className="shrink-0" /><span className="truncate">{ev.capacity == null ? `Registered: ${ev.registered}` : `Registered ${ev.registered}/${ev.capacity}`}</span></span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      {isLive && ev.meetingUrl && (
                        <button
                          onClick={() => setJoinConfirmEvent(ev)}
                          className="flex items-center justify-center gap-1.5 font-bold text-[12.5px] px-3 py-1.5 rounded-lg text-white transition hover:brightness-110"
                          style={{ background: "#D9534F" }}
                        >
                          <Link2 size={13} />Join Live Event
                        </button>
                      )}
                      {onOpenRegister && (registered || ev.status === "Registration Open") && (
                        <RegisterOrUnregister
                          registered={registered} size="md" corner={false}
                          onRegister={() => onOpenRegister(ev.id)}
                          onUnregister={() => onUnregister?.(ev.id)}
                        />
                      )}
                      {!isLive && registered && (
                        <Link to={`/event/${ev.id}/reflect`} className="whmi-btn-primary flex items-center justify-center gap-1.5 text-[12.5px]">
                          <MessageSquareText size={14} />Leave Feedback & Get Certificate
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {expandedPoster && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,.85)" }}
          onClick={(e) => { e.stopPropagation(); setExpandedPoster(null); }}
        >
          <img src={expandedPoster.url} alt="" className="max-w-full max-h-full object-contain" onClick={e => e.stopPropagation()} />
          <button onClick={(e) => { e.stopPropagation(); setExpandedPoster(null); }} className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,.15)" }}>
            <X size={18} color="white" />
          </button>
        </div>
      )}

      {joinConfirmEvent && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,.5)", backdropFilter: "blur(3px)" }}
          onClick={() => setJoinConfirmEvent(null)}
        >
          <div className="whmi-card w-full max-w-sm p-5 whmi-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "#D9534F22" }}>
                <Link2 size={16} style={{ color: "#D9534F" }} />
              </span>
              <div className="font-bold text-[14.5px]">You will be redirected to this live event.</div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setJoinConfirmEvent(null)}
                className="whmi-btn-ghost transition hover:brightness-95"
              >
                Cancel
              </button>
              <button
                onClick={() => { window.open(joinConfirmEvent.meetingUrl, "_blank", "noreferrer"); setJoinConfirmEvent(null); }}
                className="whmi-btn-primary transition hover:brightness-110"
              >
                Open Event
              </button>
            </div>
          </div>
        </div>
      )}

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
