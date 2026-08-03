import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Download, Calendar, Users, AlertCircle, TrendingUp } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import StatCard from "../components/StatCard";
import { attendanceTrend, topicPopularity, monthlyHours, eventAttendedCount, avgFeedback } from "../lib/analytics";
import { eventCpdHours, fmtDate } from "../lib/helpers";

function reportRows(previousEvents, registrations, reflections) {
  return previousEvents.map(ev => {
    const regs = registrations.filter(r => r.eventId === ev.id);
    return {
      title: ev.title, date: ev.date, topic: ev.topic,
      registered: regs.filter(r => r.attendanceStatus !== "Cancelled").length,
      attended: eventAttendedCount(ev.id, registrations),
      noShow: regs.filter(r => r.attendanceStatus === "No Show").length,
      feedback: avgFeedback(reflections.filter(r => r.eventId === ev.id), { limit: 1 }),
      hours: eventCpdHours(ev.start, ev.end),
    };
  });
}

function exportCsv(rows, year) {
  const headers = ["Event", "Date", "Topic", "Registered", "Attended", "No-show", "Avg Feedback (/10)", "CPD Hours"];
  const csv = [headers, ...rows.map(r => [r.title, r.date, r.topic, r.registered, r.attended, r.noShow, r.feedback ?? "", r.hours ?? ""])]
    .map(row => row.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `whmi-cpd-report-${year}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function exportPdf(rows, year, stats) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4 portrait
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const black = rgb(0.1, 0.1, 0.1);
  let y = 800;

  page.drawText(`WHMI CPD Report, ${year}`, { x: 40, y, size: 18, font: bold, color: black });
  y -= 28;
  page.drawText(`Generated ${new Date().toLocaleDateString("en-AU")}`, { x: 40, y, size: 10, font: regular, color: black });
  y -= 24;

  stats.forEach(s => {
    page.drawText(`${s.label}: ${s.value}`, { x: 40, y, size: 11, font: regular, color: black });
    y -= 16;
  });
  y -= 12;

  page.drawText("Event", { x: 40, y, size: 9, font: bold, color: black });
  page.drawText("Date", { x: 220, y, size: 9, font: bold, color: black });
  page.drawText("Reg.", { x: 290, y, size: 9, font: bold, color: black });
  page.drawText("Att.", { x: 330, y, size: 9, font: bold, color: black });
  page.drawText("No-show", { x: 370, y, size: 9, font: bold, color: black });
  page.drawText("Feedback", { x: 430, y, size: 9, font: bold, color: black });
  page.drawText("Hours", { x: 500, y, size: 9, font: bold, color: black });
  y -= 14;

  for (const r of rows) {
    if (y < 40) { y = 800; doc.addPage([595, 842]); }
    const title = r.title.length > 30 ? r.title.slice(0, 29) + "…" : r.title;
    page.drawText(title, { x: 40, y, size: 9, font: regular, color: black });
    page.drawText(fmtDate(r.date), { x: 220, y, size: 9, font: regular, color: black });
    page.drawText(String(r.registered), { x: 290, y, size: 9, font: regular, color: black });
    page.drawText(String(r.attended), { x: 330, y, size: 9, font: regular, color: black });
    page.drawText(String(r.noShow), { x: 370, y, size: 9, font: regular, color: black });
    page.drawText(r.feedback != null ? `${r.feedback}/10` : "—", { x: 430, y, size: 9, font: regular, color: black });
    page.drawText(r.hours != null ? String(r.hours) : "—", { x: 500, y, size: 9, font: regular, color: black });
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

export default function Reports({ events, previousEvents, registrations, reflections, primaryHex, secondaryHex, successHex, tags = [] }) {
  const year = new Date().getFullYear();
  const eventsThisYear = [...events, ...previousEvents].filter(ev => new Date(`${ev.date}T00:00:00`).getFullYear() === year);
  const previousEventsThisYear = previousEvents.filter(ev => new Date(`${ev.date}T00:00:00`).getFullYear() === year);
  const eventIdsThisYear = new Set(eventsThisYear.map(ev => ev.id));
  const registrationsThisYear = registrations.filter(r => eventIdsThisYear.has(r.eventId));
  const attendedCount = registrationsThisYear.filter(r => r.attendanceStatus === "Attended").length;
  const noShowCount = registrationsThisYear.filter(r => r.attendanceStatus === "No Show").length;
  const noShowRate = attendedCount + noShowCount === 0 ? null : Math.round((noShowCount / (attendedCount + noShowCount)) * 1000) / 10;
  const feedbackAvg = avgFeedback(reflections, { limit: previousEventsThisYear.length || 1 });

  const trendData = attendanceTrend(previousEvents, registrations);
  const topicData = topicPopularity(previousEvents, tags, { year });
  const hoursData = monthlyHours(previousEvents);

  const rows = reportRows(previousEventsThisYear, registrations, reflections);
  const statsForExport = [
    { label: "Total Events", value: eventsThisYear.length },
    { label: "Total Attendance", value: attendedCount },
    { label: "No-show Rate", value: noShowRate != null ? `${noShowRate}%` : "—" },
    { label: "Avg. Feedback", value: feedbackAvg != null ? `${feedbackAvg} / 10` : "—" },
  ];

  return (
    <div className="whmi-fade-in p-6 max-w-[1400px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="disp text-[22px] font-extrabold">Reports & Analytics</h1>
          <p className="text-[13px]" style={{ color: "var(--text-dim)" }}>Program performance across {year}.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportCsv(rows, year)} className="whmi-btn-ghost flex items-center gap-1.5"><Download size={14} />Export Excel</button>
          <button onClick={() => exportPdf(rows, year, statsForExport)} className="whmi-btn-ghost flex items-center gap-1.5"><Download size={14} />Export PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label={`Total Events (${year})`} value={eventsThisYear.length} icon={Calendar} accent={primaryHex} />
        <StatCard label="Total Attendance" value={attendedCount} icon={Users} accent={successHex} />
        <StatCard label="No-show Rate" value={noShowRate != null ? `${noShowRate}%` : "—"} icon={AlertCircle} accent={secondaryHex} />
        <StatCard label="Avg. Feedback" value={feedbackAvg != null ? `${feedbackAvg} / 10` : "—"} icon={TrendingUp} accent={primaryHex} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="whmi-card p-5">
          <h2 className="disp text-[15px] font-bold mb-1">Attendance Rate Trend</h2>
          <p className="text-[11.5px] mb-3" style={{ color: "var(--text-faint)" }}>Percentage of registrants who attended</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="rate" stroke={secondaryHex} strokeWidth={2.5} dot={{ r: 3, fill: secondaryHex }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="whmi-card p-5">
          <h2 className="disp text-[15px] font-bold mb-1">Events by Topic</h2>
          <p className="text-[11.5px] mb-3" style={{ color: "var(--text-faint)" }}>Most frequently delivered topics this year</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topicData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="topic" type="category" width={80} tick={{ fontSize: 11, fill: "var(--text-dim)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="events" fill={successHex} radius={[0, 5, 5, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="whmi-card p-5">
        <h2 className="disp text-[15px] font-bold mb-1">CPD Hours by Month</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={hoursData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="hours" fill={primaryHex} radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
