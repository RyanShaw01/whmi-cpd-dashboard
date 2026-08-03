/*
 * Lightweight duplicate detection for registrations/reflections: flags pairs
 * with an exact email match or a very similar name (typos, missing middle
 * name, etc). No external dependencies; a small normalized Levenshtein
 * distance is plenty for "did someone submit twice" at this scale.
 */
function normalize(s) {
  return (s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

function namesAreSimilar(a, b) {
  const na = normalize(a), nb = normalize(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const dist = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  return dist <= Math.max(1, Math.floor(maxLen * 0.15));
}

// Returns pairs [{a, b, reason}] for items whose email matches exactly or
// whose name is a near-match, excluding pairs already dismissed.
export function findDuplicates(items, dismissedKeys) {
  const pairs = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i], b = items[j];
      const key = pairKey(a.id, b.id);
      if (dismissedKeys.has(key)) continue;
      const sameEmail = a.email && b.email && normalize(a.email) === normalize(b.email);
      const similarName = namesAreSimilar(a.name, b.name);
      if (sameEmail || similarName) {
        pairs.push({ a, b, reason: sameEmail ? "Same email address" : "Very similar name" });
      }
    }
  }
  return pairs;
}

export function pairKey(idA, idB) {
  return [idA, idB].sort().join("::");
}
