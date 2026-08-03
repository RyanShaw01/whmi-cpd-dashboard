import { Link } from "react-router-dom";
import { Clock, CalendarClock, Award, MessageSquareText } from "lucide-react";
import StatCard from "./StatCard";
import { myCertificates, myCpdTotals, outstandingReflectionsForUser } from "../lib/helpers";

// Landing-page stat row for viewers/externals: total CPD, CPD this year, certificates, and
// outstanding reflections (with a notification dot + one-click jump into the reflection form
// for the oldest outstanding event).
export default function PersonalStatsRow({ user, certificates, events, registrations, reflections, onNavigateCertificates }) {
  const { total, thisYear } = myCpdTotals(certificates, user);
  const certCount = myCertificates(certificates, user).length;
  const outstanding = outstandingReflectionsForUser(events, registrations, reflections, user);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Total CPD Hours" value={total} icon={Clock} accent="var(--accent-primary)" />
      <StatCard label="CPD Hours This Year" value={thisYear} icon={CalendarClock} accent="var(--accent-success)" />
      {onNavigateCertificates ? (
        <button onClick={onNavigateCertificates} className="text-left">
          <StatCard label="Certificates" value={certCount} icon={Award} accent="var(--accent-secondary)" />
        </button>
      ) : (
        <StatCard label="Certificates" value={certCount} icon={Award} accent="var(--accent-secondary)" />
      )}
      <div className="relative">
        {outstanding.length > 0 ? (
          <Link to={`/event/${outstanding[0].id}/reflect`} className="block relative">
            <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full z-10" style={{ background: "#D9534F" }} />
            <StatCard label="Outstanding Reflections" value={outstanding.length} icon={MessageSquareText} accent="#D9534F" />
          </Link>
        ) : (
          <StatCard label="Outstanding Reflections" value={0} icon={MessageSquareText} accent="var(--accent-primary)" />
        )}
      </div>
    </div>
  );
}
