/*
 * Supabase-backed data access for the "shared" entities (users, staff, events,
 * certificates, registrations, external participants). Every fetch* falls back
 * to the mock seed data when Supabase isn't configured yet (no .env), so the
 * app keeps working exactly as before until real credentials are added,
 * every mutate* becomes a silent no-op in that case, since the caller already
 * updates local React state itself.
 */
import { supabase, supabaseConfigured } from "./supabaseClient";
import { SEED_USERS, STAFF_SEED, UPCOMING_EVENTS, PREVIOUS_EVENTS, CERT_QUEUE } from "../data/mockData";

/* ---------------------------------------------------------------------- */
/* row <-> app-shape mappers                                              */
/* ---------------------------------------------------------------------- */
const userFromRow = (r) => ({
  id: r.id, name: r.name, email: r.email, role: r.role,
  staffId: r.staff_id, avatarId: r.avatar_id, avatarColor: r.avatar_color,
  dietaryRequirements: r.dietary_requirements, accessibility: r.accessibility,
  authId: r.auth_id, userType: r.user_type || "internal", verified: !!r.verified,
  secondaryEmail: r.secondary_email, certEmailPreference: r.cert_email_preference || "primary",
  onboarded: r.onboarded == null ? true : !!r.onboarded,
  themeMode: r.theme_mode || (r.dark_mode ? "dark" : "light"),
  mainThemeMode: r.main_theme_mode || (r.main_dark_mode == null ? null : (r.main_dark_mode ? "dark" : "light")),
  isTest: !!r.is_test, createdAt: r.created_at,
  profession: r.profession, department: r.department,
});
const userToRow = (u) => ({
  id: u.id, name: u.name, email: u.email, role: u.role,
  staff_id: u.staffId ?? null, avatar_id: u.avatarId, avatar_color: u.avatarColor,
  dietary_requirements: u.dietaryRequirements ?? null, accessibility: u.accessibility ?? null,
  auth_id: u.authId ?? null, user_type: u.userType || "internal", verified: u.verified ?? false,
  secondary_email: u.secondaryEmail ?? null, cert_email_preference: u.certEmailPreference || "primary",
  onboarded: u.onboarded ?? false,
  theme_mode: u.themeMode || "light", main_theme_mode: u.mainThemeMode === undefined ? null : u.mainThemeMode, is_test: u.isTest ?? false,
  profession: u.profession ?? null, department: u.department ?? null,
});

const staffFromRow = (r) => ({
  id: r.id, name: r.name, profession: r.profession, campuses: r.campuses || [],
  department: r.department, hours: Number(r.hours), attended: r.attended, certificates: r.certificates,
  modality: r.modality, grade: r.grade, qualifiedYear: r.qualified_year,
  hoursLast3Years: r.hours_last_3_years == null ? null : Number(r.hours_last_3_years),
  eventsThisYear: r.events_this_year, lastAttended: r.last_attended,
  attendedEventIds: r.attended_event_ids || [],
});
const staffToRow = (s) => ({
  name: s.name, profession: s.profession, campuses: s.campuses, department: s.department,
  hours: s.hours, attended: s.attended, certificates: s.certificates, modality: s.modality,
  grade: s.grade, qualified_year: s.qualifiedYear, hours_last_3_years: s.hoursLast3Years,
  events_this_year: s.eventsThisYear, last_attended: s.lastAttended, attended_event_ids: s.attendedEventIds,
});

