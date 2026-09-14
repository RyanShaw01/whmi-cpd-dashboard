// Lightweight spotlight tour steps; selectors match `data-tour` attributes added to
// Sidebar/HeaderBar/App. Steps whose target isn't in the DOM (e.g. the notification bell,
// which only renders for admin/owner) are skipped automatically by OnboardingTour.
//
// The per-tab steps below rely on that filtering: every nav item has its own
// `data-tour="nav-<id>"` anchor, so an admin walks all ten tabs, a Western Health viewer sees
// the seven they have, and an external viewer the five they have — from one list, in nav order.
export const TOUR_STEPS = [
  {
    selector: '[data-tour="sidebar-nav"]',
    title: "Your navigation",
    body: "Everything lives in this sidebar. Let's walk through what's behind each one.",
  },

  // --- one per nav item, in the same order they appear in the sidebar ---
  {
    selector: '[data-tour="nav-dashboard"]',
    title: "Dashboard",
    body: "Your starting point: CPD hours delivered this year, what's open for registration, and anything waiting on you — certificates to approve, reflections still outstanding.",
  },
  {
    selector: '[data-tour="nav-mycpd"]',
    title: "My CPD",
    body: "Your home page. What's coming up, anything still needing your feedback, your CPD hours so far, and the events you've already done.",
  },
  {
    selector: '[data-tour="nav-mycertificates"]',
    title: "My Certificates",
    body: "Every certificate issued to you, your total CPD hours, and a download link for each one.",
  },
  {
    selector: '[data-tour="nav-upcoming"]',
    title: "Upcoming Events",
    body: "Everything scheduled. Open an event to see the full details and register — and at the bottom you'll find CPD run by other organisations.",
  },
  {
    selector: '[data-tour="nav-previous"]',
    title: "Previous Events",
    body: "Everything already held. Open one to see who attended, the feedback it got, recordings, and its certificates.",
  },
  {
    selector: '[data-tour="nav-reflection"]',
    title: "Reflections",
    body: "Your written reflections — both from Western Health events and any other CPD you want to record yourself. Add one any time.",
  },
  {
    selector: '[data-tour="nav-staff"]',
    title: "Staff",
    body: "The staff directory: everyone's CPD hours, certificates, and attendance history in one place.",
  },
  {
    selector: '[data-tour="nav-certificates"]',
    title: "Certificates",
    body: "Every certificate the system has issued, plus anything waiting for your approval before it goes out.",
  },
  {
    selector: '[data-tour="nav-brainstorm"]',
    title: "CPD Brainstorming",
    body: "Ideas for future sessions, including suggestions submitted by staff and external participants.",
  },
  {
    selector: '[data-tour="nav-reports"]',
    title: "Reports & Analytics",
    body: "Attendance trends, CPD hours by month, feedback over time — and exports to PDF or spreadsheet.",
  },
  {
    selector: '[data-tour="nav-help"]',
    title: "Help Centre",
    body: "Step-by-step guides for everything here, and the Education Team's contact address if you get stuck.",
  },
  {
    selector: '[data-tour="nav-settings"]',
    title: "Settings",
    body: "Your name, profile picture and colour theme — plus, for admins, email templates, CPD types and team access.",
  },

  // --- the rest of the interface ---
  {
    selector: '[data-tour="header-search"]',
    title: "Search everything",
    body: "Find events, staff, certificates, reflections, files, and help articles in one place.",
  },
  {
    selector: '[data-tour="header-notifications"]',
    title: "Stay on top of things",
    body: "The bell flags events and certificates that need your attention.",
  },
  {
    selector: '[data-tour="header-profile"]',
    title: "Your profile",
    body: "Update your name, picture, and log out from here.",
  },
  {
    selector: '[data-tour="main-content"]',
    title: "This is home base",
    body: "Everything for the page you're on, events, CPD records, and more, shows up here.",
  },
];
