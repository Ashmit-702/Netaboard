// Shared "how stale is this" helper. Nothing on the homepage should ever
// imply freshness just because the page loaded today — every time-sensitive
// number gets a real label computed from its actual timestamp.
const STALE_DAYS = 7;

export function freshnessLabel(timestamp) {
  if (!timestamp) return { label: "No date recorded", stale: true, days: null };
  const days = Math.floor((Date.now() - new Date(timestamp).getTime()) / 86400000);
  if (days <= 0) return { label: "Updated today", stale: false, days: 0 };
  if (days === 1) return { label: "Updated yesterday", stale: false, days: 1 };
  if (days <= STALE_DAYS) return { label: `Updated ${days} days ago`, stale: false, days };
  return { label: `ARCHIVE — last updated ${days} days ago`, stale: true, days };
}