const eventFromRow = (r) => ({
  id: r.id, title: r.title, topic: r.topic, date: r.date, start: r.start_time, end: r.end_time,
  location: r.location, mode: r.mode, presenter: r.presenters || r.presenter, registered: r.registered,
  capacity: r.capacity, waitlist: r.waitlist, status: r.status, meetingUrl: r.meeting_url,
  attendance: r.attendance, feedback: r.feedback == null ? null : Number(r.feedback),
  description: r.description, learningObjectives: r.learning_objectives,
  organisers: r.organisers, supportingStaff: r.supporting_staff,
  campus: r.campus, room: r.room, level: r.level,
  onlineCapacity: r.online_capacity, inPersonCapacity: r.in_person_capacity,
  tags: r.tags || [], reflectionMethod: r.reflection_method || "link", asmirtCode: r.asmirt_code || "",
  recordingUrl: r.recording_url || "",
  cpdTypeId: r.cpd_type_id || null, openToExternal: r.open_to_external == null ? true : !!r.open_to_external,
  reflectionAutoEmail: r.reflection_auto_email !== false, showRegCountExternal: !!r.show_reg_count_external,
  bannerFocalX: r.banner_focal_x == null ? 50 : Number(r.banner_focal_x), bannerFocalY: r.banner_focal_y == null ? 50 : Number(r.banner_focal_y),
  bannerZoom: r.banner_zoom == null ? 1 : Number(r.banner_zoom),
  externalPrice: r.external_price == null ? null : Number(r.external_price),
  reflectionEmailOffsetMinutes: r.reflection_email_offset_minutes == null ? 20 : Number(r.reflection_email_offset_minutes),
  reflectionEmailOffsetDirection: r.reflection_email_offset_direction || "before",
});
const eventToRow = (e) => ({
  title: e.title, topic: e.topic, date: e.date, start_time: e.start, end_time: e.end,
  location: e.location, mode: e.mode, presenter: e.presenter, presenters: e.presenter,
  registered: e.registered ?? 0, capacity: e.capacity, waitlist: e.waitlist ?? 0,
  status: e.status, meeting_url: e.meetingUrl || null,
  description: e.description || null, learning_objectives: e.learningObjectives || null,
  organisers: e.organisers || null, supporting_staff: e.supportingStaff || null,
  campus: e.campus || null, room: e.room || null, level: e.level || null,
  online_capacity: e.onlineCapacity || null, in_person_capacity: e.inPersonCapacity || null,
  tags: e.tags || [], reflection_method: e.reflectionMethod || "link", asmirt_code: e.asmirtCode || null,
  recording_url: e.recordingUrl || null,
  cpd_type_id: e.cpdTypeId || null, open_to_external: e.openToExternal ?? true,
  reflection_auto_email: e.reflectionAutoEmail !== false, show_reg_count_external: e.showRegCountExternal ?? false,
  banner_focal_x: e.bannerFocalX ?? 50, banner_focal_y: e.bannerFocalY ?? 50, banner_zoom: e.bannerZoom ?? 1,
  external_price: e.externalPrice === "" || e.externalPrice == null ? null : Number(e.externalPrice),
  reflection_email_offset_minutes: e.reflectionEmailOffsetMinutes ?? 20,
  reflection_email_offset_direction: e.reflectionEmailOffsetDirection || "before",
});

const certFromRow = (r) => ({
  id: r.id, staff: r.staff_name, eventId: r.event_id, event: r.event_title, status: r.status, date: r.date,
  recipientEmail: r.recipient_email, cpdHours: r.cpd_hours == null ? null : Number(r.cpd_hours),
  pdfUrl: r.pdf_path && supabase ? supabase.storage.from("certificates").getPublicUrl(r.pdf_path).data.publicUrl : null,
  sentAt: r.sent_at, isManual: !!r.is_manual, cpdTypeId: r.cpd_type_id || null,
  resendCount: r.resend_count || 0, lastResentAt: r.last_resent_at || null,
});
const certToRow = (c) => ({
  staff_name: c.staff, event_id: c.eventId ?? null, event_title: c.event, status: c.status, date: c.date,
});

const registrationFromRow = (r) => ({
  id: r.id, eventId: r.event_id, userId: r.user_id, externalParticipantId: r.external_participant_id,
  name: r.name, email: r.email, dietary: r.dietary, isExternal: r.is_external,
  attendanceStatus: r.attendance_status, createdAt: r.created_at,
  profession: r.profession, campus: r.campus, attendanceType: r.attendance_type,
  accessibility: r.accessibility, comments: r.comments,
  reflectionEmailSentAt: r.reflection_email_sent_at || null,
});
const registrationToRow = (r) => ({
  id: r.id, event_id: r.eventId, user_id: r.userId ?? null, external_participant_id: r.externalParticipantId ?? null,
  name: r.name, email: r.email, dietary: r.dietary ?? null, is_external: r.isExternal ?? false,
  attendance_status: r.attendanceStatus || "Registered",
  profession: r.profession ?? null, campus: r.campus ?? null, attendance_type: r.attendanceType ?? null,
  accessibility: r.accessibility ?? null, comments: r.comments ?? null,
});

const externalFromRow = (r) => ({ id: r.id, name: r.name, email: r.email, createdAt: r.created_at });

