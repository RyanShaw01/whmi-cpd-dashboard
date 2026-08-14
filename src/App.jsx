import { useState, useEffect, useMemo } from "react";
import { Routes, Route } from "react-router-dom";
import LoginScreen from "./pages/LoginScreen";
import Dashboard from "./pages/Dashboard";
import MyCpd from "./pages/MyCpd";
import ExternalDashboard from "./pages/ExternalDashboard";
import MyCertificates from "./pages/MyCertificates";
import UpcomingEvents from "./pages/UpcomingEvents";
import PreviousEvents from "./pages/PreviousEvents";
import StaffDirectory, { blankStaff } from "./pages/StaffDirectory";
import Reports from "./pages/Reports";
import Certificates from "./pages/Certificates";
import Settings from "./pages/Settings";
import HelpCentre from "./pages/HelpCentre";
import PublicEventPage from "./pages/PublicEventPage";
import ReflectionPage from "./pages/ReflectionPage";
import Brainstorming from "./pages/Brainstorming";
import Reflection from "./pages/Reflection";
import BrainstormSubmitPage from "./pages/BrainstormSubmitPage";
import SuggestIdeaModal from "./components/SuggestIdeaModal";
import Onboarding from "./pages/Onboarding";
import Sidebar from "./components/Sidebar";
import HeaderBar from "./components/HeaderBar";
import OnboardingTour from "./components/OnboardingTour";
import ProfileMenu from "./components/ProfileMenu";
import EventDetailModal from "./components/EventDetailModal";
import PreviousEventDetailModal from "./components/PreviousEventDetailModal";
import StaffModal from "./components/StaffModal";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";
import Toast from "./components/Toast";
import RegisterEventModal from "./components/RegisterEventModal";
import RegistrationSuccessCard from "./components/RegistrationSuccessCard";
import EventFormModal from "./components/EventFormModal";
import CreateCertificateModal from "./components/CreateCertificateModal";
import { BRAND_HEX, CHARACTERS, NAV_FULL, NAV_VIEWER, NAV_VIEWER_INTERNAL, DEFAULT_LAYOUT, DEFAULT_STAFF_FIELD_VISIBILITY } from "./data/mockData";
import { TOUR_STEPS } from "./data/tourSteps";
import { loadPersonal, savePersonal } from "./lib/storage";
import { buildNotificationGroups, buildViewerNotificationGroups } from "./lib/notifications";
import { eventAttendedCount, eventAvgRating } from "./lib/analytics";
import { eventBannerFile, eventCpdHours, isRecentlyCompleted } from "./lib/helpers";
import { supabase, supabaseConfigured } from "./lib/supabaseClient";
import {
  fetchUsers, fetchStaff, fetchEvents, fetchPreviousEvents, fetchCertificates, fetchRegistrations, fetchExternalParticipants,
  insertUser, updateUser, deleteUser, insertStaff, updateStaff, deleteStaff, updateEventStatus, insertEvent, updateEvent, deleteEvent as deleteEventRow,
  updateCertificateStatus, deleteCertificate as deleteCertificateRow, insertRegistration, updateRegistration, deleteRegistration, insertExternalParticipant, updateExternalParticipant, deleteExternalParticipant,
  fetchReflections, insertReflection, deleteReflection, fetchDismissedPairs, insertDismissedPair,
  fetchAllFiles, deleteEventFile, duplicateEventFile, logAudit, fetchLoginEmail, insertLoginEmail, fetchUserById, fetchUserByEmail, revokeUserSession,
  fetchCpdTypes, insertCpdType, updateCpdType, deleteCpdType, sendCertificateEmail,
  fetchTags, insertTag, updateTag, deleteTag, fetchAuditLog, sendReflectionReminder, sendThankYouEmail, sendPresenterThankYou,
  fetchAvatarIcons, insertAvatarIcon, updateAvatarIcon, deleteAvatarIcon, uploadAvatarIconImage,
  fetchAvatarColors, insertAvatarColor, updateAvatarColor, deleteAvatarColor,
  fetchBrainstormIdeas, insertBrainstormIdea, deleteBrainstormIdea, updateBrainstormIdea,
  fetchAppSetting, upsertAppSetting,
  fetchPersonalReflections, insertPersonalReflection, deletePersonalReflection, emailReflectionCopy, emailReflectionsReport, sendRegistrationConfirmation,
} from "./lib/db";
import { setAvatarIcons as setRegistryIcons, setAvatarColors as setRegistryColors } from "./lib/avatarRegistry";
import Footer from "./components/Footer";

const WH_DOMAIN = "@wh.org.au";

