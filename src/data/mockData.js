import {
  Calendar, Users, Award, BarChart3, Archive, HelpCircle,
  LayoutDashboard, Settings as SettingsIcon,
  Bone, Waves, Magnet, Radiation, Stethoscope, Ghost,
  Building2, Syringe, Pill, Thermometer, Microscope, Brain, Eye, Briefcase, ClipboardList, Sun, Donut, Bandage, Cookie,
} from "lucide-react";
import { SkullIcon, HandBonesIcon, PlusOutlineIcon } from "../components/customIcons";
import { daysFromNow } from "../lib/helpers";

/* ---------------------------------------------------------------------- */
/* BRAND COLOURS                                                          */
/* ---------------------------------------------------------------------- */
export const BRAND_HEX = { green: "#9CCB3B", blue: "#35A8DD", purple: "#7B3FE4", grey: "#58595B" };

/* ---------------------------------------------------------------------- */
/* AVATAR COLOURS (wider palette than the theme's brand colours)          */
/* ---------------------------------------------------------------------- */
export const AVATAR_COLORS = {
  green: "#9CCB3B", blue: "#35A8DD", purple: "#7B3FE4", grey: "#58595B",
  teal: "#14B8A6", orange: "#F59E0B", rose: "#F43F5E", red: "#EF4444",
  indigo: "#6366F1", cyan: "#06B6D4", pink: "#EC4899", lime: "#84CC16",
};

/* ---------------------------------------------------------------------- */
/* MOCK DATA                                                              */
/* ---------------------------------------------------------------------- */
export const TOPICS = ["Trauma", "MSK", "CT", "MRI", "Leadership", "Research", "Paediatrics", "Ultrasound"];

// Helper for seeding a date/time N hours from now (used for demo events close enough to show hour-based countdowns).
// Uses local date/time components throughout; mixing toISOString's UTC date with local
// getHours() broke around midnight (e.g. 10pm AEST + 3h rolls into the next UTC day already).
function hoursFromNow(n) {
  const d = new Date(Date.now() + n * 3600000);
  let mins = Math.round(d.getMinutes() / 15) * 15;
  if (mins === 60) { d.setHours(d.getHours() + 1); mins = 0; }
  d.setMinutes(mins, 0, 0);
  const yyyy = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(mins).padStart(2, "0");
  return { date: `${yyyy}-${mo}-${dd}`, time: `${hh}:${mm}` };
}

export const UPCOMING_EVENTS = [
  { id: "e0", title: "Contrast Reaction Simulation Drill", topic: "MRI", date: hoursFromNow(3).date, start: hoursFromNow(3).time, end: hoursFromNow(4).time, location: "Microsoft Teams", mode: "Online", presenter: "R. Chen", registered: 18, capacity: 40, waitlist: 0, status: "Registration Open", meetingUrl: "https://teams.microsoft.com/l/meetup-join/whmi-cpd-demo" },
  { id: "e1", title: "Advanced Trauma Imaging Series", topic: "Trauma", date: daysFromNow(3), start: "13:00", end: "15:00", location: "Sunshine Hospital, Education Centre", mode: "Hybrid", presenter: "Dr. A. Okafor", registered: 42, capacity: 60, waitlist: 0, status: "Registration Open", meetingUrl: "https://teams.microsoft.com/l/meetup-join/whmi-cpd-trauma" },
  { id: "e2", title: "MSK Ultrasound Masterclass", topic: "MSK", date: daysFromNow(9), start: "09:00", end: "12:30", location: "Footscray Hospital, Room 3", mode: "In-person", presenter: "S. Ferreira", registered: 28, capacity: 30, waitlist: 4, status: "Registration Open" },
  { id: "e3", title: "MRI Safety Update 2026", topic: "MRI", date: daysFromNow(16), start: "12:00", end: "13:00", location: "Microsoft Teams", mode: "Online", presenter: "R. Chen", registered: 61, capacity: 100, waitlist: 0, status: "Registration Open", meetingUrl: "https://teams.microsoft.com/l/meetup-join/whmi-cpd-mri-safety" },
  { id: "e4", title: "Leadership in Radiography", topic: "Leadership", date: daysFromNow(24), start: "14:00", end: "16:00", location: "Western Health Education Hub", mode: "Hybrid", presenter: "J. Hewis", registered: 15, capacity: 40, waitlist: 0, status: "Draft", meetingUrl: "https://teams.microsoft.com/l/meetup-join/whmi-cpd-leadership" },
  { id: "e5", title: "Paediatric CT Protocols", topic: "CT", date: daysFromNow(30), start: "10:00", end: "11:30", location: "Sunshine Hospital, Education Centre", mode: "In-person", presenter: "Dr. M. Nguyen", registered: 33, capacity: 35, waitlist: 0, status: "Awaiting Approval" },
  { id: "e6", title: "Research Methods for Clinicians", topic: "Research", date: daysFromNow(37), start: "13:00", end: "16:00", location: "Microsoft Teams", mode: "Online", presenter: "Dr. A. Okafor", registered: 9, capacity: 50, waitlist: 0, status: "Registration Open", meetingUrl: "https://teams.microsoft.com/l/meetup-join/whmi-cpd-research" },
];

