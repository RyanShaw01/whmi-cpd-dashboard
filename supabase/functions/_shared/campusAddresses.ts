// Street addresses for Western Health campuses, shown in emails for in-person/hybrid events so
// recipients can find the venue without looking it up themselves. Keyed by the exact campus
// name used in CAMPUS_OPTIONS (src/data/mockData.js) - keep these two lists in sync.
// NOTE: best-effort public addresses - worth double-checking against the current official
// Western Health site before relying on these for wayfinding.
export const CAMPUS_ADDRESSES: Record<string, string> = {
  "Footscray Hospital": "160 Gordon Street, Footscray VIC 3011",
  "Sunshine Hospital": "176 Furlong Road, St Albans VIC 3021",
  "Williamstown Hospital": "Railway Crescent, Williamstown VIC 3016",
  "Sunbury Day Hospital": "7 Macedon Street, Sunbury VIC 3429",
};

export function campusAddress(campus: string | null | undefined): string | null {
  if (!campus) return null;
  return CAMPUS_ADDRESSES[campus] || null;
}
