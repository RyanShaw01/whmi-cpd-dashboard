import { useEffect, useRef, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Download, Calendar, Users, AlertCircle, TrendingUp, X, Maximize2 } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import StatCard from "../components/StatCard";
import AllFeedbackPanel from "../components/AllFeedbackPanel";
import { attendanceTrend, topicPopularity, monthlyHours, eventAttendedCount, avgFeedback, feedbackTrend, cpdHoursDelivered } from "../lib/analytics";
import { eventCpdHours, fmtDate } from "../lib/helpers";
import { drawBarChart, drawLineChart } from "../lib/pdfCharts";

// A chart card the whole box is clickable to open a larger, more detailed version in a modal —
// same hover language as every other clickable card in the app (whmi-row-hover).
function ChartCard({ title, sub, children, onClick }) {
  return (
    <button onClick={onClick} className="whmi-card p-4 text-left w-full whmi-row-hover transition">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="min-w-0">
          <h2 className="disp text-[13.5px] font-bold">{title}</h2>
          {sub && <p className="text-[10.5px] mt-0.5" style={{ color: "var(--text-faint)" }}>{sub}</p>}
        </div>
        <Maximize2 size={13} className="shrink-0" style={{ color: "var(--text-faint)" }} />
      </div>
      <div className="mt-2">{children}</div>
    </button>
  );
}

