import { Sun, Moon, Eye, X } from "lucide-react";
import CharacterAvatar from "./CharacterAvatar";
import SearchDropdown from "./SearchDropdown";
import NotificationBell from "./NotificationBell";

export default function HeaderBar({
  page, dark, setDark, navItems, user, onAvatarClick, events, previousEvents, staffDirectory, openEvent, openStaff,
  openArchiveEvent, certificates, reflections, files, onNavigatePage,
  canManage, notificationGroups, redDotsEnabled, onNavigateNotification, onAcknowledgeGroup, onAcknowledgeAll,
  showSearch = true, previewSession, onExitPreview,
}) {
  const current = navItems.find(n => n.id === page);
  const title = current ? current.label : "WHMI CPD Dashboard";
  return (
    <>
      {previewSession && (
        <div className="flex items-center justify-between px-6 py-2 gap-3" style={{ background: "#D9534F", color: "white" }}>
          <div className="flex items-center gap-1.5 text-[12.5px] font-semibold"><Eye size={14} />Previewing as {previewSession.name} ({previewSession.userType === "external" ? "external" : "internal"} viewer)</div>
          <button onClick={onExitPreview} className="flex items-center gap-1 text-[12px] font-semibold" style={{ opacity: 0.9 }}><X size={13} />Exit preview</button>
        </div>
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
          <div data-tour="header-notifications">
            <NotificationBell
              groups={notificationGroups} redDotsEnabled={redDotsEnabled}
              onNavigate={onNavigateNotification} onAcknowledgeGroup={onAcknowledgeGroup} onAcknowledgeAll={onAcknowledgeAll}
            />
          </div>
        )}
        <button onClick={() => setDark(!dark)} className="whmi-btn-ghost !p-2" title="Toggle theme">
          {dark ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <button data-tour="header-profile" onClick={onAvatarClick} title="Your profile">
          <CharacterAvatar avatarId={user.avatarId} color={user.avatarColor} size={32} />
        </button>
      </div>
    </div>
    </>
  );
}
