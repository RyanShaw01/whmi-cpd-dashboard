export default function StatCard({ label, value, sub, icon: Icon, accent }) {
  return (
    <div className="whmi-card p-4 relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[12px] font-semibold" style={{ color: "var(--text-dim)" }}>{label}</div>
          <div className="disp text-[26px] font-extrabold mt-1" style={{ color: "var(--text)" }}>{value}</div>
          {sub && <div className="text-[11px] mt-1 flex items-center gap-1" style={{ color: "var(--text-faint)" }}>{sub}</div>}
        </div>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: accent + "22" }}>
          <Icon size={17} style={{ color: accent }} />
        </div>
      </div>
    </div>
  );
}