function ChartDetailModal({ chart, onClose, primaryHex, secondaryHex, successHex }) {
  if (!chart) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.5)" }} onClick={onClose}>
      <div className="whmi-card w-full max-w-3xl max-h-[85vh] overflow-y-auto whmi-scroll whmi-fade-in" onClick={e => e.stopPropagation()}>
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <h2 className="disp text-[16px] font-extrabold">{chart.title}</h2>
            {chart.sub && <p className="text-[12px] mt-0.5" style={{ color: "var(--text-faint)" }}>{chart.sub}</p>}
          </div>
          <button onClick={onClose} className="whmi-btn-ghost !p-2"><X size={14} /></button>
        </div>
        <div className="p-5 space-y-4">
          <ResponsiveContainer width="100%" height={340}>
            {chart.render()}
          </ResponsiveContainer>
          {chart.stats?.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {chart.stats.map((s, i) => (
                <div key={i} className="whmi-card p-3" style={{ background: "var(--surface-2)" }}>
                  <div className="text-[10.5px] font-semibold" style={{ color: "var(--text-faint)" }}>{s.label}</div>
                  <div className="disp text-[18px] font-extrabold mt-0.5">{s.value}</div>
                </div>
              ))}
            </div>
          )}
          {chart.table && (
            <div className="space-y-1">
              {chart.table.map((row, i) => (
                <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-lg text-[12px]" style={{ background: "var(--surface-2)" }}>
                  <span className="font-semibold truncate">{row.label}</span>
                  <span style={{ color: "var(--text-faint)" }}>{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function reportRows(previousEvents, registrations, reflections) {
  return previousEvents.map(ev => {
    const regs = registrations.filter(r => r.eventId === ev.id);
    const attended = eventAttendedCount(ev.id, registrations);
    const noShow = regs.filter(r => r.attendanceStatus === "No Show").length;
    return {
      title: ev.title, date: ev.date, topic: ev.topic,
      registered: regs.filter(r => r.attendanceStatus !== "Cancelled").length,
      attended, noShow,
      noShowRate: (attended + noShow) === 0 ? null : Math.round((noShow / (attended + noShow)) * 1000) / 10,
      feedback: avgFeedback(reflections.filter(r => r.eventId === ev.id), { limit: 1 }),
      hours: eventCpdHours(ev.start, ev.end),
    };
  });
}

// Shared summary block (used by both the CSV and PDF exports) so the two exports never drift
// apart in what "extra data" they include.
function buildSummary(events, previousEvents, registrations, reflections, year) {
  const allEvents = [...events, ...previousEvents];
  const byYear = {};
  allEvents.forEach(ev => {
    const y = new Date(`${ev.date}T00:00:00`).getFullYear();
    byYear[y] = (byYear[y] || 0) + 1;
  });
  const eventsByYear = Object.entries(byYear).sort((a, b) => a[0] - b[0]).map(([y, count]) => ({ year: Number(y), count }));

  const allTimeEventIds = new Set(previousEvents.map(ev => ev.id));
  const allTimeRegs = registrations.filter(r => allTimeEventIds.has(r.eventId));
  const attendedAllTime = allTimeRegs.filter(r => r.attendanceStatus === "Attended").length;
  const noShowAllTime = allTimeRegs.filter(r => r.attendanceStatus === "No Show").length;

  const eventsThisYear = allEvents.filter(ev => new Date(`${ev.date}T00:00:00`).getFullYear() === year);
  const previousEventsThisYear = previousEvents.filter(ev => new Date(`${ev.date}T00:00:00`).getFullYear() === year);
  const eventIdsThisYear = new Set(eventsThisYear.map(ev => ev.id));
  const registrationsThisYear = registrations.filter(r => eventIdsThisYear.has(r.eventId));
  const attendedThisYear = registrationsThisYear.filter(r => r.attendanceStatus === "Attended").length;
  const noShowThisYear = registrationsThisYear.filter(r => r.attendanceStatus === "No Show").length;
  const noShowRateThisYear = attendedThisYear + noShowThisYear === 0 ? null : Math.round((noShowThisYear / (attendedThisYear + noShowThisYear)) * 1000) / 10;
  const feedbackAvgAllTime = avgFeedback(reflections, { limit: previousEvents.length || 1 });
  const feedbackAvgThisYear = avgFeedback(reflections.filter(r => eventIdsThisYear.has(r.eventId)), { limit: previousEventsThisYear.length || 1 });

  return {
    totalEventsAllTime: allEvents.length, eventsThisYear: eventsThisYear.length, eventsByYear,
    attendedAllTime, noShowAllTime, attendedThisYear, noShowThisYear, noShowRateThisYear,
    feedbackAvgAllTime, feedbackAvgThisYear,
  };
}

function exportCsv(rows, year, summary) {
  const summaryLines = [
    ["WHMI CPD Report Summary", year],
    ["Total Events (all-time)", summary.totalEventsAllTime],
    [`Events in ${year}`, summary.eventsThisYear],
    ...summary.eventsByYear.map(y => [`Events in ${y.year}`, y.count]),
    ["Total Attendance (all-time)", summary.attendedAllTime],
    [`Attendance in ${year}`, summary.attendedThisYear],
    [`No-show Rate in ${year} (%)`, summary.noShowRateThisYear ?? ""],
    ["Avg. Feedback (all-time, /10)", summary.feedbackAvgAllTime ?? ""],
    [`Avg. Feedback in ${year} (/10)`, summary.feedbackAvgThisYear ?? ""],
    [],
    ["Per-Event Details"],
  ];
  const headers = ["Event", "Date", "Topic", "Registered", "Attended", "No-show", "No-show Rate (%)", "Avg Feedback (/10)", "CPD Hours"];
  const dataRows = rows.map(r => [r.title, r.date, r.topic, r.registered, r.attended, r.noShow, r.noShowRate ?? "", r.feedback ?? "", r.hours ?? ""]);
  const csv = [...summaryLines, headers, ...dataRows]
    .map(row => row.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `whmi-cpd-report-${year}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function exportPdf(rows, year, summary, chartData, colors) {
  const doc = await PDFDocument.create();
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const black = rgb(0.1, 0.1, 0.1);
  const grey = rgb(0.45, 0.45, 0.45);
  const primary = hexToRgb(colors.primaryHex);
  const secondary = hexToRgb(colors.secondaryHex);
  const success = hexToRgb(colors.successHex);

  let page = doc.addPage([595, 842]); // A4 portrait
  let y = 800;
  const newPage = () => { page = doc.addPage([595, 842]); y = 800; };

  page.drawText(`WHMI CPD Report, ${year}`, { x: 40, y, size: 18, font: bold, color: black });
  y -= 24;
  page.drawText(`Generated ${new Date().toLocaleDateString("en-AU")}`, { x: 40, y, size: 10, font: regular, color: grey });
  y -= 26;

  // ---- Summary ----
  page.drawText("Summary", { x: 40, y, size: 13, font: bold, color: black });
  y -= 18;
  const summaryLines = [
    `Total Events (all-time): ${summary.totalEventsAllTime}`,
    `Events in ${year}: ${summary.eventsThisYear}`,
    ...summary.eventsByYear.map(v => `Events in ${v.year}: ${v.count}`),
    `Total Attendance (all-time): ${summary.attendedAllTime}`,
    `Attendance in ${year}: ${summary.attendedThisYear}`,
    `No-show Rate in ${year}: ${summary.noShowRateThisYear != null ? `${summary.noShowRateThisYear}%` : "—"}`,
    `Avg. Feedback (all-time): ${summary.feedbackAvgAllTime != null ? `${summary.feedbackAvgAllTime}/10` : "—"}`,
    `Avg. Feedback in ${year}: ${summary.feedbackAvgThisYear != null ? `${summary.feedbackAvgThisYear}/10` : "—"}`,
  ];
  summaryLines.forEach(line => { page.drawText(line, { x: 40, y, size: 10, font: regular, color: black }); y -= 15; });
  y -= 10;

  // ---- Charts, each with its own labelled section ----
  const chartSections = [
    { title: "CPD Hours by Month (last 12 months)", data: chartData.hoursData, key: "hours", color: primary, kind: "bar" },
    { title: "Attendance Rate Trend (last 12 months)", data: chartData.trendData, key: "rate", color: secondary, kind: "line", suffix: "%" },
    { title: "Events by Topic (this year)", data: chartData.topicData, key: "events", labelKey: "topic", color: success, kind: "bar" },
    { title: "Avg. Feedback, Month to Month (last 12 months)", data: chartData.feedbackTrendData, key: "rating", color: primary, kind: "line", suffix: "/10" },
  ];
  for (const section of chartSections) {
    if (y < 220) newPage();
    page.drawText(section.title, { x: 40, y, size: 12, font: bold, color: black });
    y -= 16;
    const chartHeight = 110;
    const chartTop = y;
    if (section.kind === "bar") {
      drawBarChart(page, { x: 50, y: chartTop - chartHeight, width: 480, height: chartHeight }, section.data, {
        valueKey: section.key, labelKey: section.labelKey || "month", color: section.color, font: regular,
        valueFormat: section.suffix ? (v => `${v}${section.suffix}`) : undefined,
      });
    } else {
      drawLineChart(page, { x: 50, y: chartTop - chartHeight, width: 480, height: chartHeight }, section.data, {
        valueKey: section.key, labelKey: "month", color: section.color, font: regular,
        valueFormat: section.suffix ? (v => `${v}${section.suffix}`) : undefined,
      });
    }
    y = chartTop - chartHeight - 26;
  }

  // ---- Per-event details, including attendance breakdown, no-show rate, and feedback ----
  if (y < 150) newPage();
  page.drawText("Per-Event Details", { x: 40, y, size: 13, font: bold, color: black });
  y -= 18;
  page.drawText("Event", { x: 40, y, size: 9, font: bold, color: black });
  page.drawText("Date", { x: 200, y, size: 9, font: bold, color: black });
  page.drawText("Reg.", { x: 265, y, size: 9, font: bold, color: black });
  page.drawText("Att.", { x: 300, y, size: 9, font: bold, color: black });
  page.drawText("No-show", { x: 335, y, size: 9, font: bold, color: black });
  page.drawText("No-show %", { x: 390, y, size: 9, font: bold, color: black });
  page.drawText("Feedback", { x: 460, y, size: 9, font: bold, color: black });
  page.drawText("Hours", { x: 525, y, size: 9, font: bold, color: black });
  y -= 14;

  for (const r of rows) {
    if (y < 40) { newPage(); }
    const title = r.title.length > 26 ? r.title.slice(0, 25) + "…" : r.title;
    page.drawText(title, { x: 40, y, size: 9, font: regular, color: black });
    page.drawText(fmtDate(r.date), { x: 200, y, size: 9, font: regular, color: black });
    page.drawText(String(r.registered), { x: 265, y, size: 9, font: regular, color: black });
    page.drawText(String(r.attended), { x: 300, y, size: 9, font: regular, color: black });
    page.drawText(String(r.noShow), { x: 335, y, size: 9, font: regular, color: black });
    page.drawText(r.noShowRate != null ? `${r.noShowRate}%` : "—", { x: 390, y, size: 9, font: regular, color: black });
    page.drawText(r.feedback != null ? `${r.feedback}/10` : "—", { x: 460, y, size: 9, font: regular, color: black });
    page.drawText(r.hours != null ? String(r.hours) : "—", { x: 525, y, size: 9, font: regular, color: black });
    y -= 14;
  }

  const bytes = await doc.save();
  const blob = new Blob([bytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `whmi-cpd-report-${year}.pdf`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "#35A8DD");
  if (!m) return rgb(0.2, 0.5, 0.8);
  return rgb(parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255);
}

export default function Reports({ events, previousEvents, registrations, reflections, primaryHex, secondaryHex, successHex, tags = [], highlightId, onNavigatePage }) {
  const feedbackRef = useRef(null);
  const [expandedChart, setExpandedChart] = useState(null);
  const [feedbackOpenSignal, setFeedbackOpenSignal] = useState(0);
  useEffect(() => {
    if (highlightId === "feedback-section" && feedbackRef.current) {
      feedbackRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [highlightId]);

  const year = new Date().getFullYear();
  const eventsThisYear = [...events, ...previousEvents].filter(ev => new Date(`${ev.date}T00:00:00`).getFullYear() === year);
  const previousEventsThisYear = previousEvents.filter(ev => new Date(`${ev.date}T00:00:00`).getFullYear() === year);
  const eventIdsThisYear = new Set(eventsThisYear.map(ev => ev.id));
  const registrationsThisYear = registrations.filter(r => eventIdsThisYear.has(r.eventId));
  const attendedCount = registrationsThisYear.filter(r => r.attendanceStatus === "Attended").length;
  const noShowCount = registrationsThisYear.filter(r => r.attendanceStatus === "No Show").length;
  const noShowRate = attendedCount + noShowCount === 0 ? null : Math.round((noShowCount / (attendedCount + noShowCount)) * 1000) / 10;
  const attendanceRate = attendedCount + noShowCount === 0 ? null : Math.round((attendedCount / (attendedCount + noShowCount)) * 1000) / 10;
  const feedbackAvg = avgFeedback(reflections, { limit: previousEventsThisYear.length || 1 });

  const trendData = attendanceTrend(previousEvents, registrations, 12);
  const topicData = topicPopularity(previousEvents, tags, { year });
  const hoursData = monthlyHours(previousEvents, 12);
  const feedbackTrendData = feedbackTrend(reflections, 12);

  const rows = reportRows(previousEventsThisYear, registrations, reflections);
  const summary = buildSummary(events, previousEvents, registrations, reflections, year);

  const hoursValues = hoursData.map(d => d.hours);
  const rateValues = trendData.map(d => d.rate).filter(v => v != null);
  const feedbackValues = feedbackTrendData.map(d => d.rating).filter(v => v != null);
  const totalTopicEvents = topicData.reduce((sum, t) => sum + t.events, 0);

  const chartCards = [
    {
      id: "hours", title: "CPD Hours by Month", sub: "Hours delivered, last 12 months", color: primaryHex,
      small: (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={hoursData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} width={28} />
            <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="hours" fill={primaryHex} radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
      render: () => (
        <BarChart data={hoursData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} width={32} />
          <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
          <Bar dataKey="hours" fill={primaryHex} radius={[6, 6, 0, 0]} />
        </BarChart>
      ),
      stats: [
        { label: "Total (12mo)", value: Math.round(hoursValues.reduce((a, b) => a + b, 0) * 10) / 10 },
        { label: "Avg / Month", value: hoursValues.length ? Math.round((hoursValues.reduce((a, b) => a + b, 0) / hoursValues.length) * 10) / 10 : 0 },
        { label: "Busiest Month", value: hoursData.length ? hoursData.reduce((a, b) => b.hours > a.hours ? b : a).month : "—" },
        { label: `CPD Hours (${year})`, value: Math.round(cpdHoursDelivered(previousEvents, { year }) * 10) / 10 },
      ],
    },
    {
      id: "rate", title: "Attendance Rate Trend", sub: "Percentage of registrants who attended, last 12 months", color: secondaryHex,
      small: (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} width={28} />
            <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
            <Line type="monotone" dataKey="rate" stroke={secondaryHex} strokeWidth={2.5} dot={{ r: 3, fill: secondaryHex }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      ),
      render: () => (
        <LineChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} width={32} />
          <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
          <Line type="monotone" dataKey="rate" stroke={secondaryHex} strokeWidth={2.5} dot={{ r: 4, fill: secondaryHex }} connectNulls />
        </LineChart>
      ),
      stats: [
        { label: "Avg Rate", value: rateValues.length ? `${Math.round(rateValues.reduce((a, b) => a + b, 0) / rateValues.length)}%` : "—" },
        { label: "Best Month", value: rateValues.length ? `${trendData.reduce((a, b) => (b.rate ?? -1) > (a.rate ?? -1) ? b : a).month}` : "—" },
        { label: "Worst Month", value: rateValues.length ? `${trendData.filter(d => d.rate != null).reduce((a, b) => b.rate < a.rate ? b : a).month}` : "—" },
        { label: `No-show Rate (${year})`, value: noShowRate != null ? `${noShowRate}%` : "—" },
      ],
    },
    {
      id: "topic", title: "Events by Topic", sub: "Most frequently delivered topics this year", color: successHex,
      small: (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={topicData} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} />
            <YAxis dataKey="topic" type="category" width={70} tick={{ fontSize: 10, fill: "var(--text-dim)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="events" fill={successHex} radius={[0, 5, 5, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
      render: () => (
        <BarChart data={topicData} layout="vertical" margin={{ left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} />
          <YAxis dataKey="topic" type="category" width={100} tick={{ fontSize: 11, fill: "var(--text-dim)" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
          <Bar dataKey="events" fill={successHex} radius={[0, 6, 6, 0]} />
        </BarChart>
      ),
      table: topicData.map(t => ({ label: t.topic, value: `${t.events} event${t.events === 1 ? "" : "s"}${totalTopicEvents ? ` (${Math.round((t.events / totalTopicEvents) * 100)}%)` : ""}` })),
    },
    {
      id: "feedback", title: "Avg. Feedback, Month to Month", sub: "Average reflection rating out of 10, last 12 months", color: primaryHex,
      small: (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={feedbackTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} width={28} />
            <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
            <Line type="monotone" dataKey="rating" stroke={primaryHex} strokeWidth={2.5} dot={{ r: 3, fill: primaryHex }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      ),
      render: () => (
        <LineChart data={feedbackTrendData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} width={32} />
          <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
          <Line type="monotone" dataKey="rating" stroke={primaryHex} strokeWidth={2.5} dot={{ r: 4, fill: primaryHex }} connectNulls />
        </LineChart>
      ),
      stats: [
        { label: "Avg Rating", value: feedbackValues.length ? `${Math.round((feedbackValues.reduce((a, b) => a + b, 0) / feedbackValues.length) * 10) / 10}/10` : "—" },
        { label: "Highest Month", value: feedbackValues.length ? feedbackTrendData.reduce((a, b) => (b.rating ?? -1) > (a.rating ?? -1) ? b : a).month : "—" },
        { label: "Lowest Month", value: feedbackValues.length ? feedbackTrendData.filter(d => d.rating != null).reduce((a, b) => b.rating < a.rating ? b : a).month : "—" },
        { label: `Avg Feedback (${year})`, value: feedbackAvg != null ? `${feedbackAvg}/10` : "—" },
      ],
    },
  ];

  return (
    <div className="whmi-fade-in p-6 max-w-[1400px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="disp text-[22px] font-extrabold">Reports & Analytics</h1>
          <p className="text-[13px]" style={{ color: "var(--text-dim)" }}>Program performance across {year}.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportCsv(rows, year, summary)} className="whmi-btn-ghost flex items-center gap-1.5"><Download size={14} />Export Excel</button>
          <button onClick={() => exportPdf(rows, year, summary, { hoursData, trendData, topicData, feedbackTrendData }, { primaryHex, secondaryHex, successHex })} className="whmi-btn-ghost flex items-center gap-1.5"><Download size={14} />Export PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label={`Total Events (${year})`} value={eventsThisYear.length} icon={Calendar} accent={primaryHex} onClick={onNavigatePage ? () => onNavigatePage("previous") : undefined} />
        <StatCard label="Total Attendees" value={attendedCount} icon={Users} accent={successHex} hoverable />
        <StatCard label="Avg. attendance rate" value={attendanceRate != null ? `${attendanceRate}%` : "—"} icon={AlertCircle} accent={secondaryHex} onClick={() => setExpandedChart(chartCards.find(c => c.id === "rate"))} />
        <StatCard label="Avg. Feedback" value={feedbackAvg != null ? `${feedbackAvg} / 10` : "—"} icon={TrendingUp} accent={primaryHex} onClick={() => { setFeedbackOpenSignal(s => s + 1); feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }} />
      </div>

      <div ref={feedbackRef}>
        <AllFeedbackPanel events={previousEventsThisYear} reflections={reflections} defaultOpen={highlightId === "feedback-section"} forceOpenSignal={feedbackOpenSignal} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {chartCards.map(c => (
          <ChartCard key={c.id} title={c.title} sub={c.sub} onClick={() => setExpandedChart(c)}>
            {c.small}
          </ChartCard>
        ))}
      </div>

      <ChartDetailModal chart={expandedChart} onClose={() => setExpandedChart(null)} primaryHex={primaryHex} secondaryHex={secondaryHex} successHex={successHex} />
    </div>
  );
}
