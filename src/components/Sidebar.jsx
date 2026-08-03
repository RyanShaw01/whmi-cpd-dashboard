import { ChevronRight, ChevronLeft } from "lucide-react";

export default function Sidebar({ page, setPage, collapsed, setCollapsed, navItems, homePage, width, badgePages = {} }) {
  return (
    <div className="whmi-sidebar shrink-0 flex flex-col h-screen sticky top-0" style={{ width }}>
      <button onClick={() => setPage(homePage)} className="flex flex-col items-center gap-1 px-3 py-4 w-full" style={{ borderBottom: "1px solid var(--border)" }} title="Go to home">
        {collapsed
          ? <div className="whmi-logo-icon" style={{ width: 28, height: 16 }} />
          : (
            <>
              <div className="whmi-logo-full" style={{ width: 108, height: 55 }} />
              <div className="text-[9px] font-extrabold tracking-wide" style={{ color: "var(--text-faint)" }}>MEDICAL IMAGING CPD DASHBOARD</div>
            </>
          )}
      </button>

      <nav data-tour="sidebar-nav" className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto whmi-scroll">
        {navItems.map(n => (
          <button
            key={n.id}
            onClick={() => setPage(n.id)}
            title={collapsed ? n.label : undefined}
            className={`whmi-side-btn relative ${page === n.id ? "active" : ""}`}
            style={{ justifyContent: collapsed ? "center" : "flex-start" }}
          >
            <span className="relative shrink-0">
              <n.icon size={16} />
              {badgePages[n.id] && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: "#D9534F" }} />
              )}
            </span>
            {!collapsed && <span className="truncate">{n.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-2.5" style={{ borderTop: "1px solid var(--border)" }}>
        <button onClick={() => setCollapsed(!collapsed)} className="whmi-side-btn justify-center">
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
        </button>
      </div>
    </div>
  );
}