/* ---------------------------------------------------------------------- */
/* fetch                                                                  */
/* ---------------------------------------------------------------------- */
export async function fetchUsers() {
  if (!supabaseConfigured) return SEED_USERS;
  const { data, error } = await supabase.from("users").select("*").order("created_at");
  if (error) { console.error("fetchUsers", error); return SEED_USERS; }
  return data.map(userFromRow);
}

export async function fetchStaff() {
  if (!supabaseConfigured) return STAFF_SEED;
  const { data, error } = await supabase.from("staff").select("*").order("name");
  if (error) { console.error("fetchStaff", error); return STAFF_SEED; }
  return data.map(staffFromRow);
}

export async function fetchEvents() {
  if (!supabaseConfigured) return UPCOMING_EVENTS;
  const { data, error } = await supabase.from("events").select("*")
    .not("status", "in", "(Completed,Archived)").order("date");
  if (error) { console.error("fetchEvents", error); return UPCOMING_EVENTS; }
  return data.map(eventFromRow);
}

export async function fetchPreviousEvents() {
  if (!supabaseConfigured) return PREVIOUS_EVENTS;
  const { data, error } = await supabase.from("events").select("*")
    .in("status", ["Completed", "Archived"]).order("date", { ascending: false });
  if (error) { console.error("fetchPreviousEvents", error); return PREVIOUS_EVENTS; }
  return data.map(r => ({
    id: r.id, title: r.title, topic: r.topic, date: r.date, attendance: r.attendance, capacity: r.capacity,
    feedback: r.feedback == null ? null : Number(r.feedback), presenter: r.presenter,
    start: r.start_time, end: r.end_time, mode: r.mode, recordingUrl: r.recording_url || "",
  }));
}

export async function fetchCertificates() {
  if (!supabaseConfigured) return CERT_QUEUE;
  const { data, error } = await supabase.from("certificates").select("*").order("date", { ascending: false });
  if (error) { console.error("fetchCertificates", error); return CERT_QUEUE; }
  return data.map(certFromRow);
}

export async function fetchRegistrations() {
  if (!supabaseConfigured) return [];
  const { data, error } = await supabase.from("registrations").select("*").order("created_at");
  if (error) { console.error("fetchRegistrations", error); return []; }
  return data.map(registrationFromRow);
}

export async function fetchExternalParticipants() {
  if (!supabaseConfigured) return [];
  const { data, error } = await supabase.from("external_participants").select("*").order("created_at");
  if (error) { console.error("fetchExternalParticipants", error); return []; }
  return data.map(externalFromRow);
}

/* ---------------------------------------------------------------------- */
/* mutate, silent no-ops when Supabase isn't configured                  */
/* ---------------------------------------------------------------------- */
export async function insertUser(user) {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from("users").insert(userToRow(user));
  if (error) console.error("insertUser", error);
}
export async function updateUser(id, patch) {
  if (!supabaseConfigured) return;
  const row = {};
  if ("name" in patch) row.name = patch.name;
  if ("email" in patch) row.email = patch.email;
  if ("role" in patch) row.role = patch.role;
  if ("avatarId" in patch) row.avatar_id = patch.avatarId;
  if ("avatarColor" in patch) row.avatar_color = patch.avatarColor;
  if ("dietaryRequirements" in patch) row.dietary_requirements = patch.dietaryRequirements;
  if ("accessibility" in patch) row.accessibility = patch.accessibility;
  if ("authId" in patch) row.auth_id = patch.authId;
  if ("userType" in patch) row.user_type = patch.userType;
  if ("verified" in patch) row.verified = patch.verified;
  if ("secondaryEmail" in patch) row.secondary_email = patch.secondaryEmail;
  if ("certEmailPreference" in patch) row.cert_email_preference = patch.certEmailPreference;
  if ("onboarded" in patch) row.onboarded = patch.onboarded;
  if ("themeMode" in patch) row.theme_mode = patch.themeMode;
  if ("mainThemeMode" in patch) row.main_theme_mode = patch.mainThemeMode;
  if ("isTest" in patch) row.is_test = patch.isTest;
  if ("profession" in patch) row.profession = patch.profession;
  if ("department" in patch) row.department = patch.department;
  const { error } = await supabase.from("users").update(row).eq("id", id);
  if (error) console.error("updateUser", error);
}
export async function deleteUser(id) {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) console.error("deleteUser", error);
}