export const PREVIOUS_EVENTS = [
  { id: "p1", title: "Contrast Media Safety Refresher", topic: "MRI", date: daysFromNow(-14), attendance: 44, capacity: 50, feedback: 4.6, presenter: "R. Chen" },
  { id: "p2", title: "Ultrasound Fundamentals Day", topic: "Ultrasound", date: daysFromNow(-28), attendance: 38, capacity: 40, feedback: 4.8, presenter: "S. Ferreira" },
  { id: "p3", title: "Trauma Case Review Journal Club", topic: "Trauma", date: daysFromNow(-42), attendance: 27, capacity: 30, feedback: 4.3, presenter: "Dr. A. Okafor" },
  { id: "p4", title: "CT Dose Optimisation Workshop", topic: "CT", date: daysFromNow(-56), attendance: 31, capacity: 35, feedback: 4.5, presenter: "Dr. M. Nguyen" },
  { id: "p5", title: "Leadership Foundations", topic: "Leadership", date: daysFromNow(-70), attendance: 22, capacity: 25, feedback: 4.7, presenter: "J. Hewis" },
  { id: "p6", title: "MSK Reporting Essentials", topic: "MSK", date: daysFromNow(-84), attendance: 40, capacity: 40, feedback: 4.4, presenter: "S. Ferreira" },
];

export const CAMPUS_OPTIONS = [
  { code: "SH", label: "Sunshine" },
  { code: "FH", label: "Footscray" },
  { code: "WTN", label: "Williamstown" },
  { code: "SDH", label: "Sunbury" },
];
export const MODALITY_OPTIONS = ["General XR", "CT", "MRI", "Ultrasound", "Mammography", "Nuclear Medicine", "Angiography"];
export const GRADE_OPTIONS = ["Student", "Grade 1", "Grade 2", "Senior", "Clinical Educator", "Manager"];

