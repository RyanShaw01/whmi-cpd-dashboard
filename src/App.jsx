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
import EventFormModal from "./components/EventFormModal";
import CreateCertificateModal from "./components/CreateCertificateModal";
import { BRAND_HEX, CHARACTERS, NAV_FULL, NAV_VIEWER, DEFAULT_LAYOUT } from "./data/mockData";
import { TOUR_STEPS } from "./data/tourSteps";
import { loadPersonal, savePersonal } from "./lib/storage";
import { buildNotificationGroups } from "./lib/notifications";
import { eventAttendedCount, eventAvgRating } from "./lib/analytics";
import { eventBannerFile, eventCpdHours } from "./lib/helpers";
import { supabase, supabaseConfigured } from "./lib/supabaseClient";
import {
  fetchUsers, fetchStaff, fetchEvents, fetchPreviousEvents, fetchCertificates, fetchRegistrations, fetchExternalParticipants,
  insertUser, updateUser, deleteUser, insertStaff, updateStaff, deleteStaff, updateEventStatus, insertEvent, updateEvent, deleteEvent as deleteEventRow,
  updateCertificateStatus, deleteCertificate as deleteCertificateRow, insertRegistration, updateRegistration, deleteRegistration, insertExternalParticipant,
  fetchReflections, insertReflection, deleteReflection, fetchDismissedPairs, insertDismissedPair,
  fetchAllFiles, deleteEventFile, logAudit, fetchLoginEmail, insertLoginEmail, fetchUserById, fetchUserByEmail, revokeUserSession,
  fetchCpdTypes, insertCpdType, updateCpdType, deleteCpdType, sendCertificateEmail,
  fetchTags, insertTag, updateTag, deleteTag, fetchAuditLog, sendReflectionReminder,
  fetchAvatarIcons, insertAvatarIcon, updateAvatarIcon, deleteAvatarIcon, uploadAvatarIconImage,
  fetchAvatarColors, insertAvatarColor, updateAvatarColor, deleteAvatarColor,
  fetchBrainstormIdeas, insertBrainstormIdea, deleteBrainstormIdea,
} from "./lib/db";
import { setAvatarIcons as setRegistryIcons, setAvatarColors as setRegistryColors } from "./lib/avatarRegistry";

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
  const [page, setPage] = useState("dashboard");
  const [highlightId, setHighlightId] = useState(null);
  const [dark, setDark] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedArchiveEvent, setSelectedArchiveEvent] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
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
    ] = await Promise.all([
      fetchUsers(), fetchStaff(), fetchEvents(), fetchPreviousEvents(), fetchCertificates(), fetchRegistrations(), fetchExternalParticipants(),
      fetchReflections(), fetchAllFiles(), fetchDismissedPairs("registration"), fetchDismissedPairs("reflection"), fetchCpdTypes(), fetchTags(),
      fetchAuditLog(50), fetchAvatarIcons(), fetchAvatarColors(), fetchBrainstormIdeas(),
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
  };

  const clearAppData = () => {
    setUsers([]); setStaffDirectory([]); setEvents([]); setPreviousEvents([]); setCertificates([]);
    setRegistrations([]); setExternalParticipants([]); setReflections([]); setFiles([]); setCpdTypes([]); setTags([]); setAuditLog([]);
    setAvatarIcons([]); setAvatarColors([]); setBrainstormIdeas([]);
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
        setDark(!!profile.darkMode);
        setPage(profile.role === "viewer" ? "mycpd" : "dashboard");
        await loadAppData();
        if (!mounted) return;
        if (event === "SIGNED_IN") pushAudit({ actorId: profile.id, action: "user.login" });
      } else {
        setSession(null);
        clearAppData();
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
  // Dark mode and avatar/colour changes save immediately (account-level, so they follow the
  // user across devices) rather than waiting for the Settings "Save Profile" button.
  const handleSetDark = (next) => {
    setDark(next);
    if (session) handleProfileSave({ darkMode: next });
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
  const handleApproveAndSendAll = async () => {
    const awaiting = certificates.filter(c => c.status === "Awaiting Approval");
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
      if (res.ok) pushAudit({ actorId: session?.id, action: "reflection.reminder_sent", entityType: "event", entityId: event.id, details: { email: registration.email } });
    },
  });
  const handleCreateEvent = (payload) => {
    setEvents(prev => [...prev, payload]);
    insertEvent(payload);
    pushAudit({ actorId: session?.id, action: "event.created", entityType: "event", entityId: payload.id, details: { title: payload.title } });
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
  const requestDeleteEvent = (ev) => requestDelete(`the event "${ev.title}"`, () => {
    setEvents(prev => prev.filter(e => e.id !== ev.id));
    deleteEventRow(ev.id);
    setSelectedEvent(null);
    pushAudit({ actorId: session?.id, action: "event.deleted", entityType: "event", entityId: ev.id, details: { title: ev.title } });
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
  const handlePublicBrainstormSubmit = (content, submitterName, category) => {
    const idea = { id: "idea" + Date.now(), content, category, addedByName: submitterName || "Anonymous", source: "public", createdAt: new Date().toISOString() };
    insertBrainstormIdea(idea);
  };
  // Any signed-in user (not just admin/owner) can suggest an idea from the Dashboard or the
  // bottom of Upcoming Events — it's tagged with their real name but inserted the same way as a
  // public submission, since only admin/owner can read the shared brainstorm list back (RLS).
  const handleMemberBrainstormSubmit = (content, category) => {
    const idea = { id: "idea" + Date.now(), content, category, addedByName: session?.name || "Someone", source: "member" };
    insertBrainstormIdea(idea);
    showToast("Thanks — your idea has been added!");
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

  const requestDeleteRegistration = (reg) => requestDelete(`the registration for "${reg.name}"`, () => {
    setRegistrations(prev => prev.filter(r => r.id !== reg.id));
    deleteRegistration(reg.id);
    pushAudit({ actorId: session?.id, action: "registration.deleted", entityType: "registration", entityId: reg.id, details: { name: reg.name, eventId: reg.eventId } });
  });

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
  const acknowledgeGroup = (g) => setAcknowledged(prev => new Set([...prev, ...g.ackKeys]));
  const acknowledgeAllNotifications = () => setAcknowledged(prev => {
    const next = new Set(prev);
    notificationGroups.forEach(g => g.ackKeys.forEach(k => next.add(k)));
    return next;
  });
  const navigateToNotification = (g) => {
    setPage(g.page);
    setHighlightId(g.items[0]?.id ?? null);
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
  const handleSubmitRegistration = ({ eventId, name, email, profession, campus, attendanceType, dietary, accessibility, comments }) => {
    const reg = {
      id: "r" + Date.now(), eventId, name, email, profession, campus, attendanceType, dietary, accessibility, comments,
      userId: session?.id ?? null, isExternal: false, attendanceStatus: nextAttendanceStatus(eventId), createdAt: new Date().toISOString(),
    };
    setRegistrations(prev => [...prev, reg]);
    insertRegistration(reg);
    if (session) {
      setUsers(prev => prev.map(u => u.id === session.id ? { ...u, dietaryRequirements: dietary, accessibility } : u));
      setSession(s => ({ ...s, dietaryRequirements: dietary, accessibility }));
      updateUser(session.id, { dietaryRequirements: dietary });
    }
    setRegisterModalOpen(false);
  };

  // No-login registration from the public QR landing page: sync to a signed-in session, match
  // an existing account by email, auto-create a viewer account for WH emails, or file the
  // person under External Participants if they're not WH staff.
  const handlePublicRegister = ({ eventId, name, email, profession, campus, attendanceType, dietary, accessibility, comments, isWhStaffAnswer }) => {
    let userId = null;
    let isExternal = false;

    if (session) {
      userId = session.id;
    } else {
      // Anonymous QR/no-login registration; RLS only allows an authenticated caller to
      // self-provision a `users` row, so an unmatched email (WH or not) is filed as an
      // external participant. If they later sign in for real via OTP with this same
      // email, resolveOrCreateProfile creates their proper account at that point.
      const matched = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (matched) {
        userId = matched.id;
      } else {
        const newExternal = { id: "ext" + Date.now(), name, email };
        setExternalParticipants(prev => [...prev, newExternal]);
        insertExternalParticipant(newExternal);
        isExternal = true;
      }
    }

    const reg = {
      id: "r" + Date.now(), eventId, name, email, profession, campus, attendanceType, dietary, accessibility, comments,
      userId, isExternal, attendanceStatus: nextAttendanceStatus(eventId), createdAt: new Date().toISOString(),
    };
    setRegistrations(prev => [...prev, reg]);
    insertRegistration(reg);
  };

  const primaryHex = BRAND_HEX[colorPrefs.primary] || BRAND_HEX.blue;
  const secondaryHex = BRAND_HEX[colorPrefs.secondary] || BRAND_HEX.purple;
  const successHex = BRAND_HEX[colorPrefs.success] || BRAND_HEX.green;
  const rootVars = { "--accent-primary": primaryHex, "--accent-secondary": secondaryHex, "--accent-success": successHex };

  const openEvent = (ev) => setSelectedEvent(ev);
  const openArchiveEvent = (ev) => setSelectedArchiveEvent(ev);
  const openStaff = (s) => setSelectedStaff(s);

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
    const navItems = viewSession.role === "viewer" ? NAV_VIEWER : NAV_FULL;
    const homePage = viewSession.role === "viewer" ? "mycpd" : "dashboard";
    const sidebarWidth = collapsed ? (isNarrow ? 54 : 68) : (isNarrow ? 200 : 224);
    const canManage = viewSession.role === "admin" || viewSession.role === "owner";
    const badgePages = redDotsEnabled ? {
      upcoming: notificationGroups.some(g => g.id === "event-draft" || g.id === "event-approval"),
      certificates: notificationGroups.some(g => g.id === "cert-approval"),
    } : {};

    mainContent = (
      <div className={`whmi-root ${dark ? "dark" : "light"}`} style={{ minHeight: "100vh", ...rootVars }}>
        <div className="flex" style={{ minHeight: "100vh" }}>
          <Sidebar page={page} setPage={changePage} collapsed={collapsed} setCollapsed={setCollapsed} navItems={navItems} homePage={homePage} width={sidebarWidth} badgePages={badgePages} />

          <div className="flex-1 min-w-0">
            <HeaderBar
              page={page} dark={dark} setDark={handleSetDark} navItems={navItems} user={viewSession}
              onAvatarClick={() => setProfileOpen(o => !o)}
              events={eventsWithLiveCounts} previousEvents={previousEventsWithLiveStats} staffDirectory={staffDirectory} openEvent={openEvent} openStaff={openStaff}
              openArchiveEvent={openArchiveEvent} certificates={certificates} reflections={reflections} files={files} onNavigatePage={changePage}
              canManage={canManage} notificationGroups={notificationGroups} redDotsEnabled={redDotsEnabled}
              onNavigateNotification={navigateToNotification} onAcknowledgeGroup={acknowledgeGroup} onAcknowledgeAll={acknowledgeAllNotifications}
              showSearch={viewSession.role !== "viewer"}
              previewSession={previewSession} onExitPreview={() => setPreviewSession(null)}
              testAccounts={users.filter(u => u.isTest)} onPreviewAs={setPreviewSession}
            />

            <div data-tour="main-content">
            {page === "dashboard" && viewSession.role !== "viewer" && (
              <Dashboard
                events={eventsWithLiveCounts} previousEvents={previousEventsWithLiveStats} registrations={registrations} reflections={reflections} certificates={certificates} files={files}
                auditLog={auditLog} users={users}
                openEvent={openEvent} setPage={changePage} layoutOrder={layoutOrder} primaryHex={primaryHex} secondaryHex={secondaryHex} successHex={successHex} userName={viewSession.name.split(" ")[0]}
                onCreateCertificate={() => { changePage("certificates"); setCreateCertificateOpen(true); }}
                onAddStaff={() => { changePage("staff"); setSelectedStaff(blankStaff()); }}
                onAddEvent={() => { changePage("upcoming"); setCreateEventOpen(true); }}
                onSuggestIdea={() => setSuggestIdeaOpen(true)}
              />
            )}
            {page === "mycpd" && viewSession.userType === "external" && (
              <ExternalDashboard user={viewSession} events={eventsWithLiveCounts} previousEvents={previousEventsWithLiveStats} certificates={certificates} registrations={registrations} reflections={reflections} openEvent={openEvent} onOpenRegister={handleOpenRegister} onNavigatePage={changePage} onSuggestIdea={() => setSuggestIdeaOpen(true)} />
            )}
            {page === "mycpd" && viewSession.userType !== "external" && (
              <MyCpd user={viewSession} staffDirectory={staffDirectory} events={eventsWithLiveCounts} previousEvents={previousEventsWithLiveStats} certificates={certificates} registrations={registrations} reflections={reflections} openEvent={openEvent} onOpenRegister={handleOpenRegister} onNavigatePage={changePage} onSuggestIdea={() => setSuggestIdeaOpen(true)} />
            )}
            {page === "mycertificates" && <MyCertificates user={viewSession} certificates={certificates} />}
            {page === "upcoming" && <UpcomingEvents events={eventsWithLiveCounts} openEvent={openEvent} canManage={canManage} onRequestDelete={requestDeleteEvent} highlightId={page === "upcoming" ? highlightId : null} onOpenRegister={handleOpenRegister} onCreateEvent={() => setCreateEventOpen(true)} files={files} onGoBrainstorm={() => changePage("brainstorm")} onSuggestIdea={() => setSuggestIdeaOpen(true)} />}
            {page === "previous" && <PreviousEvents previousEvents={previousEventsWithLiveStats} onOpenArchive={openArchiveEvent} canManage={canManage} onCreatePreviousEvent={() => setCreatePreviousEventOpen(true)} />}
            {page === "staff" && <StaffDirectory openStaff={openStaff} onOpenAdminStaff={handleOpenAdminStaff} staffDirectory={staffDirectory} canManage={canManage} externalParticipants={externalParticipants} certificates={certificates} users={users} />}
            {page === "reports" && <Reports events={eventsWithLiveCounts} previousEvents={previousEventsWithLiveStats} registrations={registrations} reflections={reflections} primaryHex={primaryHex} secondaryHex={secondaryHex} successHex={successHex} tags={tags} />}
            {page === "certificates" && (
              <Certificates
                certificates={certificates} canManage={canManage} onRequestDelete={requestDeleteCertificate} onApprove={handleApproveCertificate}
                highlightId={page === "certificates" ? highlightId : null} onCreateCertificate={() => setCreateCertificateOpen(true)}
                onApproveAndSendAll={handleApproveAndSendAll} onResend={handleResendCertificate} requestConfirm={requestConfirm}
              />
            )}
            {page === "brainstorm" && canManage && (
              <Brainstorming ideas={brainstormIdeas} onAddIdea={handleAddBrainstormIdea} onRequestDeleteIdea={requestDeleteBrainstormIdea} />
            )}
            {page === "help" && <HelpCentre role={viewSession.role} />}
            {page === "settings" && (
              <Settings
                dark={dark} setDark={handleSetDark}
                role={session.role}
                session={session} onProfileSave={handleProfileSave} showToast={showToast}
                users={users} onUsersChange={handleUsersChange}
                colorPrefs={colorPrefs} onColorChange={handleColorChange}
                layoutOrder={layoutOrder} onLayoutChange={handleLayoutChange}
                onRequestDelete={requestDeleteUser}
                redDotsEnabled={redDotsEnabled} onToggleRedDots={handleToggleRedDots}
                onReplayTour={() => { changePage(homePage); setShowTour(true); }}
                onRevokeSession={handleRevokeSession}
                cpdTypes={cpdTypes} onSaveCpdType={requestSaveCpdType} onDeleteCpdType={requestDeleteCpdType} onReorderCpdTypes={handleReorderCpdTypes}
                tags={tags} onSaveTag={requestSaveTag} onDeleteTag={requestDeleteTag} onReorderTags={handleReorderTags}
                onBackfillStaffLinks={handleBackfillStaffLinks} auditLog={auditLog}
                avatarIcons={avatarIcons} onSaveAvatarIcon={requestSaveAvatarIcon} onDeleteAvatarIcon={requestDeleteAvatarIcon}
                onReorderAvatarIcons={handleReorderAvatarIcons} onUploadAvatarIconImage={handleUploadAvatarIconImage}
                avatarColors={avatarColors} onSaveAvatarColor={requestSaveAvatarColor} onDeleteAvatarColor={requestDeleteAvatarColor}
                onReorderAvatarColors={handleReorderAvatarColors}
                previewSession={previewSession} onPreviewAs={setPreviewSession} onCreateTestAccount={handleCreateTestAccount}
                onSaveUserContact={requestSaveUserContact}
              />
            )}
            </div>
          </div>
        </div>

        {showTour && <OnboardingTour steps={TOUR_STEPS} onFinish={() => setShowTour(false)} />}

        <EventDetailModal
          event={selectedEvent} onClose={() => setSelectedEvent(null)} registrations={registrations}
          canManage={canManage} onDelete={selectedEvent ? () => requestDeleteEvent(selectedEvent) : undefined}
          onStatusChange={handleStatusChange} onEdit={handleUpdateEvent} uploadedBy={session.id} session={session}
          onDeleteRegistration={requestDeleteRegistration} onUpdateRegistration={handleUpdateRegistrationField}
          onUpdateAttendanceStatus={handleUpdateAttendanceStatus}
          dismissedRegistrationPairs={dismissedRegistrationPairs} onMergeRegistrations={handleMergeRegistrations} onDismissRegistrationPair={handleDismissRegistrationPair}
          reflections={reflections} onDeleteReflection={requestDeleteReflection}
          dismissedReflectionPairs={dismissedReflectionPairs} onMergeReflections={handleMergeReflections} onDismissReflectionPair={handleDismissReflectionPair}
          cpdTypes={cpdTypes} files={files} tags={tags} onSaveTag={handleAddTag} viewerUserType={viewSession.userType} onFilesChange={refreshFiles}
          onUpdateBannerCrop={handleUpdateBannerCrop} onRemoveBanner={handleRemoveBanner}
        />
        <PreviousEventDetailModal
          key={selectedArchiveEvent?.id} event={selectedArchiveEvent} onClose={() => setSelectedArchiveEvent(null)} registrations={registrations}
          certificates={certificates} reflections={reflections} session={session} onEdit={handleUpdatePreviousEvent}
          dismissedReflectionPairs={dismissedReflectionPairs} onMergeReflections={handleMergeReflections} onDismissReflectionPair={handleDismissReflectionPair}
          onDeleteReflection={requestDeleteReflection}
          onDeleteRegistration={requestDeleteRegistration} onUpdateRegistration={handleUpdateRegistrationField}
          onUpdateAttendanceStatus={handleUpdateAttendanceStatus}
          dismissedRegistrationPairs={dismissedRegistrationPairs} onMergeRegistrations={handleMergeRegistrations} onDismissRegistrationPair={handleDismissRegistrationPair}
          cpdTypes={cpdTypes} tags={tags} onSaveTag={handleAddTag} onFilesChange={refreshFiles} files={files}
          onUpdateBannerCrop={handleUpdateBannerCrop} onRemoveBanner={handleRemoveBanner}
          onCreateCertificateFor={handleCreateCertificateForRegistrant} onSendReflectionReminder={handleSendReflectionReminder}
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
        />
        {profileOpen && <ProfileMenu user={session} onClose={() => setProfileOpen(false)} onLogout={handleLogout} onSave={handleProfileSave} showToast={showToast} />}
        {suggestIdeaOpen && (
          <SuggestIdeaModal
            session={session}
            onClose={() => setSuggestIdeaOpen(false)}
            onSubmit={(content, category) => handleMemberBrainstormSubmit(content, category)}
          />
        )}
        <RegisterEventModal
          open={registerModalOpen} onClose={() => setRegisterModalOpen(false)} session={session} events={eventsWithLiveCounts}
          defaultEventId={registerDefaultEventId} onSubmit={handleSubmitRegistration}
        />
        <ConfirmDeleteModal request={confirmModal} onCancel={closeConfirm} onConfirm={() => { confirmModal?.onConfirm(); closeConfirm(); }} />
        <Toast message={toast} onDone={() => setToast(null)} />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/event/:eventId" element={<PublicEventPage events={eventsWithLiveCounts} session={session} onPublicRegister={handlePublicRegister} />} />
      <Route path="/event/:eventId/reflect" element={<ReflectionPage events={eventsWithLiveCounts} session={session} onSubmitReflection={handleSubmitReflection} />} />
      <Route path="/brainstorm/submit" element={<BrainstormSubmitPage session={session} onSubmit={handlePublicBrainstormSubmit} />} />
      <Route path="*" element={mainContent} />
    </Routes>
  );
}
