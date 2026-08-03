import { useState, useEffect, useMemo } from "react";
import { Routes, Route } from "react-router-dom";
import LoginScreen from "./pages/LoginScreen";
import Dashboard from "./pages/Dashboard";
import MyCpd from "./pages/MyCpd";
import ExternalDashboard from "./pages/ExternalDashboard";
import UpcomingEvents from "./pages/UpcomingEvents";
import PreviousEvents from "./pages/PreviousEvents";
import StaffDirectory from "./pages/StaffDirectory";
import Reports from "./pages/Reports";
import Certificates from "./pages/Certificates";
import Settings from "./pages/Settings";
import HelpCentre from "./pages/HelpCentre";
import PublicEventPage from "./pages/PublicEventPage";
import ReflectionPage from "./pages/ReflectionPage";
import Onboarding from "./pages/Onboarding";
import Sidebar from "./components/Sidebar";
import HeaderBar from "./components/HeaderBar";
import OnboardingTour from "./components/OnboardingTour";
import ProfileMenu from "./components/ProfileMenu";
import EventDetailModal from "./components/EventDetailModal";
import PreviousEventDetailModal from "./components/PreviousEventDetailModal";
import StaffModal from "./components/StaffModal";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";
import RegisterEventModal from "./components/RegisterEventModal";
import EventFormModal from "./components/EventFormModal";
import CreateCertificateModal from "./components/CreateCertificateModal";
import { BRAND_HEX, CHARACTERS, NAV_FULL, NAV_VIEWER, DEFAULT_LAYOUT } from "./data/mockData";
import { TOUR_STEPS } from "./data/tourSteps";
import { loadPersonal, savePersonal } from "./lib/storage";
import { buildNotificationGroups } from "./lib/notifications";
import { eventAttendedCount, eventAvgRating } from "./lib/analytics";
import { supabase, supabaseConfigured } from "./lib/supabaseClient";
import {
  fetchUsers, fetchStaff, fetchEvents, fetchPreviousEvents, fetchCertificates, fetchRegistrations, fetchExternalParticipants,
  insertUser, updateUser, deleteUser, updateStaff, deleteStaff, updateEventStatus, insertEvent, updateEvent, deleteEvent as deleteEventRow,
  updateCertificateStatus, deleteCertificate as deleteCertificateRow, insertRegistration, updateRegistration, deleteRegistration, insertExternalParticipant,
  fetchReflections, insertReflection, deleteReflection, fetchDismissedPairs, insertDismissedPair,
  fetchAllFiles, logAudit, fetchLoginEmail, insertLoginEmail, fetchUserById, fetchUserByEmail, revokeUserSession,
  fetchCpdTypes, insertCpdType, updateCpdType, deleteCpdType,
} from "./lib/db";

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
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [registerDefaultEventId, setRegisterDefaultEventId] = useState(null);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [createCertificateOpen, setCreateCertificateOpen] = useState(false);
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
      dismissedRegList, dismissedRefList, cpdTypeList,
    ] = await Promise.all([
      fetchUsers(), fetchStaff(), fetchEvents(), fetchPreviousEvents(), fetchCertificates(), fetchRegistrations(), fetchExternalParticipants(),
      fetchReflections(), fetchAllFiles(), fetchDismissedPairs("registration"), fetchDismissedPairs("reflection"), fetchCpdTypes(),
    ]);
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
  };

  const clearAppData = () => {
    setUsers([]); setStaffDirectory([]); setEvents([]); setPreviousEvents([]); setCertificates([]);
    setRegistrations([]); setExternalParticipants([]); setReflections([]); setFiles([]); setCpdTypes([]);
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
        if (event === "SIGNED_IN") logAudit({ actorId: profile.id, action: "user.login" });
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
    if (session) logAudit({ actorId: session.id, action: "user.logout" });
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
  const handleUsersChange = (newList) => {
    const prevById = new Map(users.map(u => [u.id, u]));
    newList.forEach(u => {
      const prev = prevById.get(u.id);
      if (!prev) insertUser(u);
      else if (
        prev.role !== u.role || prev.name !== u.name || prev.userType !== u.userType ||
        prev.verified !== u.verified || prev.secondaryEmail !== u.secondaryEmail || prev.certEmailPreference !== u.certEmailPreference
      ) {
        updateUser(u.id, u);
        logAudit({
          actorId: session?.id, action: "user.updated", entityType: "user", entityId: u.id,
          details: { role: u.role, name: u.name, userType: u.userType, verified: u.verified },
        });
      }
    });
    setUsers(newList);
  };
  const requestSaveUserContact = (user, patch) => requestConfirm({
    title: "Save contact details?",
    message: `Save the updated email address${"secondaryEmail" in patch ? "es" : ""} for ${user.name}?`,
    confirmLabel: "Save",
    onConfirm: () => {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...patch } : u));
      updateUser(user.id, patch);
      logAudit({ actorId: session?.id, action: "user.updated", entityType: "user", entityId: user.id, details: patch });
    },
  });
  const handleRevokeSession = async (u, action) => {
    const result = await revokeUserSession(u.authId, action);
    if (result.ok) {
      logAudit({
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
  };
  const handleStatusChange = (newStatus) => {
    if (!selectedEvent) return;
    const fromStatus = selectedEvent.status;
    setEvents(prev => prev.map(e => e.id === selectedEvent.id ? { ...e, status: newStatus } : e));
    setSelectedEvent(ev => ev ? { ...ev, status: newStatus } : ev);
    updateEventStatus(selectedEvent.id, newStatus);
    logAudit({ actorId: session?.id, action: "event.status_changed", entityType: "event", entityId: selectedEvent.id, details: { from: fromStatus, to: newStatus } });
  };
  const handleApproveCertificate = (cert) => {
    setCertificates(prev => prev.map(c => c.id === cert.id ? { ...c, status: "Sent" } : c));
    updateCertificateStatus(cert.id, "Sent");
    logAudit({ actorId: session?.id, action: "certificate.approved", entityType: "certificate", entityId: cert.id, details: { staff: cert.staff, event: cert.event } });
  };
  const handleManualCertificateCreated = async () => {
    const certList = await fetchCertificates();
    setCertificates(certList);
    logAudit({ actorId: session?.id, action: "certificate.created_manual" });
  };
  const handleCreateEvent = (payload) => {
    setEvents(prev => [...prev, payload]);
    insertEvent(payload);
    logAudit({ actorId: session?.id, action: "event.created", entityType: "event", entityId: payload.id, details: { title: payload.title } });
  };
  const handleUpdateEvent = (payload) => {
    setEvents(prev => prev.map(e => e.id === payload.id ? payload : e));
    setSelectedEvent(payload);
    updateEvent(payload.id, payload);
    logAudit({ actorId: session?.id, action: "event.updated", entityType: "event", entityId: payload.id, details: { title: payload.title } });
  };
  // Previous events live in a separate fetched array from `events`; updating that one
  // instead keeps the archive view in sync without needing a refetch.
  const handleUpdatePreviousEvent = (payload) => {
    setPreviousEvents(prev => prev.map(e => e.id === payload.id ? { ...e, ...payload } : e));
    setSelectedArchiveEvent(ev => ev ? { ...ev, ...payload } : ev);
    updateEvent(payload.id, payload);
    logAudit({ actorId: session?.id, action: "event.updated", entityType: "event", entityId: payload.id, details: { title: payload.title } });
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
    logAudit({ actorId: session?.id, action: "event.deleted", entityType: "event", entityId: ev.id, details: { title: ev.title } });
  });
  const requestDeleteCertificate = (c) => requestDelete(`the certificate for "${c.staff}"`, () => {
    setCertificates(prev => prev.filter(x => x.id !== c.id));
    deleteCertificateRow(c.id);
    logAudit({ actorId: session?.id, action: "certificate.deleted", entityType: "certificate", entityId: c.id, details: { staff: c.staff } });
  });

  const requestSaveCpdType = (cpdType, isNew) => requestConfirm({
    title: isNew ? "Add CPD type?" : "Save changes?",
    message: `${isNew ? "Add" : "Save"} "${cpdType.name}" (${cpdType.appellationCode}) ${isNew ? "as a new CPD type" : ""}?`,
    confirmLabel: isNew ? "Add" : "Save",
    onConfirm: () => {
      if (isNew) {
        setCpdTypes(prev => [...prev, cpdType]);
        insertCpdType(cpdType);
        logAudit({ actorId: session?.id, action: "cpd_type.created", entityType: "cpd_type", entityId: cpdType.id, details: { name: cpdType.name } });
      } else {
        setCpdTypes(prev => prev.map(t => t.id === cpdType.id ? cpdType : t));
        updateCpdType(cpdType.id, cpdType);
        logAudit({ actorId: session?.id, action: "cpd_type.updated", entityType: "cpd_type", entityId: cpdType.id, details: { name: cpdType.name } });
      }
    },
  });
  const requestDeleteCpdType = (cpdType) => requestDelete(`the CPD type "${cpdType.name}"`, () => {
    setCpdTypes(prev => prev.filter(t => t.id !== cpdType.id));
    deleteCpdType(cpdType.id);
    logAudit({ actorId: session?.id, action: "cpd_type.deleted", entityType: "cpd_type", entityId: cpdType.id, details: { name: cpdType.name } });
  });

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
    logAudit({ actorId: session?.id, action: "user.updated", entityType: "user", entityId: newUser.id, details: { name: newUser.name, isTest: true } });
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
    logAudit({ actorId: session?.id, action: "registration.deleted", entityType: "registration", entityId: reg.id, details: { name: reg.name, eventId: reg.eventId } });
  });

  const handleUpdateRegistrationField = (reg, patch) => {
    setRegistrations(prev => prev.map(r => r.id === reg.id ? { ...r, ...patch } : r));
    updateRegistration(reg.id, patch);
    logAudit({ actorId: session?.id, action: "registration.updated", entityType: "registration", entityId: reg.id, details: patch });
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
    logAudit({ actorId: session?.id, action: "registration.attendance_changed", entityType: "registration", entityId: reg.id, details: { status: newStatus } });
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
            />

            <div data-tour="main-content">
            {page === "dashboard" && viewSession.role !== "viewer" && (
              <Dashboard
                events={eventsWithLiveCounts} previousEvents={previousEventsWithLiveStats} registrations={registrations} reflections={reflections} certificates={certificates}
                openEvent={openEvent} setPage={changePage} layoutOrder={layoutOrder} primaryHex={primaryHex} secondaryHex={secondaryHex} successHex={successHex} userName={viewSession.name.split(" ")[0]}
                onCreateCertificate={() => { changePage("certificates"); setCreateCertificateOpen(true); }}
              />
            )}
            {page === "mycpd" && viewSession.userType === "external" && (
              <ExternalDashboard user={viewSession} events={eventsWithLiveCounts} previousEvents={previousEventsWithLiveStats} certificates={certificates} registrations={registrations} openEvent={openEvent} onOpenRegister={handleOpenRegister} />
            )}
            {page === "mycpd" && viewSession.userType !== "external" && (
              <MyCpd user={viewSession} staffDirectory={staffDirectory} events={eventsWithLiveCounts} previousEvents={previousEventsWithLiveStats} certificates={certificates} registrations={registrations} reflections={reflections} openEvent={openEvent} onOpenRegister={handleOpenRegister} />
            )}
            {page === "upcoming" && <UpcomingEvents events={eventsWithLiveCounts} openEvent={openEvent} canManage={canManage} onRequestDelete={requestDeleteEvent} highlightId={page === "upcoming" ? highlightId : null} onOpenRegister={handleOpenRegister} onCreateEvent={() => setCreateEventOpen(true)} />}
            {page === "previous" && <PreviousEvents previousEvents={previousEventsWithLiveStats} onOpenArchive={openArchiveEvent} />}
            {page === "staff" && <StaffDirectory openStaff={openStaff} staffDirectory={staffDirectory} canManage={canManage} externalParticipants={externalParticipants} certificates={certificates} />}
            {page === "reports" && <Reports events={eventsWithLiveCounts} previousEvents={previousEventsWithLiveStats} registrations={registrations} reflections={reflections} primaryHex={primaryHex} secondaryHex={secondaryHex} successHex={successHex} />}
            {page === "certificates" && <Certificates certificates={certificates} canManage={canManage} onRequestDelete={requestDeleteCertificate} onApprove={handleApproveCertificate} highlightId={page === "certificates" ? highlightId : null} onCreateCertificate={() => setCreateCertificateOpen(true)} />}
            {page === "help" && <HelpCentre />}
            {page === "settings" && (
              <Settings
                dark={dark} setDark={handleSetDark}
                role={session.role}
                session={session} onProfileSave={handleProfileSave}
                users={users} onUsersChange={handleUsersChange}
                colorPrefs={colorPrefs} onColorChange={handleColorChange}
                layoutOrder={layoutOrder} onLayoutChange={handleLayoutChange}
                onRequestDelete={requestDeleteUser}
                redDotsEnabled={redDotsEnabled} onToggleRedDots={handleToggleRedDots}
                onReplayTour={() => setShowTour(true)}
                onRevokeSession={handleRevokeSession}
                cpdTypes={cpdTypes} onSaveCpdType={requestSaveCpdType} onDeleteCpdType={requestDeleteCpdType}
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
          cpdTypes={cpdTypes}
        />
        <PreviousEventDetailModal
          key={selectedArchiveEvent?.id} event={selectedArchiveEvent} onClose={() => setSelectedArchiveEvent(null)} registrations={registrations}
          certificates={certificates} reflections={reflections} session={session} onEdit={handleUpdatePreviousEvent}
          dismissedReflectionPairs={dismissedReflectionPairs} onMergeReflections={handleMergeReflections} onDismissReflectionPair={handleDismissReflectionPair}
          onDeleteReflection={requestDeleteReflection}
          onDeleteRegistration={requestDeleteRegistration} onUpdateRegistration={handleUpdateRegistrationField}
          onUpdateAttendanceStatus={handleUpdateAttendanceStatus}
          dismissedRegistrationPairs={dismissedRegistrationPairs} onMergeRegistrations={handleMergeRegistrations} onDismissRegistrationPair={handleDismissRegistrationPair}
        />
        <EventFormModal
          open={createEventOpen} onClose={() => setCreateEventOpen(false)} event={null}
          onSave={handleCreateEvent} uploadedBy={session.id} cpdTypes={cpdTypes}
        />
        <CreateCertificateModal
          open={createCertificateOpen} onClose={() => setCreateCertificateOpen(false)}
          cpdTypes={cpdTypes} onCreated={handleManualCertificateCreated}
        />
        <StaffModal staff={selectedStaff} onClose={() => setSelectedStaff(null)} canEdit={canManage} onSave={handleStaffSave} onRequestDelete={requestDeleteStaff} />
        {profileOpen && <ProfileMenu user={session} onClose={() => setProfileOpen(false)} onLogout={handleLogout} onSave={handleProfileSave} />}
        <RegisterEventModal
          open={registerModalOpen} onClose={() => setRegisterModalOpen(false)} session={session} events={eventsWithLiveCounts}
          defaultEventId={registerDefaultEventId} onSubmit={handleSubmitRegistration}
        />
        <ConfirmDeleteModal request={confirmModal} onCancel={closeConfirm} onConfirm={() => { confirmModal?.onConfirm(); closeConfirm(); }} />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/event/:eventId" element={<PublicEventPage events={eventsWithLiveCounts} session={session} onPublicRegister={handlePublicRegister} />} />
      <Route path="/event/:eventId/reflect" element={<ReflectionPage events={eventsWithLiveCounts} session={session} onSubmitReflection={handleSubmitReflection} />} />
      <Route path="*" element={mainContent} />
    </Routes>
  );
}
