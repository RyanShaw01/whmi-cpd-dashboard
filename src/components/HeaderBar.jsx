import { useState, useRef, useEffect } from "react";
import { Sun, Moon, MoonStar, Eye, X, ChevronDown } from "lucide-react";
import CharacterAvatar from "./CharacterAvatar";
import SearchDropdown from "./SearchDropdown";
import NotificationBell from "./NotificationBell";

const THEME_OPTIONS = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "navy", label: "Navy", icon: MoonStar },
];

function ThemeMenu({ theme, setTheme, mainTheme, setMainTheme }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const CurrentIcon = THEME_OPTIONS.find(o => o.id === theme)?.icon || Sun;

  return (
    <div className="relative" ref={rootRef}>
      <button onClick={() => setOpen(o => !o)} className="whmi-btn-ghost !p-2 flex items-center gap-0.5" title="Theme">
        <CurrentIcon size={15} /><ChevronDown size={11} style={{ opacity: 0.6 }} />
      </button>
      {open && (
        <div className="absolute right-0 top-11 whmi-card w-64 p-3 whmi-fade-in z-50">
          <div className="text-[10.5px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-faint)" }}>Sidebar &amp; Header</div>
          <div className="flex gap-1.5 mb-3">
            {THEME_OPTIONS.map(o => (
              <button
                key={o.id} onClick={() => setTheme(o.id)}
                className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-lg text-[10.5px] font-semibold"
                style={theme === o.id ? { background: "var(--accent-primary)", color: "white" } : { background: "var(--surface-2)", color: "var(--text-dim)" }}
              >
                <o.icon size={13} />{o.label}
              </button>
            ))}
          </div>
          <div className="text-[10.5px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-faint)" }}>Main Page</div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setMainTheme(null)}
              className="flex-1 py-1.5 rounded-lg text-[10.5px] font-semibold"
              style={mainTheme == null ? { background: "var(--accent-primary)", color: "white" } : { background: "var(--surface-2)", color: "var(--text-dim)" }}
            >
              Match
            </button>
            {THEME_OPTIONS.map(o => (
              <button
                key={o.id} onClick={() => setMainTheme(o.id)}
                className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-lg text-[10.5px] font-semibold"
                style={mainTheme === o.id ? { background: "var(--accent-primary)", color: "white" } : { background: "var(--surface-2)", color: "var(--text-dim)" }}
              >
                <o.icon size={13} />{o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HeaderBar({
  page, theme, setTheme, mainTheme, setMainTheme, navItems, user, onAvatarClick, events, previousEvents, staffDirectory, openEvent, openStaff,
  openArchiveEvent, certificates, reflections, files, onNavigatePage,
  canManage, notificationGroups, redDotsEnabled, onNavigateNotification, onAcknowledgeGroup, onAcknowledgeAll,
  showSearch = true, previewSession, onExitPreview, testAccounts = [], onPreviewAs,
}) {
  const [previewMenuOpen, setPreviewMenuOpen] = useState(false);
  const current = navItems.find(n => n.id === page);
  const title = current ? current.label : "WHMI CPD Dashboard";
  return (
    <>
      {previewSession && (
        <button
          onClick={onExitPreview}
          className="whmi-preview-banner sticky top-0 z-40 w-full flex items-center justify-between px-6 py-2 gap-3 text-left transition"
          style={{ background: "#D9534F", color: "white" }}
          title="Click anywhere to exit preview"
        >
          <span className="flex items-center gap-1.5 text-[12.5px] font-semibold"><Eye size={14} />Previewing as {previewSession.name} ({previewSession.userType === "external" ? "external" : "internal"} viewer)</span>
          <span className="flex items-center gap-1 text-[12px] font-semibold" style={{ opacity: 0.9 }}><X size={13} />Exit preview</span>
        </button>
      )}
    <div className="flex items-center justify-between px-6 py-3 gap-4" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
      <div className="disp font-bold text-[15px] truncate">{title}</div>
      <div className="flex items-center gap-2 shrink-0">
        {showSearch && (
          <div data-tour="header-search">
            <SearchDropdown
              events={events} previousEvents={previousEvents} staffDirectory={staffDirectory} openEvent={openEvent} openStaff={openStaff}
              openArchiveEvent={openArchiveEvent} certificates={certificates} reflections={reflections} files={files} onNavigatePage={onNavigatePage}
            />
          </div>
        )}
        {canManage && (
          <div className="relative">
            <button onClick={() => setPreviewMenuOpen(o => !o)} className="whmi-btn-ghost !p-2" title="Preview as a test account">
              <Eye size={15} />
            </button>
            {previewMenuOpen && (
              <div className="fixed inset-0 z-50" onClick={() => setPreviewMenuOpen(false)}>
                <div className="absolute top-14 right-6 whmi-card w-64 p-2 whmi-fade-in" onClick={e => e.stopPropagation()}>
                  <div className="text-[10.5px] font-bold uppercase tracking-wide px-2 pt-1 pb-2" style={{ color: "var(--text-faint)" }}>Preview as</div>
                  {testAccounts.length === 0 && (
                    <div className="text-[11.5px] px-2 pb-2" style={{ color: "var(--text-faint)" }}>No test accounts yet. Create one in Settings.</div>
                  )}
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {testAccounts.map(t => (
                      <button
                        key={t.id}
                        onClick={() => { onPreviewAs(previewSession?.id === t.id ? null : t); setPreviewMenuOpen(false); }}
                        className="w-full flex items-center gap-2 p-2 rounded-lg text-left whmi-row-hover"
                        style={previewSession?.id === t.id ? { background: "var(--surface-2)" } : undefined}
                      >
                        <CharacterAvatar avatarId={t.avatarId} color={t.avatarColor} size={24} />
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] font-semibold truncate">{t.name}</div>
                          <div className="text-[10px] truncate" style={{ color: "var(--text-faint)" }}>{t.userType === "external" ? "External viewer" : "Internal viewer"}</div>
                        </div>
                        {previewSession?.id === t.id && <span className="text-[10px] font-semibold" style={{ color: "var(--accent-primary)" }}>Active</span>}
                      </button>
                    ))}
                  </div>
                  {previewSession && (
                    <button onClick={() => { onPreviewAs(null); setPreviewMenuOpen(false); }} className="whmi-btn-ghost w-full flex items-center justify-center gap-1.5 mt-1 text-[11.5px]">
                      <X size={12} />Exit preview
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        <ThemeMenu theme={theme} setTheme={setTheme} mainTheme={mainTheme} setMainTheme={setMainTheme} />
        <div data-tour="header-notifications">
          <NotificationBell
            groups={notificationGroups} redDotsEnabled={redDotsEnabled}
            onNavigate={onNavigateNotification} onAcknowledgeGroup={onAcknowledgeGroup} onAcknowledgeAll={onAcknowledgeAll}
          />
        </div>
        <button data-tour="header-profile" onClick={onAvatarClick} title="Your profile" className="flex items-center gap-1.5 whmi-row-hover rounded-full p-1 -m-1">
          <span className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-[11.5px] font-semibold truncate max-w-[140px]">{user.name}</span>
            <span className="text-[10px] font-semibold" style={{ color: "var(--text-faint)" }}>
              {user.userType === "external" ? "External" : user.role === "admin" ? "Admin" : user.role === "owner" ? "Owner" : "Viewer"}
            </span>
          </span>
          <CharacterAvatar avatarId={user.avatarId} color={user.avatarColor} size={32} />
        </button>
      </div>
    </div>
    </>
  );
}
