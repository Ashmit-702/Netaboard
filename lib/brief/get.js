// Daily Brief for display. Deterministic brief from the live Current
// Affairs items; optional AI summaries from today's stored brief are applied
// only where they match a live story id AND were generated today (IST).
import { supabaseServer } from "../supabaseServer.js";
import { generateBrief } from "./generate.js";
import { istDateKey } from "../time.js";

export async function getStoredBrief() {
  const sb = supabaseServer();
  if (!sb) return null;
  try {
    const { data } = await sb.from("daily_briefs").select("brief_date,content").order("brief_date", { ascending: false }).limit(1).maybeSingle();
    if (!data?.content || data.content.version !== 2) return null;   // v1 rows came from the old, separate pipeline
    if (data.brief_date !== istDateKey()) return null;                      // stale summaries are never shown
    return data.content;
  } catch { return null; }
}

export async function getBrief(items) {
  const stored = await getStoredBrief();
  return generateBrief(items, { aiSummaries: stored?.summaries || null, aiWatch: stored?.watch_today || null });
}