/* ---------------------------------------------------------------------- */
/* auth, login_emails + profile resolution                               */
/* ---------------------------------------------------------------------- */
export async function fetchLoginEmail(email) {
  if (!supabaseConfigured) return null;
  const { data, error } = await supabase.from("login_emails").select("email,user_id").eq("email", email.toLowerCase()).maybeSingle();
  if (error) { console.error("fetchLoginEmail", error); return null; }
  return data;
}
export async function insertLoginEmail(email, userId) {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from("login_emails").insert({ email: email.toLowerCase(), user_id: userId });
  if (error) console.error("insertLoginEmail", error);
}
export async function fetchUserById(id) {
  if (!supabaseConfigured) return null;
  const { data, error } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
  if (error) { console.error("fetchUserById", error); return null; }
  return data ? userFromRow(data) : null;
}
export async function fetchUserByEmail(email) {
  if (!supabaseConfigured) return null;
  const { data, error } = await supabase.from("users").select("*").ilike("email", email).maybeSingle();
  if (error) { console.error("fetchUserByEmail", error); return null; }
  return data ? userFromRow(data) : null;
}
export async function revokeUserSession(authId, action = "revoke") {
  if (!supabaseConfigured) return { ok: false };
  const { data, error } = await supabase.functions.invoke("admin-revoke-session", { body: { authId, action } });
  if (error) { console.error("revokeUserSession", error); return { ok: false }; }
  return { ok: true, data };
}

export async function insertStaff(rec) {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from("staff").insert({ id: rec.id, ...staffToRow(rec) });
  if (error) console.error("insertStaff", error);
}
export async function updateStaff(id, rec) {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from("staff").update(staffToRow(rec)).eq("id", id);
  if (error) console.error("updateStaff", error);
}
export async function deleteStaff(id) {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from("staff").delete().eq("id", id);
  if (error) console.error("deleteStaff", error);
}

export async function updateEventStatus(id, status) {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from("events").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) console.error("updateEventStatus", error);
}
export async function insertEvent(event) {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from("events").insert({ id: event.id, ...eventToRow(event) });
  if (error) console.error("insertEvent", error);
}
export async function updateEvent(id, event) {
  if (!supabaseConfigured) return true;
  const { data, error } = await supabase.from("events").update({ ...eventToRow(event), updated_at: new Date().toISOString() }).eq("id", id).select("id");
  if (error) { console.error("updateEvent", error); return false; }
  // RLS silently drops the row instead of erroring when the USING clause excludes it — an
  // empty `data` array here means the write matched nothing, which looks identical to success
  // unless we check for it explicitly.
  if (!data || data.length === 0) { console.error("updateEvent: no row matched/updated (RLS?)", id); return false; }
  return true;
}
export async function deleteEvent(id) {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) console.error("deleteEvent", error);
}

export async function updateCertificateStatus(id, status) {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from("certificates").update({ status }).eq("id", id);
  if (error) console.error("updateCertificateStatus", error);
}

/* ---------------------------------------------------------------------- */
/* CPD types (appellation codes)                                          */
/* ---------------------------------------------------------------------- */
const cpdTypeFromRow = (r) => ({ id: r.id, name: r.name, appellationCode: r.appellation_code, category: r.category || "", sortOrder: r.sort_order ?? 0 });

export async function fetchCpdTypes() {
  if (!supabaseConfigured) return [];
  const { data, error } = await supabase.from("cpd_types").select("*").order("sort_order").order("name");
  if (error) { console.error("fetchCpdTypes", error); return []; }
  return data.map(cpdTypeFromRow);
}
export async function insertCpdType(cpdType) {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from("cpd_types").insert({ id: cpdType.id, name: cpdType.name, appellation_code: cpdType.appellationCode, category: cpdType.category || null, sort_order: cpdType.sortOrder ?? 0 });
  if (error) console.error("insertCpdType", error);
}
export async function updateCpdType(id, patch) {
  if (!supabaseConfigured) return;
  const row = {};
  if ("name" in patch) row.name = patch.name;
  if ("appellationCode" in patch) row.appellation_code = patch.appellationCode;
  if ("category" in patch) row.category = patch.category || null;
  if ("sortOrder" in patch) row.sort_order = patch.sortOrder;
  const { error } = await supabase.from("cpd_types").update(row).eq("id", id);
  if (error) console.error("updateCpdType", error);
}
export async function deleteCpdType(id) {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from("cpd_types").delete().eq("id", id);
  if (error) console.error("deleteCpdType", error);
}
/* ---------------------------------------------------------------------- */
/* brainstorm ideas (admin/owner shared idea list + public submissions)   */
/* ---------------------------------------------------------------------- */
const brainstormIdeaFromRow = (r) => ({ id: r.id, content: r.content, category: r.category || "other", addedByName: r.added_by_name, source: r.source || "admin", createdAt: r.created_at });

