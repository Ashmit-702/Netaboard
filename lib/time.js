// One timezone for the whole product. Timestamps are kept as ISO/UTC
// internally; this file is the only place they are turned into text, so the
// site never mixes server-local and viewer-local times.
export const SITE_TZ = "Asia/Kolkata";
export const SITE_TZ_LABEL = "IST";

const HOUR = 3600000;

export function hoursSince(iso, now = Date.now()) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return (now - t) / HOUR;
}

export function istDateKey(ms = Date.now()) {
  return istDayKey(ms);
}

function istDayKey(ms) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: SITE_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ms));
}

/**
 * "Just now" / "8 min ago" / "2 hours ago" / "Yesterday" / "3 days ago".
 * "Yesterday" is a calendar notion in the site timezone, not "24h ago".
 */
export function relativeLabel(iso, now = Date.now()) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const mins = Math.floor((now - t) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs === 1 ? "1 hour ago" : `${hrs} hours ago`;
  const dayDiff = Math.round((Date.parse(istDayKey(now)) - Date.parse(istDayKey(t))) / 86400000);
  if (dayDiff <= 1) return "Yesterday";
  return `${dayDiff} days ago`;
}

export function formatISTDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const s = new Intl.DateTimeFormat("en-IN", {
    timeZone: SITE_TZ, day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true,
  }).format(d);
  return `${s} ${SITE_TZ_LABEL}`;
}

export function formatISTDate(iso, opts = { day: "numeric", month: "long", year: "numeric" }) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", { timeZone: SITE_TZ, ...opts }).format(d);
}

export function formatISTClock(iso) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-IN", { timeZone: SITE_TZ, hour: "numeric", minute: "2-digit", hour12: true }).format(d) + ` ${SITE_TZ_LABEL}`;
}