export const STAFF_SEED = [
  { id: "s1", name: "Amir Hossain", profession: "Radiographer", campuses: ["SH"], department: "Medical Imaging", hours: 18.5, attended: 9, certificates: 8, modality: "General XR", grade: "Grade 2", qualifiedYear: 2019, attendedEventIds: ["p1", "p3"], hoursLast3Years: 15, eventsThisYear: 4, lastAttended: daysFromNow(-14) },
  { id: "s2", name: "Leah Biffin", profession: "MRI Radiographer", campuses: ["FH"], department: "Medical Imaging", hours: 14, attended: 6, certificates: 6, modality: "MRI", grade: "Senior", qualifiedYear: 2014, attendedEventIds: ["p1", "p4"], hoursLast3Years: 9, eventsThisYear: 2, lastAttended: daysFromNow(-14) },
  { id: "s3", name: "Min Ku", profession: "Sonographer", campuses: ["SH", "SDH"], department: "Medical Imaging", hours: 21, attended: 11, certificates: 10, modality: "Ultrasound", grade: "Senior", qualifiedYear: 2011, hoursLast3Years: 12, eventsThisYear: 5, lastAttended: daysFromNow(-84) },
  { id: "s4", name: "Paul Kelly", profession: "Radiographer", campuses: ["WTN"], department: "Medical Imaging", hours: 9.5, attended: 5, certificates: 5, modality: "General XR", grade: "Grade 1", qualifiedYear: 2022, hoursLast3Years: 9.5, eventsThisYear: 3, lastAttended: daysFromNow(-28) },
  { id: "s5", name: "Son Nguyen", profession: "CT Radiographer", campuses: ["SH"], department: "Medical Imaging", hours: 16, attended: 7, certificates: 7, modality: "CT", grade: "Grade 2", qualifiedYear: 2018, hoursLast3Years: 10, eventsThisYear: 3, lastAttended: daysFromNow(-56) },
  { id: "s6", name: "Priya Raman", profession: "Radiographer", campuses: ["FH", "WTN"], department: "Medical Imaging", hours: 11, attended: 6, certificates: 4, modality: "General XR", grade: "Grade 1", qualifiedYear: 2021, hoursLast3Years: 11, eventsThisYear: 4, lastAttended: daysFromNow(-28) },
  { id: "s7", name: "Chris Owusu", profession: "Student Radiographer", campuses: ["SH"], department: "Medical Imaging", hours: 6, attended: 3, certificates: 2, modality: "General XR", grade: "Student", qualifiedYear: null, hoursLast3Years: 6, eventsThisYear: 3, lastAttended: daysFromNow(-70) },
  { id: "s8", name: "Grace Tan", profession: "Radiographer", campuses: ["WTN", "SDH"], department: "Medical Imaging", hours: 19, attended: 10, certificates: 9, modality: "Mammography", grade: "Clinical Educator", qualifiedYear: 2009, hoursLast3Years: 11, eventsThisYear: 4, lastAttended: daysFromNow(-42) },
];

export const CERT_QUEUE = [
  { id: "c1", staff: "Amir Hossain", event: "Contrast Media Safety Refresher", status: "Awaiting Approval", date: daysFromNow(-14) },
  { id: "c2", staff: "Priya Raman", event: "Ultrasound Fundamentals Day", status: "Awaiting Approval", date: daysFromNow(-28) },
  { id: "c3", staff: "Grace Tan", event: "Trauma Case Review Journal Club", status: "Sent", date: daysFromNow(-42) },
  { id: "c4", staff: "Son Nguyen", event: "CT Dose Optimisation Workshop", status: "Sent", date: daysFromNow(-56) },
  { id: "c5", staff: "Chris Owusu", event: "Leadership Foundations", status: "Awaiting Approval", date: daysFromNow(-70) },
  { id: "c6", staff: "Min Ku", event: "MSK Reporting Essentials", status: "Sent", date: daysFromNow(-84) },
];

export const ACTIVITY_FEED = [
  { id: 1, text: "Min Ku submitted a reflection for MSK Ultrasound Masterclass", time: "12 min ago" },
  { id: 2, text: "Certificate sent to Grace Tan for Trauma Case Review Journal Club", time: "1 hr ago" },
  { id: 3, text: "New registration: Chris Owusu → Advanced Trauma Imaging Series", time: "2 hr ago" },
  { id: 4, text: "Event \"Paediatric CT Protocols\" moved to Awaiting Approval", time: "5 hr ago" },
  { id: 5, text: "Leah Biffin moved from waitlist to confirmed for MSK Ultrasound Masterclass", time: "yesterday" },
];