export async function fetchBrainstormIdeas() {
  if (!supabaseConfigured) return [];
  const { data, error } = await supabase.from("brainstorm_ideas").select("*").order("created_at", { ascending: false });
  if (error) { console.error("fetchBrainstormIdeas", error); return []; }
  return data.map(brainstormIdeaFromRow);
}
export async function insertBrainstormIdea(idea) {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from("brainstorm_ideas").insert({ id: idea.id, content: idea.content, category: idea.category || "other", added_by_name: idea.addedByName, source: idea.source || "admin" });
  if (error) console.error("insertBrainstormIdea", error);
}
export async function deleteBrainstormIdea(id) {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from("brainstorm_ideas").delete().eq("id", id);
  if (error) console.error("deleteBrainstormIdea", error);
}
/* ---------------------------------------------------------------------- */
/* app_settings (generic admin/owner-configurable key/value store)        */
/* ---------------------------------------------------------------------- */
export async function fetchAppSetting(key) {
  if (!supabaseConfigured) return null;
  const { data, error } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle();
  if (error) { console.error("fetchAppSetting", error); return null; }
  return data?.value ?? null;
}
export async function upsertAppSetting(key, value) {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from("app_settings").upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) console.error("upsertAppSetting", error);
}
/* ---------------------------------------------------------------------- */
/* tags (admin-managed event topics)                                      */
/* ---------------------------------------------------------------------- */
const tagFromRow = (r) => ({ id: r.id, name: r.name, sortOrder: r.sort_order });

export async function fetchTags() {
  if (!supabaseConfigured) return [];
  const { data, error } = await supabase.from("tags").select("*").order("sort_order");
  if (error) { console.error("fetchTags", error); return []; }
  return data.map(tagFromRow);
}
export async function insertTag(tag) {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from("tags").insert({ id: tag.id, name: tag.name, sort_order: tag.sortOrder ?? 0 });
  if (error) console.error("insertTag", error);
}
export async function updateTag(id, patch) {
  if (!supabaseConfigured) return;
  const row = {};
  if ("name" in patch) row.name = patch.name;
  if ("sortOrder" in patch) row.sort_order = patch.sortOrder;
  const { error } = await supabase.from("tags").update(row).eq("id", id);
  if (error) console.error("updateTag", error);
}
export async function deleteTag(id) {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) console.error("deleteTag", error);
}

/* ---------------------------------------------------------------------- */
/* avatar icons + colours (admin-managed)                                 */
/* ---------------------------------------------------------------------- */
const avatarIconFromRow = (r) => ({
  id: r.id, kind: r.kind, iconKey: r.icon_key, imagePath: r.image_path,
  label: r.label, iconScale: r.icon_scale, sortOrder: r.sort_order,
});