export default function App() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(null);
  const [users, setUsers] = useState([]);
  const [staffDirectory, setStaffDirectory] = useState([]);
  const [events, setEvents] = useState([]);
  const [previousEvents, setPreviousEvents] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [externalParticipants, setExternalParticipants] = useState([]);
  const [reflections, setReflections] = useState([]);
  const [files, setFiles] = useState([]);
  const [cpdTypes, setCpdTypes] = useState([]);
  const [tags, setTags] = useState([]);
  const [avatarIcons, setAvatarIcons] = useState([]);
  const [avatarColors, setAvatarColors] = useState([]);
  const [brainstormIdeas, setBrainstormIdeas] = useState([]);
  const [staffFieldVisibility, setStaffFieldVisibility] = useState(DEFAULT_STAFF_FIELD_VISIBILITY);
  // Admin-editable subject/heading/intro overrides for the most commonly-sent emails, keyed by
  // template id (see EMAIL_TEMPLATE_DEFS in Settings.jsx) — read by the edge functions before
  // falling back to their hardcoded copy.
  const [emailTemplateOverrides, setEmailTemplateOverrides] = useState({});
  const [personalReflections, setPersonalReflections] = useState([]);
  const [suggestIdeaOpen, setSuggestIdeaOpen] = useState(false);
  const [auditLog, setAuditLog] = useState([]);
  // Writes to the DB and optimistically prepends locally so the Dashboard's Recent Activity
  // feed reflects actions immediately, without waiting for a reload.
  const pushAudit = (entry) => {
    logAudit(entry);
    setAuditLog(prev => [
      { id: "temp" + Date.now() + Math.random().toString(36).slice(2, 6), createdAt: new Date().toISOString(), entityType: null, entityId: null, details: null, ...entry },
      ...prev,
    ].slice(0, 50));
  };
  const [dismissedRegistrationPairs, setDismissedRegistrationPairs] = useState(new Set());
  const [dismissedReflectionPairs, setDismissedReflectionPairs] = useState(new Set());
  const [acknowledged, setAcknowledged] = useState(new Set());
  const [redDotsEnabled, setRedDotsEnabled] = useState(true);
  const [colorPrefs, setColorPrefs] = useState({ primary: "blue", secondary: "purple", success: "green" });
  const [layoutOrder, setLayoutOrder] = useState(DEFAULT_LAYOUT);
  // sessionStorage (not localStorage) so a reload of the same tab stays put, but opening a
  // fresh tab/window — a genuinely new visit — starts clean on the dashboard.
  const [page, setPage] = useState(() => {
    try { return sessionStorage.getItem("whmi_last_page") || "dashboard"; } catch { return "dashboard"; }
  });
  useEffect(() => {
    try { sessionStorage.setItem("whmi_last_page", page); } catch { /* ignore (private browsing etc) */ }
  }, [page]);
  // Validate the restored page against the signed-in role once login resolves — a page id
  // restored from a previous session/role (e.g. "staff" for a viewer) would otherwise render blank.
  useEffect(() => {
    if (!session?.onboarded) return;
    const viewerNav = session.userType === "internal" ? NAV_VIEWER_INTERNAL : NAV_VIEWER;
    const validIds = new Set((session.role === "viewer" ? viewerNav : NAV_FULL).map(n => n.id));
    if (!validIds.has(page)) setPage(session.role === "viewer" ? "mycpd" : "dashboard");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, session?.onboarded]);
  const [highlightId, setHighlightId] = useState(null);
  const [theme, setTheme] = useState("light"); // "light" | "dark" | "navy"
  const [mainTheme, setMainTheme] = useState(null); // null = match `theme`, else "light" | "dark" | "navy"
  const [cardTheme, setCardTheme] = useState(null); // null = match page theme, else "light" | "dark" | "navy" — applies to card/popup/form surfaces only
  const [collapsed, setCollapsed] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventInitialTab, setEventInitialTab] = useState(null);
  const [eventInitialEditing, setEventInitialEditing] = useState(false);
  const [eventHighlightMissing, setEventHighlightMissing] = useState(false);
  const [registrationSuccessEvent, setRegistrationSuccessEvent] = useState(null);
  const [selectedArchiveEvent, setSelectedArchiveEvent] = useState(null);
  const [archiveInitialTab, setArchiveInitialTab] = useState(null);
  const [archiveInitialEditing, setArchiveInitialEditing] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [highlightRegIds, setHighlightRegIds] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (message) => setToast(message);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [registerDefaultEventId, setRegisterDefaultEventId] = useState(null);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [createPreviousEventOpen, setCreatePreviousEventOpen] = useState(false);
  const [createCertificateOpen, setCreateCertificateOpen] = useState(false);
  const [certificatePrefill, setCertificatePrefill] = useState(null);
  const [showTour, setShowTour] = useState(false);
  const [previewSession, setPreviewSession] = useState(null);

  // Personal (per-browser) prefs, unrelated to auth, safe to load immediately.
  useEffect(() => {
    (async () => {
      const [loadedColors, loadedLayout] = await Promise.all([
        loadPersonal("color-prefs", null), loadPersonal("dashboard-layout", null),
      ]);
      if (loadedColors) setColorPrefs(loadedColors);
      if (loadedLayout) setLayoutOrder(loadedLayout);
    })();
  }, []);

  // Resolves a verified Supabase Auth user to an app `users` row, creating one on first
  // login. Checks login_emails first (covers both primary + secondary emails, and any
  // account that's already completed a real login), then falls back to "claiming" a
  // pre-existing users row by email match (seed data, or an account created via the
  // public no-login registration flow / admin Settings) before creating a brand-new one.
  const resolveOrCreateProfile = async (authUser) => {
    const email = authUser.email.toLowerCase();
    const mapping = await fetchLoginEmail(email);
    if (mapping) {
      let profile = await fetchUserById(mapping.user_id);
      if (profile && !profile.authId) {
        await updateUser(profile.id, { authId: authUser.id });
        profile = { ...profile, authId: authUser.id };
      }
      return profile;
    }
    const existing = await fetchUserByEmail(email);
    if (existing) {
      await updateUser(existing.id, { authId: authUser.id });
      await insertLoginEmail(email, existing.id);
      return { ...existing, authId: authUser.id };
    }
    const isWh = email.endsWith(WH_DOMAIN);
    const brandColors = Object.keys(BRAND_HEX);
    const newUser = {
      id: "u" + Date.now(), name: email.split("@")[0], email: authUser.email, role: "viewer",
      staffId: null, avatarId: CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)].id,
      avatarColor: brandColors[Math.floor(Math.random() * brandColors.length)],
      authId: authUser.id, userType: isWh ? "internal" : "external", verified: isWh, onboarded: false,
    };
    await insertUser(newUser);
    await insertLoginEmail(email, newUser.id);
    return newUser;
  };

  const loadAppData = async () => {
    const [
      userList, staffList, eventList, prevEventList, certList, regList, externalList, reflectionList, fileList,
      dismissedRegList, dismissedRefList, cpdTypeList, tagList, auditLogList, avatarIconList, avatarColorList, brainstormIdeaList,
      staffFieldVisibilitySetting, personalReflectionList, emailTemplateOverridesSetting,
    ] = await Promise.all([
      fetchUsers(), fetchStaff(), fetchEvents(), fetchPreviousEvents(), fetchCertificates(), fetchRegistrations(), fetchExternalParticipants(),
      fetchReflections(), fetchAllFiles(), fetchDismissedPairs("registration"), fetchDismissedPairs("reflection"), fetchCpdTypes(), fetchTags(),
      fetchAuditLog(50), fetchAvatarIcons(), fetchAvatarColors(), fetchBrainstormIdeas(),
      fetchAppSetting("staff_field_visibility"), fetchPersonalReflections(), fetchAppSetting("email_template_overrides"),
    ]);
    setAvatarIcons(avatarIconList);
    setAvatarColors(avatarColorList);
    setRegistryIcons(avatarIconList);
    setRegistryColors(avatarColorList);
    setUsers(userList);
    setStaffDirectory(staffList);
    setEvents(eventList);
    setPreviousEvents(prevEventList);
    setCertificates(certList);
    setRegistrations(regList);
    setExternalParticipants(externalList);
    setReflections(reflectionList);
    setFiles(fileList);
    setDismissedRegistrationPairs(new Set(dismissedRegList));
    setDismissedReflectionPairs(new Set(dismissedRefList));
    setCpdTypes(cpdTypeList);
    setTags(tagList);
    setAuditLog(auditLogList);
    setBrainstormIdeas(brainstormIdeaList);
    setStaffFieldVisibility({ ...DEFAULT_STAFF_FIELD_VISIBILITY, ...(staffFieldVisibilitySetting || {}) });
    setPersonalReflections(personalReflectionList);
    setEmailTemplateOverrides(emailTemplateOverridesSetting || {});
  };

  const clearAppData = () => {
    setUsers([]); setStaffDirectory([]); setEvents([]); setPreviousEvents([]); setCertificates([]);
    setRegistrations([]); setExternalParticipants([]); setReflections([]); setFiles([]); setCpdTypes([]); setTags([]); setAuditLog([]);
    setAvatarIcons([]); setAvatarColors([]); setBrainstormIdeas([]); setStaffFieldVisibility(DEFAULT_STAFF_FIELD_VISIBILITY);
    setPersonalReflections([]);
    setEmailTemplateOverrides({});
    setDismissedRegistrationPairs(new Set()); setDismissedReflectionPairs(new Set());
  };

  // Real auth state drives everything else; most tables now require a signed-in session
  // to read (RLS, Phase 2), so app data is only fetched once a session exists.
  useEffect(() => {
    if (!supabaseConfigured) { setReady(true); return; }
    let mounted = true;
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, authSession) => {
      if (!mounted) return;
      if (authSession?.user) {
        const profile = await resolveOrCreateProfile(authSession.user);
        if (!mounted || !profile) { setReady(true); return; }
        setSession(profile);
        setTheme(profile.themeMode || "light");
        setMainTheme(profile.mainThemeMode || null);
        setCardTheme(profile.cardThemeMode || null);
        setPage(profile.role === "viewer" ? "mycpd" : "dashboard");
        await loadAppData();
        if (!mounted) return;
        if (event === "SIGNED_IN") pushAudit({ actorId: profile.id, action: "user.login" });
      } else {
        setSession(null);
        clearAppData();
        // `events` (fully) and `files` (flyer-kind rows only, see migration_phase34.sql) are the
        // two tables that stay publicly readable under RLS - the public QR/email-link
        // registration flow depends on both. Fetch them even with no session, or
        // /event/:id and /event/:id/reflect permanently show "Event not found" (and never show
        // a promotional flyer even once that's fixed) for anyone who isn't already logged in,
        // since mainContent's routes render off this same state regardless of which URL matched.
        setEvents(await fetchEvents());
        setFiles(await fetchAllFiles());
      }
      setReady(true);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = (e) => { setIsNarrow(e.matches); if (e.matches) setCollapsed(true); };
    handler(mq);
    if (mq.addEventListener) mq.addEventListener("change", handler); else mq.addListener(handler);
    return () => { if (mq.removeEventListener) mq.removeEventListener("change", handler); else mq.removeListener(handler); };
  }, []);

  const handleLogout = () => {
    if (session) pushAudit({ actorId: session.id, action: "user.logout" });
    setProfileOpen(false);
    setPreviewSession(null);
    supabase?.auth.signOut();
  };
  const handleProfileSave = (updates) => {
    setUsers(prev => prev.map(u => u.id === session.id ? { ...u, ...updates } : u));
    setSession(s => ({ ...s, ...updates }));
    updateUser(session.id, updates);
  };
  // Theme and avatar/colour changes save immediately (account-level, so they follow the
  // user across devices) rather than waiting for the Settings "Save Profile" button.
  const handleSetTheme = (next) => {
    setTheme(next);
    if (session) handleProfileSave({ themeMode: next });
  };
  // null = "match sidebar & header theme"; "light"/"dark"/"navy" = explicit override for the main page only.
  const handleSetMainTheme = (next) => {
    setMainTheme(next);
    if (session) handleProfileSave({ mainThemeMode: next });
  };
  // null = "match the page theme"; "light"/"dark"/"navy" = override for card/popup/form surfaces only.
  const handleSetCardTheme = (next) => {
    setCardTheme(next);
    if (session) handleProfileSave({ cardThemeMode: next });
  };
  const handleCompleteOnboarding = async (updates) => {
    const patch = { ...updates, onboarded: true };
    await updateUser(session.id, patch);
    setUsers(prev => prev.map(u => u.id === session.id ? { ...u, ...patch } : u));
    setSession(s => ({ ...s, ...patch }));
    setShowTour(true);
  };
  // Every admin/owner should show up in the Staff Directory; auto-create and link a
  // standalone staff record the moment a user becomes admin/owner (creation or promotion)
  // if they don't already have one.
  const autoLinkStaffFor = (u) => {
    // Prefer an existing staff record with a matching name (e.g. someone bulk-added as an
    // Owner who was already a staff member under a separate record) over creating a new blank
    // one — otherwise the same person ends up with two records/tiles in the Staff Directory.
    const existing = staffDirectory.find(s => s.name.trim().toLowerCase() === u.name.trim().toLowerCase());
    if (existing) {
      updateUser(u.id, { staffId: existing.id });
      pushAudit({ actorId: session?.id, action: "user.updated", entityType: "user", entityId: u.id, details: { staffId: existing.id } });
      return existing;
    }
    const staffRec = {
      id: "s" + Date.now() + Math.random().toString(36).slice(2, 6), name: u.name,
      profession: "", department: "", campuses: [], hours: 0, attended: 0, certificates: 0,
      modality: "General XR", grade: "Grade 1", qualifiedYear: null, hoursLast3Years: null,
      eventsThisYear: null, lastAttended: null, attendedEventIds: [],
    };
    insertStaff(staffRec);
    setStaffDirectory(prev => [...prev, staffRec]);
    updateUser(u.id, { staffId: staffRec.id });
    pushAudit({ actorId: session?.id, action: "staff.created", entityType: "staff", entityId: staffRec.id, details: { name: staffRec.name } });
    return staffRec;
  };
  // Lets an admin/owner tile in the Staff Directory open the same stats modal as any other
  // staff member — auto-creating and linking their staff record on first click if they don't
  // have one yet, so "check admin/owner stats like other staff" works without a separate flow.
  const handleOpenAdminStaff = (u) => {
    if (u.staffId) {
      const rec = staffDirectory.find(s => s.id === u.staffId);
      if (rec) { openStaff(rec); return; }
    }
    const rec = autoLinkStaffFor(u);
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, staffId: rec.id } : x));
    openStaff(rec);
  };
  const handleUsersChange = (newList) => {
    const prevById = new Map(users.map(u => [u.id, u]));
    const finalList = newList.map(u => {
      const prev = prevById.get(u.id);
      if (!prev) insertUser(u);
      else if (
        prev.role !== u.role || prev.name !== u.name || prev.userType !== u.userType ||
        prev.verified !== u.verified || prev.secondaryEmail !== u.secondaryEmail || prev.certEmailPreference !== u.certEmailPreference
      ) {
        updateUser(u.id, u);
        pushAudit({
          actorId: session?.id, action: "user.updated", entityType: "user", entityId: u.id,
          details: { role: u.role, name: u.name, userType: u.userType, verified: u.verified },
        });
      }
      if (["admin", "owner"].includes(u.role) && !u.staffId) {
        return { ...u, staffId: autoLinkStaffFor(u).id };
      }
      return u;
    });
    setUsers(finalList);
  };
  const handleBackfillStaffLinks = () => {
    const unlinked = users.filter(u => ["admin", "owner"].includes(u.role) && !u.staffId);
    if (unlinked.length === 0) return;
    setUsers(prev => prev.map(u => {
      const needsLink = unlinked.some(x => x.id === u.id);
      return needsLink ? { ...u, staffId: autoLinkStaffFor(u).id } : u;
    }));
  };
  // Same single-field patch Settings' own patchUser does, exposed at the top level so the
  // staff/external cards (Staff Directory) can flip a linked account's type/verified status
  // in place too, not just Settings' user-management list.
  const handlePatchUser = (userId, patch) => handleUsersChange(users.map(u => u.id === userId ? { ...u, ...patch } : u));
  const requestSaveUserContact = (user, patch) => requestConfirm({
    title: "Save contact details?",
    message: `Save the updated email address${"secondaryEmail" in patch ? "es" : ""} for ${user.name}?`,
    confirmLabel: "Save",
    onConfirm: () => {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...patch } : u));
      updateUser(user.id, patch);
      pushAudit({ actorId: session?.id, action: "user.updated", entityType: "user", entityId: user.id, details: patch });
    },
  });
  const handleRevokeSession = async (u, action) => {
    const result = await revokeUserSession(u.authId, action);
    if (result.ok) {
      pushAudit({
        actorId: session?.id, action: action === "restore" ? "user.session_restored" : "user.session_revoked",
        entityType: "user", entityId: u.id, details: { name: u.name },
      });
    }
    return result;
  };
  const handleColorChange = (prefs) => { setColorPrefs(prefs); savePersonal("color-prefs", prefs); };
  const handleLayoutChange = (order) => { setLayoutOrder(order); savePersonal("dashboard-layout", order); };
  const handleStaffSave = (rec) => {
    setStaffDirectory(prev => prev.map(s => s.id === rec.id ? rec : s));
    updateStaff(rec.id, rec);
    setSelectedStaff(rec);
    pushAudit({ actorId: session?.id, action: "staff.updated", entityType: "staff", entityId: rec.id, details: { name: rec.name } });
  };
  const handleStaffCreate = (rec, linkedUserId) => {
    setStaffDirectory(prev => [...prev, rec]);
    insertStaff(rec);
    setSelectedStaff(rec);
    pushAudit({ actorId: session?.id, action: "staff.created", entityType: "staff", entityId: rec.id, details: { name: rec.name } });
    if (linkedUserId) {
      setUsers(prev => prev.map(u => u.id === linkedUserId ? { ...u, staffId: rec.id } : u));
      updateUser(linkedUserId, { staffId: rec.id });
    }
  };
  const handleStatusChange = (newStatus) => {
    if (!selectedEvent) return;
    const fromStatus = selectedEvent.status;
    setEvents(prev => prev.map(e => e.id === selectedEvent.id ? { ...e, status: newStatus } : e));
    setSelectedEvent(ev => ev ? { ...ev, status: newStatus } : ev);
    updateEventStatus(selectedEvent.id, newStatus);
    pushAudit({ actorId: session?.id, action: "event.status_changed", entityType: "event", entityId: selectedEvent.id, details: { from: fromStatus, to: newStatus } });
  };
  const handleApproveCertificate = (cert) => {
    setCertificates(prev => prev.map(c => c.id === cert.id ? { ...c, status: "Sent" } : c));
    updateCertificateStatus(cert.id, "Sent");
    pushAudit({ actorId: session?.id, action: "certificate.approved", entityType: "certificate", entityId: cert.id, details: { staff: cert.staff, event: cert.event } });
  };
  const handleApproveAndSendAll = async (certsToApprove) => {
    const awaiting = certsToApprove || certificates.filter(c => c.status === "Awaiting Approval");
    for (const cert of awaiting) {
      const res = await sendCertificateEmail(cert.id, false);
      if (res.ok) {
        setCertificates(prev => prev.map(c => c.id === cert.id ? { ...c, status: "Sent", sentAt: new Date().toISOString() } : c));
        pushAudit({ actorId: session?.id, action: "certificate.approved", entityType: "certificate", entityId: cert.id, details: { staff: cert.staff, event: cert.event } });
      }
    }
  };
  const handleResendCertificate = async (cert) => {
    const res = await sendCertificateEmail(cert.id, true);
    if (res.ok) {
      setCertificates(prev => prev.map(c => c.id === cert.id ? { ...c, resendCount: (c.resendCount || 0) + 1, lastResentAt: new Date().toISOString() } : c));
      pushAudit({ actorId: session?.id, action: "certificate.resent", entityType: "certificate", entityId: cert.id, details: { staff: cert.staff, event: cert.event } });
    }
  };
  const handleManualCertificateCreated = async () => {
    const certList = await fetchCertificates();
    setCertificates(certList);
    pushAudit({ actorId: session?.id, action: "certificate.created_manual" });
  };
  const handleCreateCertificateForRegistrant = (registration, event) => {
    setCertificatePrefill({
      name: registration.name, email: registration.email, sessionName: event.title,
      date: event.date, cpdHours: eventCpdHours(event.start, event.end) || 1, cpdTypeId: event.cpdTypeId || "",
    });
    setCreateCertificateOpen(true);
  };
  const handleSendReflectionReminder = (registration, event) => requestConfirm({
    title: "Send reflection reminder?",
    message: `Email ${registration.name} (${registration.email}) a reminder to submit their reflection for "${event.title}"?`,
    confirmLabel: "Send",
    onConfirm: async () => {
      const res = await sendReflectionReminder({ name: registration.name, email: registration.email, eventId: event.id, eventTitle: event.title });
      if (res.ok) {
        pushAudit({ actorId: session?.id, action: "reflection.reminder_sent", entityType: "event", entityId: event.id, details: { email: registration.email } });
        const sentAt = new Date().toISOString();
        setRegistrations(prev => prev.map(r => r.id === registration.id ? { ...r, reflectionEmailSentAt: sentAt } : r));
        updateRegistration(registration.id, { reflectionEmailSentAt: sentAt });
        showToast("Reminder sent.");
      } else {
        showToast("Couldn't send the reminder. Please try again.");
      }
    },
  });
  // Bulk version of handleSendReflectionReminder — one confirm, then a reminder to every
  // registrant in the list who hasn't submitted a reflection yet.
  const handleSendAllReflectionReminders = (registrationsList, event) => {
    if (!registrationsList || registrationsList.length === 0) return;
    requestConfirm({
      title: "Send follow-up to everyone?",
      message: `Email ${registrationsList.length} attendee${registrationsList.length === 1 ? "" : "s"} of "${event.title}" a reminder to submit their reflection?`,
      confirmLabel: "Send",
      onConfirm: async () => {
        let sent = 0;
        for (const registration of registrationsList) {
          const res = await sendReflectionReminder({ name: registration.name, email: registration.email, eventId: event.id, eventTitle: event.title });
          if (res.ok) {
            const sentAt = new Date().toISOString();
            setRegistrations(prev => prev.map(r => r.id === registration.id ? { ...r, reflectionEmailSentAt: sentAt } : r));
            updateRegistration(registration.id, { reflectionEmailSentAt: sentAt });
            sent++;
          }
        }
        pushAudit({ actorId: session?.id, action: "reflection.reminder_sent", entityType: "event", entityId: event.id, details: { bulkCount: sent } });
        showToast(`Follow-up sent to ${sent} attendee${sent === 1 ? "" : "s"}.`);
      },
    });
  };
  // "Thanks for attending" send - individual (one id) or bulk (many, plus any opted-in
  // presenters), confirmed inline by the caller (RegistrationsPanel) rather than via the generic
  // confirm modal, since the bulk case needs its own interactive presenter-picker UI. Shares the
  // same reminder_sent_at column as the automated post-event cron, so this can't double-send with
  // that; resends are explicitly allowed since the caller already confirmed.
  const handleSendPostEventEmail = async (event, registrationIds) => {
    if (!registrationIds || registrationIds.length === 0) return { ok: false };
    const res = await sendThankYouEmail({ eventId: event.id, registrationIds });
    if (res.ok) {
      pushAudit({ actorId: session?.id, action: "event.thank_you_sent", entityType: "event", entityId: event.id, details: { sentCount: res.sentCount } });
      const sentAt = res.sentAt || new Date().toISOString();
      const sentIds = new Set(registrationIds);
      setRegistrations(prev => prev.map(r => (r.eventId === event.id && sentIds.has(r.id)) ? { ...r, reminderSentAt: sentAt } : r));
      showToast(res.sentCount > 0 ? `Post-event email sent to ${res.sentCount} recipient${res.sentCount === 1 ? "" : "s"}.` : "Couldn't send - everyone may have already been emailed.");
    } else {
      showToast("Couldn't send the post-event email. Please try again.");
    }
    return res;
  };
  // Presenter-only thank-you, separate wording/flow from handleSendPostEventEmail above - shares
  // the same reminder_sent_at column so a presenter can never receive both this and the bulk
  // attendee thank-you. `presenters` is [{ id, includeCertificate }] - certificate-or-not is
  // decided per presenter, not one flag for the whole batch. Confirmed inline by the caller
  // (PresentersSection), same reasoning as handleSendPostEventEmail above.
  const handleSendPresenterThankYou = async (event, presenters) => {
    if (!presenters || presenters.length === 0) return { ok: false };
    const certCount = presenters.filter(p => p.includeCertificate).length;
    const res = await sendPresenterThankYou({ eventId: event.id, presenters });
    if (res.ok) {
      pushAudit({ actorId: session?.id, action: "event.presenter_thank_you_sent", entityType: "event", entityId: event.id, details: { sentCount: res.sentCount, certCount } });
      const sentAt = res.sentAt || new Date().toISOString();
      const sentIds = new Set(presenters.map(p => p.id));
      setRegistrations(prev => prev.map(r => (r.eventId === event.id && sentIds.has(r.id)) ? { ...r, reminderSentAt: sentAt } : r));
      showToast(res.sentCount > 0 ? `Thank-you email sent to ${res.sentCount} presenter${res.sentCount === 1 ? "" : "s"}.` : "Couldn't send - everyone may have already been emailed.");
    } else {
      showToast("Couldn't send the presenter thank-you email. Please try again.");
    }
    return res;
  };
  const handleSendReflectionsReport = async ({ email, name, entries }) => {
    const res = await emailReflectionsReport({ toEmail: email, toName: name, entries });
    showToast(res.ok ? "Report emailed." : "Couldn't send the report. Please try again.");
  };
  const handleCreateEvent = (payload) => {
    // Recurring events arrive as an array of occurrence payloads (EventForm generates one row
    // per occurrence, all sharing a recurrenceGroupId) instead of a single event object.
    const occurrences = Array.isArray(payload) ? payload : [payload];
    setEvents(prev => [...prev, ...occurrences]);
    occurrences.forEach(ev => insertEvent(ev));
    if (occurrences.length > 1) {
      pushAudit({ actorId: session?.id, action: "event.created", entityType: "event", entityId: occurrences[0].id, details: { title: `${occurrences[0].title} (${occurrences.length} recurring events)` } });
    } else {
      pushAudit({ actorId: session?.id, action: "event.created", entityType: "event", entityId: occurrences[0].id, details: { title: occurrences[0].title } });
    }
  };
  const handleCreatePreviousEvent = (payload) => {
    setPreviousEvents(prev => [...prev, payload]);
    insertEvent(payload);
    pushAudit({ actorId: session?.id, action: "event.created", entityType: "event", entityId: payload.id, details: { title: payload.title } });
  };
  const refreshFiles = () => { fetchAllFiles().then(setFiles); };
  const handleUpdateBannerCrop = (event, bannerFocalX, bannerFocalY, bannerZoom) => {
    const patched = { ...event, bannerFocalX, bannerFocalY, bannerZoom };
    setEvents(prev => prev.map(e => e.id === event.id ? { ...e, bannerFocalX, bannerFocalY, bannerZoom } : e));
    setPreviousEvents(prev => prev.map(e => e.id === event.id ? { ...e, bannerFocalX, bannerFocalY, bannerZoom } : e));
    setSelectedEvent(ev => ev && ev.id === event.id ? { ...ev, bannerFocalX, bannerFocalY, bannerZoom } : ev);
    setSelectedArchiveEvent(ev => ev && ev.id === event.id ? { ...ev, bannerFocalX, bannerFocalY, bannerZoom } : ev);
    updateEvent(event.id, patched).then(ok => { if (!ok) showToast("Couldn't save the banner position — please try again."); });
  };
  const handleRemoveBanner = (event) => {
    const file = eventBannerFile(files, event.id);
    if (!file) return;
    setFiles(prev => prev.filter(f => f.id !== file.id));
    deleteEventFile(file, session?.id);
  };
  const handleUpdateEvent = (payload) => {
    setEvents(prev => prev.map(e => e.id === payload.id ? payload : e));
    setSelectedEvent(payload);
    updateEvent(payload.id, payload).then(ok => { if (!ok) showToast("Couldn't save changes — please try again."); });
    pushAudit({ actorId: session?.id, action: "event.updated", entityType: "event", entityId: payload.id, details: { title: payload.title } });
  };
  // Previous events live in a separate fetched array from `events`; updating that one
  // instead keeps the archive view in sync without needing a refetch.
  const handleUpdatePreviousEvent = (payload) => {
    setPreviousEvents(prev => prev.map(e => e.id === payload.id ? { ...e, ...payload } : e));
    setSelectedArchiveEvent(ev => ev ? { ...ev, ...payload } : ev);
    updateEvent(payload.id, payload).then(ok => { if (!ok) showToast("Couldn't save changes — please try again."); });
    pushAudit({ actorId: session?.id, action: "event.updated", entityType: "event", entityId: payload.id, details: { title: payload.title } });
  };

  // Centralised confirm flow; deletes, and any other "are you sure?" action, route through here.
  const requestDelete = (label, onConfirm) => setConfirmModal({ label, onConfirm });
  const requestConfirm = (opts) => setConfirmModal(opts);
  const closeConfirm = () => setConfirmModal(null);

  const requestDeleteUser = (u) => requestDelete(`the user "${u.name}"`, () => {
    setUsers(prev => prev.filter(x => x.id !== u.id));
    deleteUser(u.id);
  });
  const requestDeleteStaff = (s) => requestDelete(`the staff record for "${s.name}"`, () => {
    setStaffDirectory(prev => prev.filter(x => x.id !== s.id));
    deleteStaff(s.id);
    setSelectedStaff(null);
  });
  const handleSaveExternalParticipant = (participant, patch) => {
    setExternalParticipants(prev => prev.map(p => p.id === participant.id ? { ...p, ...patch } : p));
    updateExternalParticipant(participant.id, patch);
  };
  const requestDeleteExternalParticipant = (p) => requestDelete(`the external participant "${p.name}"`, () => {
    setExternalParticipants(prev => prev.filter(x => x.id !== p.id));
    deleteExternalParticipant(p.id);
  });
  const requestDeleteEvent = (ev) => requestDelete(`the event "${ev.title}"`, () => {
    setEvents(prev => prev.filter(e => e.id !== ev.id));
    deleteEventRow(ev.id);
    setSelectedEvent(null);
    pushAudit({ actorId: session?.id, action: "event.deleted", entityType: "event", entityId: ev.id, details: { title: ev.title } });
  });
  const requestDeletePreviousEvent = (ev) => requestDelete(`the past event "${ev.title}"`, () => {
    setPreviousEvents(prev => prev.filter(e => e.id !== ev.id));
    deleteEventRow(ev.id);
    setSelectedArchiveEvent(null);
    pushAudit({ actorId: session?.id, action: "event.deleted", entityType: "event", entityId: ev.id, details: { title: ev.title } });
  });
  const requestDeletePreviousEvents = (evs) => requestDelete(`${evs.length} selected past event${evs.length === 1 ? "" : "s"}`, () => {
    const ids = new Set(evs.map(e => e.id));
    setPreviousEvents(prev => prev.filter(e => !ids.has(e.id)));
    evs.forEach(ev => {
      deleteEventRow(ev.id);
      pushAudit({ actorId: session?.id, action: "event.deleted", entityType: "event", entityId: ev.id, details: { title: ev.title } });
    });
  });
  const requestDeleteCertificate = (c) => requestDelete(`the certificate for "${c.staff}"`, () => {
    setCertificates(prev => prev.filter(x => x.id !== c.id));
    deleteCertificateRow(c.id);
    pushAudit({ actorId: session?.id, action: "certificate.deleted", entityType: "certificate", entityId: c.id, details: { staff: c.staff } });
  });

  const requestSaveCpdType = (cpdType, isNew) => requestConfirm({
    title: isNew ? "Add CPD type?" : "Save changes?",
    message: `${isNew ? "Add" : "Save"} "${cpdType.name}" (${cpdType.appellationCode}) ${isNew ? "as a new CPD type" : ""}?`,
    confirmLabel: isNew ? "Add" : "Save",
    onConfirm: () => {
      if (isNew) {
        setCpdTypes(prev => [...prev, cpdType]);
        insertCpdType(cpdType);
        pushAudit({ actorId: session?.id, action: "cpd_type.created", entityType: "cpd_type", entityId: cpdType.id, details: { name: cpdType.name } });
        showToast("CPD type added.");
      } else {
        setCpdTypes(prev => prev.map(t => t.id === cpdType.id ? cpdType : t));
        updateCpdType(cpdType.id, cpdType);
        pushAudit({ actorId: session?.id, action: "cpd_type.updated", entityType: "cpd_type", entityId: cpdType.id, details: { name: cpdType.name } });
        showToast("CPD type saved.");
      }
    },
  });
  const handleAddTag = (name) => {
    if (tags.some(t => t.name.toLowerCase() === name.toLowerCase())) return;
    const tag = { id: "tag" + Date.now(), name, sortOrder: tags.length };
    setTags(prev => [...prev, tag]);
    insertTag(tag);
    pushAudit({ actorId: session?.id, action: "tag.created", entityType: "tag", entityId: tag.id, details: { name } });
  };
  const requestSaveTag = (tag, isNew) => requestConfirm({
    title: isNew ? "Add tag?" : "Save changes?",
    message: `${isNew ? "Add" : "Rename to"} "${tag.name}"?`,
    confirmLabel: isNew ? "Add" : "Save",
    onConfirm: () => {
      if (isNew) {
        setTags(prev => [...prev, tag]);
        insertTag(tag);
        pushAudit({ actorId: session?.id, action: "tag.created", entityType: "tag", entityId: tag.id, details: { name: tag.name } });
      } else {
        setTags(prev => prev.map(t => t.id === tag.id ? tag : t));
        updateTag(tag.id, tag);
        pushAudit({ actorId: session?.id, action: "tag.updated", entityType: "tag", entityId: tag.id, details: { name: tag.name } });
      }
    },
  });
  const requestDeleteTag = (tag) => requestDelete(`the tag "${tag.name}"`, () => {
    setTags(prev => prev.filter(t => t.id !== tag.id));
    deleteTag(tag.id);
    pushAudit({ actorId: session?.id, action: "tag.deleted", entityType: "tag", entityId: tag.id, details: { name: tag.name } });
  });
  const handleToggleTagModality = (tag) => {
    const isModality = !tag.isModality;
    setTags(prev => prev.map(t => t.id === tag.id ? { ...t, isModality } : t));
    updateTag(tag.id, { isModality });
  };
  const handleReorderTags = (newOrder) => {
    const withOrder = newOrder.map((t, i) => ({ ...t, sortOrder: i }));
    setTags(withOrder);
    withOrder.forEach(t => updateTag(t.id, { sortOrder: t.sortOrder }));
  };
  const handleReorderCpdTypes = (newOrder) => {
    const withOrder = newOrder.map((t, i) => ({ ...t, sortOrder: i }));
    setCpdTypes(withOrder);
    withOrder.forEach(t => updateCpdType(t.id, { sortOrder: t.sortOrder }));
  };

  const requestSaveAvatarIcon = (icon, isNew) => requestConfirm({
    title: isNew ? "Add icon?" : "Save changes?",
    message: `${isNew ? "Add" : "Save changes to"} "${icon.label}"?`,
    confirmLabel: isNew ? "Add" : "Save",
    onConfirm: () => {
      const next = { ...icon, sortOrder: isNew ? avatarIcons.length : avatarIcons.find(i => i.id === icon.id)?.sortOrder ?? 0 };
      if (isNew) {
        setAvatarIcons(prev => { const l = [...prev, next]; setRegistryIcons(l); return l; });
        insertAvatarIcon(next);
        pushAudit({ actorId: session?.id, action: "avatar_icon.created", entityType: "avatar_icon", entityId: next.id, details: { label: next.label } });
      } else {
        setAvatarIcons(prev => { const l = prev.map(i => i.id === next.id ? next : i); setRegistryIcons(l); return l; });
        updateAvatarIcon(next.id, next);
        pushAudit({ actorId: session?.id, action: "avatar_icon.updated", entityType: "avatar_icon", entityId: next.id, details: { label: next.label } });
      }
      showToast(isNew ? "Icon added." : "Icon saved.");
    },
  });
  const requestDeleteAvatarIcon = (icon) => requestDelete(`the icon "${icon.label}"`, () => {
    setAvatarIcons(prev => { const l = prev.filter(i => i.id !== icon.id); setRegistryIcons(l); return l; });
    deleteAvatarIcon(icon.id);
    pushAudit({ actorId: session?.id, action: "avatar_icon.deleted", entityType: "avatar_icon", entityId: icon.id, details: { label: icon.label } });
    showToast("Icon deleted.");
  });
  const handleReorderAvatarIcons = (newOrder) => {
    const withOrder = newOrder.map((icon, i) => ({ ...icon, sortOrder: i }));
    setAvatarIcons(withOrder);
    setRegistryIcons(withOrder);
    withOrder.forEach(icon => updateAvatarIcon(icon.id, { sortOrder: icon.sortOrder }));
  };
  const handleUploadAvatarIconImage = (file) => uploadAvatarIconImage(file);

  const requestSaveAvatarColor = (color, isNew) => requestConfirm({
    title: isNew ? "Add colour?" : "Save changes?",
    message: `${isNew ? "Add" : "Save changes to"} "${color.name}"?`,
    confirmLabel: isNew ? "Add" : "Save",
    onConfirm: () => {
      const next = { ...color, sortOrder: isNew ? avatarColors.length : avatarColors.find(c => c.id === color.id)?.sortOrder ?? 0 };
      if (isNew) {
        setAvatarColors(prev => { const l = [...prev, next]; setRegistryColors(l); return l; });
        insertAvatarColor(next);
        pushAudit({ actorId: session?.id, action: "avatar_color.created", entityType: "avatar_color", entityId: next.id, details: { name: next.name } });
      } else {
        setAvatarColors(prev => { const l = prev.map(c => c.id === next.id ? next : c); setRegistryColors(l); return l; });
        updateAvatarColor(next.id, next);
        pushAudit({ actorId: session?.id, action: "avatar_color.updated", entityType: "avatar_color", entityId: next.id, details: { name: next.name } });
      }
      showToast(isNew ? "Colour added." : "Colour saved.");
    },
  });
  const requestDeleteAvatarColor = (color) => requestDelete(`the colour "${color.name}"`, () => {
    setAvatarColors(prev => { const l = prev.filter(c => c.id !== color.id); setRegistryColors(l); return l; });
    deleteAvatarColor(color.id);
    pushAudit({ actorId: session?.id, action: "avatar_color.deleted", entityType: "avatar_color", entityId: color.id, details: { name: color.name } });
    showToast("Colour deleted.");
  });
  const handleReorderAvatarColors = (newOrder) => {
    const withOrder = newOrder.map((color, i) => ({ ...color, sortOrder: i }));
    setAvatarColors(withOrder);
    setRegistryColors(withOrder);
    withOrder.forEach(color => updateAvatarColor(color.id, { sortOrder: color.sortOrder }));
  };

  const requestDeleteCpdType = (cpdType) => requestDelete(`the CPD type "${cpdType.name}"`, () => {
    setCpdTypes(prev => prev.filter(t => t.id !== cpdType.id));
    deleteCpdType(cpdType.id);
    pushAudit({ actorId: session?.id, action: "cpd_type.deleted", entityType: "cpd_type", entityId: cpdType.id, details: { name: cpdType.name } });
    showToast("CPD type deleted.");
  });

  const handleToggleStaffField = (fieldId, visible) => {
    const next = { ...staffFieldVisibility, [fieldId]: visible };
    setStaffFieldVisibility(next);
    upsertAppSetting("staff_field_visibility", next);
  };

  const handleSaveEmailTemplateOverride = (key, patch) => {
    const next = { ...emailTemplateOverrides, [key]: { ...(emailTemplateOverrides[key] || {}), ...patch } };
    setEmailTemplateOverrides(next);
    upsertAppSetting("email_template_overrides", next);
  };

  const handleAddPersonalReflection = (payload) => {
    // Admins can add a reflection on behalf of another staff member from the "All Staff
    // Reflections" view (targetUserId); otherwise it's always the logged-in user's own.
    const { targetUserId, ...rest } = payload;
    const reflection = { id: "pr" + Date.now(), userId: targetUserId || session.id, ...rest };
    setPersonalReflections(prev => [reflection, ...prev]);
    insertPersonalReflection(reflection);
    pushAudit({ actorId: session?.id, action: "reflection.created", entityType: "personal_reflection", entityId: reflection.id, details: { activityName: reflection.activityName } });
    showToast(targetUserId ? "Reflection added for staff member." : "Reflection saved.");
  };
  const requestDeletePersonalReflection = (reflection) => requestDelete(`your reflection for "${reflection.activityName}"`, () => {
    setPersonalReflections(prev => prev.filter(r => r.id !== reflection.id));
    deletePersonalReflection(reflection.id);
  });
  const handleEmailReflectionCopy = async (payload) => {
    const res = await emailReflectionCopy(payload);
    showToast(res.ok ? "Emailed you a copy." : "Couldn't send that email — please try again.");
  };

  const handleAddBrainstormIdea = (content, category) => {
    const idea = { id: "idea" + Date.now(), content, category, addedByName: session?.name || "Unknown", source: "admin", createdAt: new Date().toISOString() };
    setBrainstormIdeas(prev => [idea, ...prev]);
    insertBrainstormIdea(idea);
    pushAudit({ actorId: session?.id, action: "brainstorm_idea.created", entityType: "brainstorm_idea", entityId: idea.id, details: { content } });
  };
  const requestDeleteBrainstormIdea = (idea) => requestDelete("this idea", () => {
    setBrainstormIdeas(prev => prev.filter(i => i.id !== idea.id));
    deleteBrainstormIdea(idea.id);
    pushAudit({ actorId: session?.id, action: "brainstorm_idea.deleted", entityType: "brainstorm_idea", entityId: idea.id, details: { content: idea.content } });
  });
  const handleSaveBrainstormIdea = (idea, patch) => {
    setBrainstormIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, ...patch } : i));
    updateBrainstormIdea(idea.id, patch);
    pushAudit({ actorId: session?.id, action: "brainstorm_idea.updated", entityType: "brainstorm_idea", entityId: idea.id, details: { content: patch.content } });
  };
  const handlePublicBrainstormSubmit = (content, submitterName, category) => {
    const idea = { id: "idea" + Date.now(), content, category, addedByName: submitterName || "Anonymous", source: "public", createdAt: new Date().toISOString() };
    insertBrainstormIdea(idea);
  };
  // Any signed-in user (not just admin/owner) can suggest one or more ideas at once from the
  // Dashboard or the bottom of Upcoming Events — tagged with their real name but inserted the
  // same way as a public submission, since only admin/owner can read the shared list back (RLS).
  const handleMemberBrainstormSubmit = (ideas) => {
    ideas.forEach((idea, i) => {
      insertBrainstormIdea({ id: `idea${Date.now()}${i}`, content: idea.content, category: idea.category, addedByName: session?.name || "Someone", source: "member" });
    });
    showToast(ideas.length > 1 ? `Thanks — your ${ideas.length} ideas have been added!` : "Thanks — your idea has been added!");
  };

  // Test accounts exist purely for admin/owner "preview as" — no real Supabase Auth
  // identity, no login_emails row, hidden from the normal Team Access list.
  const handleCreateTestAccount = (userType) => {
    const brandColors = Object.keys(BRAND_HEX);
    const newUser = {
      id: "utest" + Date.now(), name: userType === "external" ? "Test External" : "Test Staff",
      email: `test-${userType}-${Date.now()}@internal.test`, role: "viewer", staffId: null,
      avatarId: CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)].id,
      avatarColor: brandColors[Math.floor(Math.random() * brandColors.length)],
      userType, verified: userType === "internal", onboarded: true, isTest: true,
    };
    setUsers(prev => [...prev, newUser]);
    insertUser(newUser);
    pushAudit({ actorId: session?.id, action: "user.updated", entityType: "user", entityId: newUser.id, details: { name: newUser.name, isTest: true } });
  };

  const handleToggleRedDots = () => {
    if (redDotsEnabled) {
      requestConfirm({
        title: "Turn off red dot notifications?",
        message: "You'll stop seeing red dot badges on the sidebar and on events/certificates that need action. You can turn them back on any time in Settings.",
        confirmLabel: "Turn Off",
        onConfirm: () => setRedDotsEnabled(false),
      });
    } else {
      setRedDotsEnabled(true);
    }
  };

  // Live registered/waitlist counts derived from real registrations, falling back to the
  // seeded static values for events nobody has registered for yet (e.g. fresh demo data).
  const eventsWithLiveCounts = useMemo(() => {
    const counts = {};
    registrations.forEach(r => {
      if (!counts[r.eventId]) counts[r.eventId] = { registered: 0, waitlist: 0 };
      if (r.attendanceStatus === "Waitlisted") counts[r.eventId].waitlist++;
      else if (r.attendanceStatus !== "Cancelled") counts[r.eventId].registered++;
    });
    return events.map(e => ({
      ...e,
      registered: counts[e.id] ? counts[e.id].registered : e.registered ?? 0,
      waitlist: counts[e.id] ? counts[e.id].waitlist : e.waitlist ?? 0,
    }));
  }, [events, registrations]);

  // Same idea for past events: real attendance/feedback derived from registrations and
  // reflections, falling back to the seeded static values when there's no real data yet.
  const previousEventsWithLiveStats = useMemo(() => previousEvents.map(ev => ({
    ...ev,
    attendance: eventAttendedCount(ev.id, registrations) || ev.attendance,
    feedback: eventAvgRating(ev.id, reflections) ?? ev.feedback,
  })), [previousEvents, registrations, reflections]);

  // An event that's finished stays in Happening Now's "Recently Ended" card for 24h (see
  // isRecentlyCompleted) before complete-finished-events actually flips its status to Completed -
  // until that runs, it's still technically "upcoming" as far as the events table is concerned,
  // so the Previous Events page (which only ever queried status IN (Completed, Archived)) had no
  // way to find it early. Folds those in for the *browsing list* only, reshaped the same way
  // previousEventsWithLiveStats already is - not into previousEventsWithLiveStats itself, so
  // Reports/analytics/MyCpd's "Past CPD" keep counting hours only once an event's data is
  // actually finalised, and this stays purely a "let me find and open it" convenience.
  const recentlyEndedAsPrevious = useMemo(() => events
    .filter(ev => isRecentlyCompleted(ev.date, ev.end))
    .map(ev => ({
      ...ev,
      attendance: eventAttendedCount(ev.id, registrations) || ev.registered || 0,
      feedback: eventAvgRating(ev.id, reflections) ?? null,
    })), [events, registrations, reflections]);
  const previousEventsForBrowsing = useMemo(
    () => [...recentlyEndedAsPrevious, ...previousEventsWithLiveStats],
    [recentlyEndedAsPrevious, previousEventsWithLiveStats],
  );

  const requestDeleteRegistration = (reg) => requestDelete(`the registration for "${reg.name}"`, () => {
    setRegistrations(prev => prev.filter(r => r.id !== reg.id));
    deleteRegistration(reg.id);
    pushAudit({ actorId: session?.id, action: "registration.deleted", entityType: "registration", entityId: reg.id, details: { name: reg.name, eventId: reg.eventId } });
  });

  // The signed-in user's own active registrations, for the "Registered" badge + self-serve
  // unregister control shown on event cards everywhere (Up Next, Upcoming Events, viewer
  // dashboards, the event detail modal) — every role can register for events, including
  // admins/owners viewing their own cards.
  const myRegisteredEventIds = useMemo(
    () => new Set(session ? registrations.filter(r => r.userId === session.id && r.attendanceStatus !== "Cancelled").map(r => r.eventId) : []),
    [registrations, session]
  );
  const handleUnregisterSelf = (eventId) => {
    const reg = session && registrations.find(r => r.eventId === eventId && r.userId === session.id);
    if (!reg) return;
    requestConfirm({
      title: "Unregister from this event?",
      message: "Are you sure you want to unregister from this event?",
      confirmLabel: "Unregister",
      onConfirm: () => {
        setRegistrations(prev => prev.filter(r => r.id !== reg.id));
        deleteRegistration(reg.id);
        pushAudit({ actorId: session?.id, action: "registration.deleted", entityType: "registration", entityId: reg.id, details: { name: reg.name, eventId: reg.eventId } });
      },
    });
  };

  const handleUpdateRegistrationField = (reg, patch) => {
    setRegistrations(prev => prev.map(r => r.id === reg.id ? { ...r, ...patch } : r));
    updateRegistration(reg.id, patch);
    pushAudit({ actorId: session?.id, action: "registration.updated", entityType: "registration", entityId: reg.id, details: patch });
  };

  // Attendance-status edits can free up a spot (Registered/Attended -> Cancelled/No Show),
  // in which case the earliest waitlisted registrant is automatically promoted.
  const handleUpdateAttendanceStatus = (reg, newStatus) => {
    const freedUp = (reg.attendanceStatus === "Registered" || reg.attendanceStatus === "Attended")
      && (newStatus === "Cancelled" || newStatus === "No Show");

    setRegistrations(prev => {
      let next = prev.map(r => r.id === reg.id ? { ...r, attendanceStatus: newStatus } : r);
      if (freedUp) {
        const waitlisted = next
          .filter(r => r.eventId === reg.eventId && r.attendanceStatus === "Waitlisted")
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        if (waitlisted.length > 0) {
          const promoted = waitlisted[0];
          next = next.map(r => r.id === promoted.id ? { ...r, attendanceStatus: "Registered" } : r);
          updateRegistration(promoted.id, { attendanceStatus: "Registered" });
        }
      }
      return next;
    });
    updateRegistration(reg.id, { attendanceStatus: newStatus });
    pushAudit({ actorId: session?.id, action: "registration.attendance_changed", entityType: "registration", entityId: reg.id, details: { status: newStatus } });
  };

  const requestDeleteReflection = (r) => requestDelete(`the reflection from "${r.name}"`, () => {
    setReflections(prev => prev.filter(x => x.id !== r.id));
    deleteReflection(r.id);
  });

  const handleSubmitReflection = (payload) => {
    const matched = registrations.find(r => r.eventId === payload.eventId && r.email && payload.email && r.email.toLowerCase() === payload.email.toLowerCase());
    const reflection = { id: "ref" + Date.now(), submittedAt: new Date().toISOString(), registrationId: matched?.id ?? null, ...payload };
    setReflections(prev => [reflection, ...prev]);
    insertReflection(reflection);
    return reflection;
  };

  // Merge keeps the earlier-created record, backfills any fields it's missing from the
  // duplicate, then deletes the duplicate. Dismiss just remembers the pair so the warning
  // doesn't reappear.
  const mergeRecords = (a, b, { list, setList, deleteFn, updateFn }) => {
    const [keep, drop] = new Date(a.createdAt || a.submittedAt || 0) <= new Date(b.createdAt || b.submittedAt || 0) ? [a, b] : [b, a];
    const patch = {};
    Object.keys(drop).forEach(k => { if ((keep[k] === undefined || keep[k] === null || keep[k] === "") && drop[k] != null && drop[k] !== "") patch[k] = drop[k]; });
    setList(prev => prev.filter(x => x.id !== drop.id).map(x => x.id === keep.id ? { ...x, ...patch } : x));
    if (Object.keys(patch).length > 0) updateFn(keep.id, patch);
    deleteFn(drop.id);
  };

  const handleMergeRegistrations = (a, b) => mergeRecords(a, b, { list: registrations, setList: setRegistrations, deleteFn: deleteRegistration, updateFn: updateRegistration });
  const handleDismissRegistrationPair = (a, b) => {
    setDismissedRegistrationPairs(prev => new Set([...prev, [a.id, b.id].sort().join("::")]));
    insertDismissedPair("registration", a.id, b.id);
  };
  const handleMergeReflections = (a, b) => mergeRecords(a, b, { list: reflections, setList: setReflections, deleteFn: deleteReflection, updateFn: () => {} });
  const handleDismissReflectionPair = (a, b) => {
    setDismissedReflectionPairs(prev => new Set([...prev, [a.id, b.id].sort().join("::")]));
    insertDismissedPair("reflection", a.id, b.id);
  };

  // Notifications are derived live from state; a group simply stops existing once resolved.
  const notificationGroups = useMemo(
    () => buildNotificationGroups({ events, certificates, registrations, acknowledged }),
    [events, certificates, registrations, acknowledged]
  );
  const viewerNotificationGroups = useMemo(() => {
    const vs = previewSession || session;
    if (!vs || vs.role !== "viewer") return [];
    const visible = eventsWithLiveCounts.filter(e => e.status === "Registration Open" && e.openToExternal);
    return buildViewerNotificationGroups({
      session: vs, visibleEvents: visible, previousEvents: previousEventsWithLiveStats,
      registrations, reflections, acknowledged,
    });
  }, [previewSession, session, eventsWithLiveCounts, previousEventsWithLiveStats, registrations, reflections, acknowledged]);
  // Keeps a short scrollback of recently cleared notifications (label + when), separate from
  // `acknowledged` (which only tracks ackKeys so a resolved condition doesn't reappear) — this
  // is purely so the bell can show "here's what you just dealt with" for a little while after.
  const [recentNotifications, setRecentNotifications] = useState([]);
  const logAcknowledged = (groups) => setRecentNotifications(prev => {
    const entries = groups.map(g => ({ id: `${g.id}-${Date.now()}-${Math.random()}`, text: g.label, time: new Date().toISOString() }));
    return [...entries, ...prev].slice(0, 15);
  });
  const acknowledgeGroup = (g) => {
    setAcknowledged(prev => new Set([...prev, ...g.ackKeys]));
    logAcknowledged([g]);
  };
  const acknowledgeAllNotifications = (groups) => {
    const list = groups || notificationGroups;
    setAcknowledged(prev => {
      const next = new Set(prev);
      list.forEach(g => g.ackKeys.forEach(k => next.add(k)));
      return next;
    });
    logAcknowledged(list);
  };
  const navigateToNotification = (g) => {
    setPage(g.page);
    if (g.id === "registration") {
      // Registration notifications point at a set of registration rows, not a single event
      // card, so they get their own highlight target: the "All Current Registrations" panel,
      // with just the new registrations outlined once it's scrolled into view.
      setHighlightId("registrations-section");
      setHighlightRegIds(new Set(g.items.map(i => i.id)));
    } else if (g.id === "event-draft" || g.id === "event-approval") {
      // "Needs more detail" — jump straight into edit mode on the first such event, with
      // whichever required fields are still empty rung, rather than just highlighting the card.
      const ev = g.items[0];
      setHighlightRegIds(null);
      if (ev) openEvent(ev, null, true, true);
    } else {
      setHighlightId(g.items[0]?.id ?? null);
      setHighlightRegIds(null);
    }
    // Clicking a notification deals with it — clear it from the bell, same as the X button.
    acknowledgeGroup(g);
  };
  const changePage = (p) => { setPage(p); setHighlightId(null); };

  // Full when active (non-cancelled, non-waitlisted) registrations already meet capacity;
  // new registrants get auto-waitlisted instead.
  const nextAttendanceStatus = (eventId) => {
    const capacity = events.find(e => e.id === eventId)?.capacity;
    if (capacity == null) return "Registered";
    const activeCount = registrations.filter(r => r.eventId === eventId && r.attendanceStatus !== "Cancelled" && r.attendanceStatus !== "Waitlisted").length;
    return activeCount >= capacity ? "Waitlisted" : "Registered";
  };

  const handleOpenRegister = (eventId) => { setRegisterDefaultEventId(eventId || null); setRegisterModalOpen(true); };
  const handleSubmitRegistration = ({ eventId, name, email, profession, organisation, campus, attendanceType, dietary, accessibility, comments }) => {
    const reg = {
      id: "r" + Date.now(), eventId, name, email, profession, organisation, campus, attendanceType, dietary, accessibility, comments,
      userId: session?.id ?? null, isExternal: false, attendanceStatus: nextAttendanceStatus(eventId), createdAt: new Date().toISOString(),
    };
    setRegistrations(prev => [...prev, reg]);
    insertRegistration(reg);
    pushAudit({ actorId: session?.id, action: "registration.created", entityType: "event", entityId: eventId, details: { name: reg.name, eventTitle: events.find(e => e.id === eventId)?.title } });
    if (session) {
      setUsers(prev => prev.map(u => u.id === session.id ? { ...u, dietaryRequirements: dietary, accessibility, profession, organisation } : u));
      setSession(s => ({ ...s, dietaryRequirements: dietary, accessibility, profession, organisation }));
      updateUser(session.id, { dietaryRequirements: dietary, accessibility, profession, organisation });
    }
    sendRegistrationConfirmation({ eventId, name, email });
    setRegisterModalOpen(false);
    const ev = events.find(e => e.id === eventId);
    if (ev) setRegistrationSuccessEvent(ev);
  };

  // No-login registration from the public QR landing page: sync to a signed-in session, match
  // an existing account by email, auto-create a viewer account for WH emails, or file the
  // person under External Participants if they're not WH staff.
  // Files a brand-new registrant (no matching `users` account) into the right directory - `staff`
  // for @wh.org.au emails (or when the registrant explicitly said they're WH staff despite a
  // non-WH email, via isWhStaffOverride), `external_participants` otherwise - mirroring the same
  // domain check create-manual-certificate already uses server-side, so a new registrant actually
  // shows up in the Staff Directory/quick stats instead of always landing in External
  // Participants regardless of who they are. Matches an existing staff/external record by name/
  // email first, so registering more than once doesn't create duplicates.
  const fileNewRegistrant = (name, email, isWhStaffOverride) => {
    const isWh = isWhStaffOverride ?? email.toLowerCase().endsWith(WH_DOMAIN);
    if (isWh) {
      const existingStaff = staffDirectory.find(s => s.name.trim().toLowerCase() === name.trim().toLowerCase());
      if (!existingStaff) {
        const newStaff = { id: "st" + Date.now(), name, certificates: 0 };
        setStaffDirectory(prev => [...prev, newStaff]);
        insertStaff(newStaff);
      }
      return { isExternal: false };
    }
    const existingExternal = externalParticipants.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (!existingExternal) {
      const newExternal = { id: "ext" + Date.now(), name, email };
      setExternalParticipants(prev => [...prev, newExternal]);
      insertExternalParticipant(newExternal);
    }
    return { isExternal: true };
  };

  const handlePublicRegister = ({ eventId, name, email, profession, organisation, campus, attendanceType, dietary, accessibility, comments, isWhStaffAnswer }) => {
    let userId = null;
    let isExternal = false;

    if (session) {
      userId = session.id;
    } else {
      // Anonymous QR/no-login registration; RLS only allows an authenticated caller to
      // self-provision a `users` row, so an unmatched email (WH or not) doesn't get a login
      // account here - but it does get filed into the right directory below. If they later sign
      // in for real via OTP with this same email, resolveOrCreateProfile creates their proper
      // account at that point.
      const matched = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (matched) {
        userId = matched.id;
      } else {
        isExternal = fileNewRegistrant(name, email, isWhStaffAnswer).isExternal;
      }
    }

    const reg = {
      id: "r" + Date.now(), eventId, name, email, profession, organisation, campus, attendanceType, dietary, accessibility, comments,
      userId, isExternal, attendanceStatus: nextAttendanceStatus(eventId), createdAt: new Date().toISOString(),
    };
    setRegistrations(prev => [...prev, reg]);
    insertRegistration(reg);
    pushAudit({ actorId: session?.id, action: "registration.created", entityType: "event", entityId: eventId, details: { name: reg.name, eventTitle: events.find(e => e.id === eventId)?.title } });
    if (session) {
      setUsers(prev => prev.map(u => u.id === session.id ? { ...u, dietaryRequirements: dietary, accessibility, profession, organisation } : u));
      setSession(s => ({ ...s, dietaryRequirements: dietary, accessibility, profession, organisation }));
      updateUser(session.id, { dietaryRequirements: dietary, accessibility, profession, organisation });
    }
    sendRegistrationConfirmation({ eventId, name, email });
  };

  // Admin/owner manually recording someone's registration (e.g. they registered by phone or in
  // person) from the event's Registrations tab. Mirrors handlePublicRegister's account-matching
  // so the person still shows up properly linked to an existing staff/external record, but skips
  // the anonymous-vs-signed-in branching since the caller here is always an admin acting on
  // someone else's behalf, never their own session.
  const handleAdminAddRegistration = (eventId, { name, email, profession, organisation, attendanceType, dietary, accessibility, comments }) => {
    let userId = null;
    let isExternal = false;
    const matchedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (matchedUser) {
      userId = matchedUser.id;
    } else {
      isExternal = fileNewRegistrant(name, email).isExternal;
    }

    const reg = {
      id: "r" + Date.now(), eventId, name, email, profession, organisation, attendanceType, dietary, accessibility, comments,
      userId, isExternal, attendanceStatus: nextAttendanceStatus(eventId), createdAt: new Date().toISOString(),
    };
    setRegistrations(prev => [...prev, reg]);
    insertRegistration(reg);
    pushAudit({ actorId: session?.id, action: "registration.created", entityType: "event", entityId: eventId, details: { name: reg.name, eventTitle: events.find(e => e.id === eventId)?.title } });
    sendRegistrationConfirmation({ eventId, name, email });
    showToast("Registration added.");
  };

  const primaryHex = BRAND_HEX[colorPrefs.primary] || BRAND_HEX.blue;
  const secondaryHex = BRAND_HEX[colorPrefs.secondary] || BRAND_HEX.purple;
  const successHex = BRAND_HEX[colorPrefs.success] || BRAND_HEX.green;
  const rootVars = { "--accent-primary": primaryHex, "--accent-secondary": secondaryHex, "--accent-success": successHex };

  const openEvent = (ev, initialTab, startEditing, highlightMissing) => { setSelectedEvent(ev); setEventInitialTab(initialTab || null); setEventInitialEditing(!!startEditing); setEventHighlightMissing(!!highlightMissing); };
  const openArchiveEvent = (ev, initialTab, startEditing) => { setSelectedArchiveEvent(ev); setArchiveInitialTab(initialTab || null); setArchiveInitialEditing(!!startEditing); };
  // Duplicate keeps every configured field but starts a fresh registration count (no
  // registrations are copied) and leaves any recurrence series behind — a duplicate always
  // stands alone. It lands wherever its (unchanged) status naturally belongs — Upcoming or
  // Previous — same as any other event.
  const duplicateEventPayload = (event) => ({
    ...event, id: "e" + Date.now(), title: `${event.title} (1)`,
    registered: 0, waitlist: 0, recurrenceGroupId: null,
  });
  const handleDuplicateEvent = (event, fromPrevious) => requestConfirm({
    title: "Duplicate this event?",
    message: `Create a copy of "${event.title}" with all its details, including its promotional poster? You'll be able to edit the copy straight away.`,
    confirmLabel: "Duplicate",
    onConfirm: async () => {
      const dup = duplicateEventPayload(event);
      if (fromPrevious) setPreviousEvents(prev => [...prev, dup]);
      else setEvents(prev => [...prev, dup]);
      insertEvent(dup);
      pushAudit({ actorId: session?.id, action: "event.created", entityType: "event", entityId: dup.id, details: { title: dup.title } });
      // Files are keyed by event_id, so a new event id means the source's poster/flyer needs
      // an actual copy, not just a reference — bannerFocalX/Y/Zoom already came along for free
      // via the `...event` spread in duplicateEventPayload, since those live on the event row.
      const sourceFiles = (files || []).filter(f => f.eventId === event.id);
      for (const f of sourceFiles) {
        const copy = await duplicateEventFile(f, dup.id, session?.id);
        if (copy) setFiles(prev => [...prev, copy]);
      }
      showToast("Event duplicated.");
      if (fromPrevious) openArchiveEvent(dup, null, true);
      else openEvent(dup, null, true);
    },
  });
  const openStaff = (s) => setSelectedStaff(s);
  const openCertificatesAwaiting = () => {
    changePage("certificates");
    const firstAwaiting = certificates.find(c => c.status === "Awaiting Approval");
    setHighlightId(firstAwaiting?.id ?? null);
  };
  const openCurrentRegistrations = () => {
    changePage("upcoming");
    setHighlightId("registrations-section");
  };
  const openReportsFeedback = () => {
    changePage("reports");
    setHighlightId("feedback-section");
  };
  const openOutstandingReflections = () => {
    changePage("reflection");
  };
  const openEventsCurrentlyOpen = () => {
    changePage("upcoming");
  };

  // Recent Activity rows are clickable — jump to whatever record the audit entry refers to.
  // There's no stored before/after diff, so "see what changed" means opening the record at its
  // current state rather than a literal field-by-field highlight.
  const navigateToEntity = (entry) => {
    const { entityType, entityId } = entry;
    if (!entityId) return;
    if (entityType === "event") {
      const ev = events.find(e => e.id === entityId);
      if (ev) { openEvent(ev); return; }
      const prevEv = previousEvents.find(e => e.id === entityId);
      if (prevEv) { openArchiveEvent(prevEv); return; }
      showToast("That event no longer exists.");
      return;
    }
    if (entityType === "staff") {
      const rec = staffDirectory.find(s => s.id === entityId);
      if (rec) { openStaff(rec); return; }
      showToast("That staff record no longer exists.");
      return;
    }
    if (entityType === "registration") {
      const reg = registrations.find(r => r.id === entityId);
      const ev = reg && (events.find(e => e.id === reg.eventId) || previousEvents.find(e => e.id === reg.eventId));
      if (ev) { events.includes(ev) ? openEvent(ev) : openArchiveEvent(ev); return; }
      showToast("That registration's event no longer exists.");
      return;
    }
    if (entityType === "certificate") {
      changePage("certificates");
      setHighlightId(entityId);
      return;
    }
    if (entityType === "brainstorm_idea") {
      changePage("brainstorm");
      return;
    }
    if (["user", "tag", "cpd_type", "avatar_icon", "avatar_color"].includes(entityType)) {
      changePage("settings");
      return;
    }
    showToast("Nothing to open for this activity.");
  };

  let mainContent;
  if (!ready) {
    mainContent = (
      <div className="whmi-root light flex items-center justify-center" style={{ minHeight: "100vh", ...rootVars }}>
        <div className="whmi-logo-icon" style={{ width: 40, height: 22, opacity: 0.4 }} />
      </div>
    );
  } else if (!session) {
    mainContent = <LoginScreen rootVars={rootVars} />;
  } else if (!session.onboarded) {
    mainContent = <Onboarding session={session} onComplete={handleCompleteOnboarding} rootVars={rootVars} />;
  } else {
    // previewSession lets an admin/owner see the app as a "Test staff"/"Test external"
    // account would, without a real logout/login. Only nav structure, page-content role/
    // user props, and management-gated UI follow the preview; mutations, audit actorId,
    // and the Settings/ProfileMenu identity always stay on the real `session`.
    const viewSession = previewSession || session;
    const navItems = viewSession.role === "viewer" ? (viewSession.userType === "internal" ? NAV_VIEWER_INTERNAL : NAV_VIEWER) : NAV_FULL;
    const homePage = viewSession.role === "viewer" ? "mycpd" : "dashboard";
    const sidebarWidth = collapsed ? (isNarrow ? 54 : 68) : (isNarrow ? 200 : 224);
    const canManage = viewSession.role === "admin" || viewSession.role === "owner";
    // Internal viewers get read-only access to Upcoming/Previous Events, scoped to events WH
    // has offered externally too — anything WH-internal-only stays admin/owner-visible only.
    const viewerEvents = canManage ? eventsWithLiveCounts : eventsWithLiveCounts.filter(e => e.openToExternal && e.status === "Registration Open");
    // Internal staff (viewer role, @wh.org.au accounts) see the full previous-events history;
    // external viewers stay scoped to events WH has opted to share externally.
    const viewerPreviousEvents = (canManage || viewSession.userType === "internal") ? previousEventsForBrowsing : previousEventsForBrowsing.filter(e => e.openToExternal);
    const badgePages = redDotsEnabled ? {
      upcoming: notificationGroups.some(g => g.id === "event-draft" || g.id === "event-approval"),
      certificates: notificationGroups.some(g => g.id === "cert-approval"),
    } : {};
    const badgeTooltips = {
      upcoming: "Some events need more detail or are awaiting approval",
      certificates: "Some CPD certificates are awaiting approval",
    };

    mainContent = (
      <div className={`whmi-root ${theme}`} data-card-theme={cardTheme || undefined} style={{ minHeight: "100vh", ...rootVars }}>
        <div className="flex" style={{ minHeight: "100vh" }}>
          <Sidebar page={page} setPage={changePage} collapsed={collapsed} setCollapsed={setCollapsed} navItems={navItems} homePage={homePage} width={sidebarWidth} badgePages={badgePages} badgeTooltips={badgeTooltips} />

          <div className="flex-1 min-w-0">
            <HeaderBar
              page={page} theme={theme} setTheme={handleSetTheme} mainTheme={mainTheme} setMainTheme={handleSetMainTheme} cardTheme={cardTheme} setCardTheme={handleSetCardTheme} navItems={navItems} user={viewSession}
              onAvatarClick={() => setProfileOpen(o => !o)}
              events={eventsWithLiveCounts} previousEvents={previousEventsWithLiveStats} staffDirectory={staffDirectory} openEvent={openEvent} openStaff={openStaff}
              openArchiveEvent={openArchiveEvent} certificates={certificates} reflections={reflections} files={files} onNavigatePage={changePage}
              canManage={canManage} notificationGroups={canManage ? notificationGroups : viewerNotificationGroups} redDotsEnabled={redDotsEnabled}
              onNavigateNotification={navigateToNotification} onAcknowledgeGroup={acknowledgeGroup}
              onAcknowledgeAll={() => acknowledgeAllNotifications(canManage ? notificationGroups : viewerNotificationGroups)}
              recentNotifications={recentNotifications}
              showSearch={viewSession.role !== "viewer"}
              previewSession={previewSession} onExitPreview={() => setPreviewSession(null)}
              testAccounts={users.filter(u => u.isTest)} onPreviewAs={setPreviewSession}
            />

            <div data-tour="main-content" className={`whmi-root ${mainTheme || theme}`} style={rootVars}>
            {page === "dashboard" && viewSession.role !== "viewer" && (
              <Dashboard
                events={eventsWithLiveCounts} previousEvents={previousEventsWithLiveStats} registrations={registrations} reflections={reflections} certificates={certificates} files={files}
                auditLog={auditLog} users={users}
                openEvent={openEvent} setPage={changePage} layoutOrder={layoutOrder} primaryHex={primaryHex} secondaryHex={secondaryHex} successHex={successHex} userName={viewSession.name.split(" ")[0]}
                onCreateCertificate={() => { changePage("certificates"); setCreateCertificateOpen(true); }}
                onAddStaff={() => { changePage("staff"); setSelectedStaff(blankStaff()); }}
                onAddEvent={() => changePage("upcoming")}
                onOpenRegister={() => handleOpenRegister()}
                onActivityClick={navigateToEntity}
                onOpenReports={() => changePage("reports")}
                onOpenCurrentRegistrations={openCurrentRegistrations}
                onOpenCertificatesAwaiting={openCertificatesAwaiting}
                onOpenReportsFeedback={openReportsFeedback}
                onOpenOutstandingReflections={openOutstandingReflections}
                onOpenEventsCurrentlyOpen={openEventsCurrentlyOpen}
                registeredIds={myRegisteredEventIds} onUnregister={handleUnregisterSelf}
              />
            )}
            {page === "mycpd" && viewSession.userType === "external" && (
              <ExternalDashboard user={viewSession} events={eventsWithLiveCounts} previousEvents={previousEventsWithLiveStats} certificates={certificates} registrations={registrations} reflections={reflections} files={files} openEvent={openEvent} onOpenRegister={handleOpenRegister} onUnregister={handleUnregisterSelf} onNavigatePage={changePage} onSuggestIdea={() => setSuggestIdeaOpen(true)} />
            )}
            {page === "mycpd" && viewSession.userType !== "external" && (
              <MyCpd user={viewSession} staffDirectory={staffDirectory} events={eventsWithLiveCounts} previousEvents={previousEventsWithLiveStats} certificates={certificates} registrations={registrations} reflections={reflections} files={files} openEvent={openEvent} onOpenRegister={handleOpenRegister} onUnregister={handleUnregisterSelf} onNavigatePage={changePage} onSuggestIdea={() => setSuggestIdeaOpen(true)} />
            )}
            {page === "mycertificates" && <MyCertificates user={viewSession} certificates={certificates} />}
            {page === "upcoming" && (canManage || viewSession.userType === "internal") && (
              <UpcomingEvents
                events={viewerEvents} openEvent={openEvent} canManage={canManage} onRequestDelete={requestDeleteEvent} highlightId={page === "upcoming" ? highlightId : null} onOpenRegister={handleOpenRegister} onCreateEvent={() => setCreateEventOpen(true)} files={files} onGoBrainstorm={() => changePage("brainstorm")} onSuggestIdea={canManage ? undefined : () => setSuggestIdeaOpen(true)}
                registrations={registrations} onDeleteRegistration={requestDeleteRegistration} onUpdateRegistration={handleUpdateRegistrationField} onUpdateAttendanceStatus={handleUpdateAttendanceStatus}
                dismissedRegistrationPairs={dismissedRegistrationPairs} onMergeRegistrations={handleMergeRegistrations} onDismissRegistrationPair={handleDismissRegistrationPair}
                highlightRegIds={highlightRegIds}
                registeredIds={myRegisteredEventIds} onUnregister={handleUnregisterSelf}
              />
            )}
            {page === "previous" && (canManage || viewSession.userType === "internal") && <PreviousEvents previousEvents={viewerPreviousEvents} files={files} onOpenArchive={openArchiveEvent} canManage={canManage} onCreatePreviousEvent={() => setCreatePreviousEventOpen(true)} onRequestDelete={requestDeletePreviousEvent} onRequestDeleteMultiple={requestDeletePreviousEvents} />}
            {page === "staff" && (
              <StaffDirectory
                openStaff={openStaff} onOpenAdminStaff={handleOpenAdminStaff} staffDirectory={staffDirectory} canManage={canManage}
                externalParticipants={externalParticipants} certificates={certificates} users={users} fieldVisibility={staffFieldVisibility}
                onSaveExternalParticipant={handleSaveExternalParticipant} onRequestDeleteExternalParticipant={requestDeleteExternalParticipant}
                onPatchUser={handlePatchUser} onSaveUserContact={requestSaveUserContact}
              />
            )}
            {page === "reports" && <Reports events={eventsWithLiveCounts} previousEvents={previousEventsWithLiveStats} registrations={registrations} reflections={reflections} primaryHex={primaryHex} secondaryHex={secondaryHex} successHex={successHex} tags={tags} highlightId={page === "reports" ? highlightId : null} onNavigatePage={changePage} />}
            {page === "certificates" && (
              <Certificates
                certificates={certificates} canManage={canManage} onRequestDelete={requestDeleteCertificate} onApprove={handleApproveCertificate}
                highlightId={page === "certificates" ? highlightId : null} onCreateCertificate={() => setCreateCertificateOpen(true)}
                onApproveAndSendAll={handleApproveAndSendAll} onResend={handleResendCertificate} requestConfirm={requestConfirm}
              />
            )}
            {page === "reflection" && (
              <Reflection
                session={session}
                personalReflections={personalReflections}
                whReflections={reflections}
                onAddPersonalReflection={handleAddPersonalReflection}
                onDeletePersonalReflection={requestDeletePersonalReflection}
                onEmailCopy={handleEmailReflectionCopy}
                canManage={canManage}
                registrations={registrations}
                previousEvents={previousEventsWithLiveStats}
                users={users}
                onResendReflectionReminder={handleSendReflectionReminder}
                onSendReflectionsReport={handleSendReflectionsReport}
              />
            )}
            {page === "brainstorm" && canManage && (
              <Brainstorming ideas={brainstormIdeas} onAddIdea={handleAddBrainstormIdea} onRequestDeleteIdea={requestDeleteBrainstormIdea} onSaveIdea={handleSaveBrainstormIdea} />
            )}
            {page === "help" && <HelpCentre role={viewSession.role} />}
            {page === "settings" && (
              <Settings
                theme={theme} setTheme={handleSetTheme}
                mainTheme={mainTheme} setMainTheme={handleSetMainTheme}
                cardTheme={cardTheme} setCardTheme={handleSetCardTheme}
                role={viewSession.role}
                session={session} onProfileSave={handleProfileSave} showToast={showToast}
                users={users} onUsersChange={handleUsersChange}
                colorPrefs={colorPrefs} onColorChange={handleColorChange}
                layoutOrder={layoutOrder} onLayoutChange={handleLayoutChange}
                onRequestDelete={requestDeleteUser}
                redDotsEnabled={redDotsEnabled} onToggleRedDots={handleToggleRedDots}
                onReplayTour={() => { changePage(homePage); setShowTour(true); }}
                onRevokeSession={handleRevokeSession}
                cpdTypes={cpdTypes} onSaveCpdType={requestSaveCpdType} onDeleteCpdType={requestDeleteCpdType} onReorderCpdTypes={handleReorderCpdTypes}
                tags={tags} onSaveTag={requestSaveTag} onDeleteTag={requestDeleteTag} onReorderTags={handleReorderTags} onToggleTagModality={handleToggleTagModality}
                onBackfillStaffLinks={handleBackfillStaffLinks} auditLog={auditLog}
                avatarIcons={avatarIcons} onSaveAvatarIcon={requestSaveAvatarIcon} onDeleteAvatarIcon={requestDeleteAvatarIcon}
                onReorderAvatarIcons={handleReorderAvatarIcons} onUploadAvatarIconImage={handleUploadAvatarIconImage}
                avatarColors={avatarColors} onSaveAvatarColor={requestSaveAvatarColor} onDeleteAvatarColor={requestDeleteAvatarColor}
                onReorderAvatarColors={handleReorderAvatarColors}
                previewSession={previewSession} onPreviewAs={setPreviewSession} onCreateTestAccount={handleCreateTestAccount}
                onSaveUserContact={requestSaveUserContact}
                staffFieldVisibility={staffFieldVisibility} onToggleStaffField={handleToggleStaffField}
                emailTemplateOverrides={emailTemplateOverrides} onSaveEmailTemplateOverride={handleSaveEmailTemplateOverride}
              />
            )}
            <Footer />
            </div>
          </div>
        </div>

        {showTour && <OnboardingTour steps={TOUR_STEPS} onFinish={() => setShowTour(false)} />}

        <EventDetailModal
          event={selectedEvent} onClose={() => setSelectedEvent(null)} registrations={registrations} initialTab={eventInitialTab} initialEditing={eventInitialEditing} highlightMissing={eventHighlightMissing}
          seriesEvents={eventsWithLiveCounts} onSwitchEvent={openEvent}
          onDuplicate={selectedEvent ? () => handleDuplicateEvent(selectedEvent, false) : undefined}
          canManage={canManage} onDelete={selectedEvent ? () => requestDeleteEvent(selectedEvent) : undefined}
          onStatusChange={handleStatusChange} onEdit={handleUpdateEvent} uploadedBy={session.id} session={session}
          onDeleteRegistration={requestDeleteRegistration} onUpdateRegistration={handleUpdateRegistrationField}
          onUpdateAttendanceStatus={handleUpdateAttendanceStatus}
          dismissedRegistrationPairs={dismissedRegistrationPairs} onMergeRegistrations={handleMergeRegistrations} onDismissRegistrationPair={handleDismissRegistrationPair}
          reflections={reflections} onDeleteReflection={requestDeleteReflection}
          dismissedReflectionPairs={dismissedReflectionPairs} onMergeReflections={handleMergeReflections} onDismissReflectionPair={handleDismissReflectionPair}
          cpdTypes={cpdTypes} files={files} tags={tags} onSaveTag={handleAddTag} viewerUserType={viewSession.userType} onFilesChange={refreshFiles}
          onUpdateBannerCrop={handleUpdateBannerCrop} onRemoveBanner={handleRemoveBanner}
          onOpenRegister={handleOpenRegister} onUnregister={handleUnregisterSelf}
          onSendAllReflectionReminders={handleSendAllReflectionReminders}
          onSendPostEventEmail={handleSendPostEventEmail}
          onSendPresenterThankYou={handleSendPresenterThankYou}
          onAddRegistration={handleAdminAddRegistration} users={users} staffDirectory={staffDirectory} onViewStaffProfile={openStaff}
        />
        <PreviousEventDetailModal
          key={selectedArchiveEvent?.id} event={selectedArchiveEvent} onClose={() => setSelectedArchiveEvent(null)} registrations={registrations}
          initialTab={archiveInitialTab} initialEditing={archiveInitialEditing}
          seriesEvents={previousEventsWithLiveStats} onSwitchEvent={openArchiveEvent}
          onDuplicate={selectedArchiveEvent ? () => handleDuplicateEvent(selectedArchiveEvent, true) : undefined}
          certificates={certificates} reflections={reflections} session={session} onEdit={handleUpdatePreviousEvent}
          canManage={canManage} onRequestDelete={requestDeletePreviousEvent}
          dismissedReflectionPairs={dismissedReflectionPairs} onMergeReflections={handleMergeReflections} onDismissReflectionPair={handleDismissReflectionPair}
          onDeleteReflection={requestDeleteReflection}
          onDeleteRegistration={requestDeleteRegistration} onUpdateRegistration={handleUpdateRegistrationField}
          onUpdateAttendanceStatus={handleUpdateAttendanceStatus}
          dismissedRegistrationPairs={dismissedRegistrationPairs} onMergeRegistrations={handleMergeRegistrations} onDismissRegistrationPair={handleDismissRegistrationPair}
          cpdTypes={cpdTypes} tags={tags} onSaveTag={handleAddTag} onFilesChange={refreshFiles} files={files}
          onUpdateBannerCrop={handleUpdateBannerCrop} onRemoveBanner={handleRemoveBanner}
          onCreateCertificateFor={handleCreateCertificateForRegistrant} onSendReflectionReminder={handleSendReflectionReminder}
          onSendAllReflectionReminders={handleSendAllReflectionReminders}
          onSendPostEventEmail={handleSendPostEventEmail}
          onSendPresenterThankYou={handleSendPresenterThankYou}
        />
        <EventFormModal
          open={createEventOpen} onClose={() => setCreateEventOpen(false)} event={null}
          onSave={handleCreateEvent} uploadedBy={session.id} cpdTypes={cpdTypes} tags={tags} onSaveTag={handleAddTag}
        />
        <EventFormModal
          open={createPreviousEventOpen} onClose={() => setCreatePreviousEventOpen(false)} event={null}
          onSave={handleCreatePreviousEvent} uploadedBy={session.id} cpdTypes={cpdTypes} tags={tags} onSaveTag={handleAddTag}
          initialStatus="Completed"
        />
        <CreateCertificateModal
          open={createCertificateOpen} onClose={() => { setCreateCertificateOpen(false); setCertificatePrefill(null); }}
          cpdTypes={cpdTypes} onCreated={handleManualCertificateCreated} prefill={certificatePrefill}
        />
        <StaffModal
          staff={selectedStaff} onClose={() => setSelectedStaff(null)} canEdit={canManage} onSave={handleStaffSave} onCreate={handleStaffCreate} onRequestDelete={requestDeleteStaff}
          linkableUsers={users.filter(u => ["admin", "owner"].includes(u.role) && !u.staffId)}
          fieldVisibility={staffFieldVisibility}
          allUsers={users} onPatchUser={handlePatchUser} onSaveUserContact={requestSaveUserContact}
        />
        {profileOpen && <ProfileMenu user={session} onClose={() => setProfileOpen(false)} onLogout={handleLogout} onSave={handleProfileSave} showToast={showToast} />}
        {suggestIdeaOpen && (
          <SuggestIdeaModal
            session={session}
            onClose={() => setSuggestIdeaOpen(false)}
            onSubmit={handleMemberBrainstormSubmit}
          />
        )}
        <RegisterEventModal
          open={registerModalOpen} onClose={() => setRegisterModalOpen(false)} session={session} events={eventsWithLiveCounts}
          defaultEventId={registerDefaultEventId} onSubmit={handleSubmitRegistration} files={files}
        />
        {registrationSuccessEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.5)" }} onClick={() => setRegistrationSuccessEvent(null)}>
            <div className="w-full max-w-sm whmi-fade-in" onClick={e => e.stopPropagation()}>
              <RegistrationSuccessCard event={registrationSuccessEvent} onClose={() => setRegistrationSuccessEvent(null)} />
            </div>
          </div>
        )}
        <ConfirmDeleteModal request={confirmModal} onCancel={closeConfirm} onConfirm={() => { confirmModal?.onConfirm(); closeConfirm(); }} />
        <Toast message={toast} onDone={() => setToast(null)} />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/event/:eventId" element={<PublicEventPage events={eventsWithLiveCounts} session={session} onPublicRegister={handlePublicRegister} files={files} loading={!ready} />} />
      <Route path="/event/:eventId/reflect" element={<ReflectionPage events={eventsWithLiveCounts} session={session} onSubmitReflection={handleSubmitReflection} loading={!ready} />} />
      <Route path="/brainstorm/submit" element={<BrainstormSubmitPage session={session} onSubmit={handlePublicBrainstormSubmit} />} />
      <Route path="*" element={mainContent} />
    </Routes>
  );
}