export const MONTHLY_HOURS = [
  { month: "Feb", hours: 22 }, { month: "Mar", hours: 30 }, { month: "Apr", hours: 26 },
  { month: "May", hours: 34 }, { month: "Jun", hours: 41 }, { month: "Jul", hours: 28 },
];
export const ATTENDANCE_TREND = [
  { month: "Feb", rate: 82 }, { month: "Mar", rate: 88 }, { month: "Apr", rate: 85 },
  { month: "May", rate: 91 }, { month: "Jun", rate: 89 }, { month: "Jul", rate: 93 },
];
export const MODE_SPLIT = [{ name: "In-person", value: 58 }, { name: "Online", value: 42 }];
export const TOPIC_POPULARITY = TOPICS.map((t, i) => ({ topic: t, events: [9, 7, 6, 8, 4, 3, 5, 6][i] }));

/* ---------------------------------------------------------------------- */
/* CHARACTER AVATARS + USERS + NAV                                        */
/* ---------------------------------------------------------------------- */
export const CHARACTERS = [
  { id: "bone", label: "Bones the X-ray Buddy", icon: Bone },
  { id: "waves", label: "Sonar the Ultrasound Pal", icon: Waves },
  { id: "magnet", label: "Maggie the MRI Magnet", icon: Magnet },
  { id: "radiation", label: "Ray the Safety Officer", icon: Radiation },
  { id: "stetho", label: "Doc Stetho", icon: Stethoscope },
  { id: "ghost", label: "Boo the Bone Ghost", icon: Ghost },
  { id: "skull", label: "Sherlock the Skeleton", icon: SkullIcon },
  { id: "hand", label: "Handy the Hand Bones", icon: HandBonesIcon },
  { id: "cross", label: "Addy the Health Cross", icon: PlusOutlineIcon },
  { id: "hospital", label: "Hank the Hospital", icon: Building2 },
  { id: "syringe", label: "Vic the Vaccinator", icon: Syringe },
  { id: "pill", label: "Percy the Pill", icon: Pill },
  { id: "thermometer", label: "Tempy", icon: Thermometer },
  { id: "microscope", label: "Micro the Scientist", icon: Microscope },
  { id: "brain", label: "Brainy", icon: Brain },
  { id: "eye", label: "Iris the Eye", icon: Eye },
  { id: "briefcase", label: "Barry from Admin", icon: Briefcase },
  { id: "clipboard", label: "Claire the Clipboard", icon: ClipboardList },
  { id: "sun", label: "Sunny", icon: Sun },
  { id: "donut", label: "Dot the Doughnut", icon: Donut },
  { id: "bandage", label: "Bandy the Band-Aid", icon: Bandage },
  { id: "cookie", label: "Cookie the Crumb", icon: Cookie },
];

export const SEED_USERS = [
  { id: "u1", name: "Ryan", email: "ryan@westernhealth.org.au", password: "demo", role: "admin", staffId: null, avatarId: "magnet", avatarColor: "blue" },
  { id: "u2", name: "Leah Biffin", email: "leah.biffin@westernhealth.org.au", password: "demo", role: "owner", staffId: "s2", avatarId: "waves", avatarColor: "purple" },
  { id: "u3", name: "Amir Hossain", email: "amir.hossain@westernhealth.org.au", password: "demo", role: "viewer", staffId: "s1", avatarId: "bone", avatarColor: "green" },
];

export const NAV_FULL = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "upcoming", label: "Upcoming Events", icon: Calendar },
  { id: "previous", label: "Previous Events", icon: Archive },
  { id: "staff", label: "Staff", icon: Users },
  { id: "reports", label: "Reports & Analytics", icon: BarChart3 },
  { id: "certificates", label: "Certificates", icon: Award },
  { id: "help", label: "Help Centre", icon: HelpCircle },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];
export const NAV_VIEWER = [
  { id: "mycpd", label: "My CPD", icon: Award },
  { id: "help", label: "Help Centre", icon: HelpCircle },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export const DASHBOARD_SECTIONS = [
  { id: "stats", label: "Stats Overview" },
  { id: "upNext", label: "Up Next" },
  { id: "activity", label: "Recent Activity" },
  { id: "hoursChart", label: "CPD Hours Chart" },
  { id: "modeChart", label: "Attendance Mode Chart" },
];
export const DEFAULT_LAYOUT = DASHBOARD_SECTIONS.map(s => s.id);