export async function fetchAvatarIcons() {
  if (!supabaseConfigured) return [];
  const { data, error } = await supabase.from("avatar_icons").select("*").order("sort_order");
  if (error) { console.error("fetchAvatarIcons", error); return []; }
  return data.map(avatarIconFromRow);
}
export async function insertAvatarIcon(icon) {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from("avatar_icons").insert({
    id: icon.id, kind: icon.kind, icon_key: icon.iconKey || null, image_path: icon.imagePath || null,
    label: icon.label, icon_scale: icon.iconScale ?? 55, sort_order: icon.sortOrder ?? 0,
  });
  if (error) console.error("insertAvatarIcon", error);
}
export async function updateAvatarIcon(id, patch) {
  if (!supabaseConfigured) return;
  const row = {};
  if ("label" in patch) row.label = patch.label;
  if ("iconScale" in patch) row.icon_scale = patch.iconScale;
  if ("sortOrder" in patch) row.sort_order = patch.sortOrder;
  if ("imagePath" in patch) row.image_path = patch.imagePath;
  const { error } = await supabase.from("avatar_icons").update(row).eq("id", id);
  if (error) console.error("updateAvatarIcon", error);
}
export async function deleteAvatarIcon(id) {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from("avatar_icons").delete().eq("id", id);
  if (error) console.error("deleteAvatarIcon", error);
}
export async function uploadAvatarIconImage(file) {
  if (!supabaseConfigured) return null;
  const path = `${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from("avatar-icons").upload(path, file);
  if (error) { console.error("uploadAvatarIconImage", error); return null; }
  return path;
}

const avatarColorFromRow = (r) => ({ id: r.id, name: r.name, hex: r.hex, sortOrder: r.sort_order });

export async function fetchAvatarColors() {
  if (!supabaseConfigured) return [];
  const { data, error } = await supabase.from("avatar_colors").select("*").order("sort_order");
  if (error) { console.error("fetchAvatarColors", error); return []; }
  return data.map(avatarColorFromRow);
}
export async function insertAvatarColor(color) {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from("avatar_colors").insert({ id: color.id, name: color.name, hex: color.hex, sort_order: color.sortOrder ?? 0 });
  if (error) console.error("insertAvatarColor", error);
}
export async function updateAvatarColor(id, patch) {
  if (!supabaseConfigured) return;
  const row = {};
  if ("name" in patch) row.name = patch.name;
  if ("hex" in patch) row.hex = patch.hex;
  if ("sortOrder" in patch) row.sort_order = patch.sortOrder;
  const { error } = await supabase.from("avatar_colors").update(row).eq("id", id);
  if (error) console.error("updateAvatarColor", error);
}
export async function deleteAvatarColor(id) {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from("avatar_colors").delete().eq("id", id);
  if (error) console.error("deleteAvatarColor", error);
}

export async function deleteCertificate(id) {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from("certificates").delete().eq("id", id);
  if (error) console.error("deleteCertificate", error);
}

export async function insertRegistration(reg) {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from("registrations").insert(registrationToRow(reg));
  if (error) console.error("insertRegistration", error);
}
export async function updateRegistration(id, patch) {
  if (!supabaseConfigured) return;
  const row = {};
  if ("attendanceStatus" in patch) row.attendance_status = patch.attendanceStatus;
  if ("attendanceType" in patch) row.attendance_type = patch.attendanceType;
  if ("dietary" in patch) row.dietary = patch.dietary;
  if ("accessibility" in patch) row.accessibility = patch.accessibility;
  if ("comments" in patch) row.comments = patch.comments;
  if ("reflectionEmailSentAt" in patch) row.reflection_email_sent_at = patch.reflectionEmailSentAt;
  const { error } = await supabase.from("registrations").update(row).eq("id", id);
  if (error) console.error("updateRegistration", error);
}
export async function deleteRegistration(id) {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from("registrations").delete().eq("id", id);
  if (error) console.error("deleteRegistration", error);
}

export async function insertExternalParticipant(p) {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from("external_participants").insert({ id: p.id, name: p.name, email: p.email });
  if (error) console.error("insertExternalParticipant", error);
}
export async function updateExternalParticipant(id, patch) {
  if (!supabaseConfigured) return;
  const row = {};
  if ("name" in patch) row.name = patch.name;
  if ("email" in patch) row.email = patch.email;
  const { error } = await supabase.from("external_participants").update(row).eq("id", id);
  if (error) console.error("updateExternalParticipant", error);
}
export async function deleteExternalParticipant(id) {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from("external_participants").delete().eq("id", id);
  if (error) console.error("deleteExternalParticipant", error);
}

/* ---------------------------------------------------------------------- */
/* files (flyer / slides / handouts / supporting files)                   */
/* ---------------------------------------------------------------------- */
const fileFromRow = (r) => ({
  id: r.id, eventId: r.event_id, kind: r.kind, storagePath: r.storage_path,
  url: supabase ? supabase.storage.from("event-files").getPublicUrl(r.storage_path).data.publicUrl : null,
  uploadedBy: r.uploaded_by, createdAt: r.created_at,
});

export async function fetchEventFiles(eventId) {
  if (!supabaseConfigured) return [];
  const { data, error } = await supabase.from("files").select("*").eq("event_id", eventId).order("created_at");
  if (error) { console.error("fetchEventFiles", error); return []; }
  return data.map(fileFromRow);
}

export async function fetchAllFiles() {
  if (!supabaseConfigured) return [];
  const { data, error } = await supabase.from("files").select("*").order("created_at", { ascending: false });
  if (error) { console.error("fetchAllFiles", error); return []; }
  return data.map(fileFromRow);
}

export async function uploadEventFile({ eventId, kind, file, uploadedBy }) {
  if (!supabaseConfigured) return null;
  const path = `${eventId}/${kind}-${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("event-files").upload(path, file);
  if (uploadError) { console.error("uploadEventFile (storage)", uploadError); return null; }
  const row = { id: "f" + Date.now(), event_id: eventId, kind, storage_path: path, uploaded_by: uploadedBy || null };
  const { error } = await supabase.from("files").insert(row);
  if (error) { console.error("uploadEventFile (row)", error); return null; }
  logAudit({ actorId: uploadedBy, action: "file.uploaded", entityType: "event", entityId: eventId, details: { kind, filename: file.name } });
  return fileFromRow(row);
}

export async function deleteEventFile(file, actorId) {
  if (!supabaseConfigured) return;
  await supabase.storage.from("event-files").remove([file.storagePath]);
  const { error } = await supabase.from("files").delete().eq("id", file.id);
  if (error) console.error("deleteEventFile", error);
  logAudit({ actorId, action: "file.deleted", entityType: "event", entityId: file.eventId, details: { kind: file.kind, filename: file.storagePath?.split("/").pop() } });
}

/* ---------------------------------------------------------------------- */
/* reflections                                                            */
/* ---------------------------------------------------------------------- */
const reflectionFromRow = (r) => ({
  id: r.id, eventId: r.event_id, registrationId: r.registration_id,
  name: r.name, email: r.email, content: r.content, rating: r.rating,
  relevanceRating: r.relevance_rating, appropriateness: r.appropriateness,
  mostValuable: r.most_valuable, improvements: r.improvements, futureTopics: r.future_topics,
  eventTitle: r.event_title, presenter: r.presenter, submittedAt: r.submitted_at,
});
const reflectionToRow = (r) => ({
  id: r.id, event_id: r.eventId, registration_id: r.registrationId ?? null,
  name: r.name, email: r.email ?? null, content: r.content, rating: r.rating ?? null,
  relevance_rating: r.relevanceRating ?? null, appropriateness: r.appropriateness ?? null,
  most_valuable: r.mostValuable ?? null, improvements: r.improvements ?? null, future_topics: r.futureTopics ?? null,
  event_title: r.eventTitle, presenter: r.presenter ?? null,
});

export async function fetchReflections() {
  if (!supabaseConfigured) return [];
  const { data, error } = await supabase.from("reflections").select("*").order("submitted_at", { ascending: false });
  if (error) { console.error("fetchReflections", error); return []; }
  return data.map(reflectionFromRow);
}
export async function insertReflection(reflection) {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from("reflections").insert(reflectionToRow(reflection));
  if (error) console.error("insertReflection", error);
}
export async function deleteReflection(id) {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from("reflections").delete().eq("id", id);
  if (error) console.error("deleteReflection", error);
}

/* ---------------------------------------------------------------------- */
/* personal reflections (self-authored, non-WH CPD activities)            */
/* ---------------------------------------------------------------------- */
const personalReflectionFromRow = (r) => ({
  id: r.id, userId: r.user_id, activityName: r.activity_name, activityDate: r.activity_date,
  mode: r.mode, answers: r.answers || {}, freeformText: r.freeform_text, createdAt: r.created_at,
});
const personalReflectionToRow = (r) => ({
  id: r.id, user_id: r.userId, activity_name: r.activityName, activity_date: r.activityDate,
  mode: r.mode || "full", answers: r.answers || {}, freeform_text: r.freeformText ?? null,
});

export async function fetchPersonalReflections() {
  if (!supabaseConfigured) return [];
  const { data, error } = await supabase.from("personal_reflections").select("*").order("activity_date", { ascending: false });
  if (error) { console.error("fetchPersonalReflections", error); return []; }
  return data.map(personalReflectionFromRow);
}
export async function insertPersonalReflection(reflection) {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from("personal_reflections").insert(personalReflectionToRow(reflection));
  if (error) console.error("insertPersonalReflection", error);
}
export async function deletePersonalReflection(id) {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from("personal_reflections").delete().eq("id", id);
  if (error) console.error("deletePersonalReflection", error);
}
export async function emailReflectionCopy(payload) {
  if (!supabaseConfigured) return { ok: false };
  const { error } = await supabase.functions.invoke("email-reflection-copy", { body: payload });
  if (error) { console.error("emailReflectionCopy", error); return { ok: false }; }
  return { ok: true };
}

/* ---------------------------------------------------------------------- */
/* certificate + reminder Edge Functions                                  */
/* ---------------------------------------------------------------------- */
export async function sendReflectionCertificate(reflectionId) {
  if (!supabaseConfigured) return { ok: false };
  const { data, error } = await supabase.functions.invoke("send-reflection-certificate", { body: { reflectionId } });
  if (error) { console.error("sendReflectionCertificate", error); return { ok: false }; }
  return { ok: true, data };
}

export async function createManualCertificate({ name, email, sessionName, date, cpdHours, cpdTypeId }) {
  if (!supabaseConfigured) return { ok: false };
  const { data, error } = await supabase.functions.invoke("create-manual-certificate", {
    body: { name, email, sessionName, date, cpdHours, cpdTypeId },
  });
  if (error) { console.error("createManualCertificate", error); return { ok: false }; }
  return { ok: true, ...data };
}

// Renders the certificate template with sample data (no real certificate created, nothing
// emailed) so an admin can preview what an attendee's certificate will look like.
export async function previewCertificateTemplate({ sessionName, date, cpdHours, cpdTypeId }) {
  if (!supabaseConfigured) return { ok: false };
  const { data, error } = await supabase.functions.invoke("preview-certificate-template", {
    body: { sessionName, date, cpdHours, cpdTypeId },
  });
  if (error) { console.error("previewCertificateTemplate", error); return { ok: false }; }
  return { ok: true, blob: data instanceof Blob ? data : new Blob([data], { type: "application/pdf" }) };
}

export async function sendReflectionReminder({ name, email, eventId, eventTitle }) {
  if (!supabaseConfigured) return { ok: false };
  const { data, error } = await supabase.functions.invoke("send-reflection-reminder", {
    body: { name, email, eventId, eventTitle },
  });
  if (error) { console.error("sendReflectionReminder", error); return { ok: false }; }
  return { ok: true, ...data };
}

export async function emailReflectionsReport({ toEmail, toName, entries }) {
  if (!supabaseConfigured) return { ok: false };
  const { error } = await supabase.functions.invoke("admin-email-reflections-report", { body: { toEmail, toName, entries } });
  if (error) { console.error("emailReflectionsReport", error); return { ok: false }; }
  return { ok: true };
}

export async function sendCertificateEmail(certificateId, isResend = false) {
  if (!supabaseConfigured) return { ok: false };
  const { data, error } = await supabase.functions.invoke("send-certificate-email", { body: { certificateId, isResend } });
  if (error) { console.error("sendCertificateEmail", error); return { ok: false }; }
  return { ok: data?.ok ?? true, ...data };
}

/* ---------------------------------------------------------------------- */
/* duplicate detection dismissals                                         */
/* ---------------------------------------------------------------------- */
export async function fetchDismissedPairs(kind) {
  if (!supabaseConfigured) return [];
  const { data, error } = await supabase.from("duplicate_dismissals").select("id_a,id_b").eq("kind", kind);
  if (error) { console.error("fetchDismissedPairs", error); return []; }
  return data.map(r => [r.id_a, r.id_b].sort().join("::"));
}
export async function insertDismissedPair(kind, idA, idB) {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from("duplicate_dismissals").insert({ kind, id_a: idA, id_b: idB });
  if (error) console.error("insertDismissedPair", error);
}

/* ---------------------------------------------------------------------- */
/* audit log                                                              */
/* ---------------------------------------------------------------------- */
export async function logAudit({ actorId, action, entityType, entityId, details }) {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from("audit_log").insert({
    actor_id: actorId ?? null, action, entity_type: entityType ?? null, entity_id: entityId ?? null, details: details ?? null,
  });
  if (error) console.error("logAudit", error);
}

export async function fetchAuditLog(limit = 50) {
  if (!supabaseConfigured) return [];
  const { data, error } = await supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) { console.error("fetchAuditLog", error); return []; }
  return data.map(r => ({
    id: r.id, actorId: r.actor_id, action: r.action, entityType: r.entity_type, entityId: r.entity_id, details: r.details, createdAt: r.created_at,
  }));
}
