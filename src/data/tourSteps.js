// Lightweight spotlight tour steps; selectors match `data-tour` attributes added to
// Sidebar/HeaderBar/App. Steps whose target isn't in the DOM (e.g. the notification bell,
// which only renders for admin/owner) are skipped automatically by OnboardingTour.
export const TOUR_STEPS = [
  {
    selector: '[data-tour="sidebar-nav"]',
    title: "Your navigation",
    body: "Jump between your dashboard, events, certificates, staff, and reports from here.",
  },
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
