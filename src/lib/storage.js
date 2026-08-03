/*
 * Personal, browser-local preferences (session pointer, theme/colour prefs,
 * dashboard layout). These aren't shared between users, so, until Phase 2
 * (real auth) gives each user a server-side profile, plain localStorage is
 * the right store: it actually persists across reloads, unlike the fake
 * window.storage API the original Claude-artifact prototype relied on.
 */
const PREFIX = "whmi-cpd:";

export async function loadPersonal(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
}

export async function savePersonal(key, value) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (e) {}
}
