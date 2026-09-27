// The "What Changed" data layer. Returns normalized Change objects:
//
//   { type, entity, title, previousValue, newValue, delta, reason,
//     timestamp, confidence, href }
//
// Rules: (1) nothing is invented — no history means no change; (2) every
// change must fall inside a recency window or it is not a "recent change";
// (3) demo and archived elections never produce election movement;
// (4) with no database, there are no changes (never sample data).
import { supabaseServer } from "./supabaseServer";
import { getAttention } from "./data";
import { trendingNetas } from "./attention";

const DAY = 86400000;
const WINDOW_DAYS = 14;

function within(ts, days, now) {
  const t = new Date(ts).getTime();
  return !Number.isNaN(t) && now - t <= days * DAY && t <= now + 60000;
}

async function getElectionChanges(sb, now) {
  const { data: elections } = await sb.from("elections").select("id,name,is_demo,is_archived,data_status").eq("is_demo", false).eq("is_archived", false);
  const out = [];
  for (const el of elections || []) {
    if (el.data_status === "archive") continue;
    const { data: preds } = await sb.from("predictions").select("option_label,probability,recorded_at").eq("election_id", el.id).order("recorded_at", { ascending: true });
    const labels = [...new Set((preds || []).map((p) => p.option_label))];
    for (const label of labels) {
      const series = preds.filter((p) => p.option_label === label);
      if (series.length < 2) continue;
      const prev = series[series.length - 2];
      const latest = series[series.length - 1];
      const delta = Math.round((latest.probability - prev.probability) * 10) / 10;
      if (delta === 0 || !within(latest.recorded_at, WINDOW_DAYS, now)) continue;
      out.push({
        type: "election_prediction", entity: `${el.name} — ${label}`, title: `${label} win probability`,
        previousValue: Math.round(prev.probability), newValue: Math.round(latest.probability), delta,
        reason: "Updated estimate — see the election page for methodology.", timestamp: latest.recorded_at,
        confidence: null, href: `/elections/${el.id}`,
      });
    }
  }
  return out;
}

async function getAccountabilityChanges(sb, now) {
  const out = [];
  const { data: claims } = await sb.from("claims")
    .select("id,text,claim_type,politician:politicians(name,slug),verdicts(status,confidence,reasoning,created_at)")
    .eq("claim_type", "promise");
  for (const c of claims || []) {
    const sorted = [...(c.verdicts || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (sorted.length < 2) continue;
    const [latest, prev] = sorted;
    if (latest.status === prev.status || !within(latest.created_at, WINDOW_DAYS, now)) continue;
    out.push({
      type: "promise_status", entity: c.politician?.name || "Unknown", title: c.text,
      previousValue: prev.status, newValue: latest.status, delta: null, reason: latest.reasoning || null,
      timestamp: latest.created_at, confidence: latest.confidence,
      href: c.politician?.slug ? `/politicians/${c.politician.slug}` : "/politicians",
    });
  }
  const { data: recentEvidence } = await sb.from("evidence")
    .select("id,description,source_name,added_at,claim:claims(text,claim_type,politician:politicians(name,slug))")
    .gte("added_at", new Date(now - WINDOW_DAYS * DAY).toISOString());
  for (const e of recentEvidence || []) {
    if (!e.claim || e.claim.claim_type !== "promise") continue;
    out.push({
      type: "new_evidence", entity: e.claim.politician?.name || "Unknown", title: e.claim.text,
      previousValue: null, newValue: null, delta: null, reason: e.description, timestamp: e.added_at, confidence: null,
      href: e.claim.politician?.slug ? `/politicians/${e.claim.politician.slug}` : "/politicians",
    });
  }
  return out;
}

// New verdicts, but only ones with real backing — an evidence-free AI-only
// fact-check submitted by an anonymous visitor is not a "change" worth a
// front-page slot.
async function getVerdictChanges(sb, now) {
  const { data: claims } = await sb.from("claims")
    .select("id,text,claim_type,verdicts(status,confidence,reasoning,verdict_source,created_at),evidence(id)")
    .in("claim_type", ["fact_check", "statement"])
    .order("created_at", { ascending: false }).limit(25);
  return (claims || []).map((c) => {
    const latest = [...(c.verdicts || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    if (!latest || !within(latest.created_at, WINDOW_DAYS, now)) return null;
    if (latest.verdict_source !== "published_source" && !(c.evidence || []).length) return null;
    return {
      type: "fact_check", entity: "Evidence", title: c.text, previousValue: null, newValue: latest.status, delta: null,
      reason: latest.reasoning, timestamp: latest.created_at, confidence: latest.confidence, href: "/evidence",
      sourceCount: c.evidence?.length || 0,
    };
  }).filter(Boolean);
}

async function getAttentionChanges(now) {
  const rows = trendingNetas(await getAttention(), { now, max: 5 });
  return rows.map((r) => ({
    type: "attention", entity: r.name, title: `${r.name} — attention ${r.change_pct > 0 ? "rising" : "falling"}`,
    previousValue: null, newValue: Math.round(r.score * 10) / 10, delta: r.change_pct, reason: null,
    timestamp: r.recorded_at, confidence: null, href: `/politicians/${r.slug}`,
  }));
}

export async function getAllChanges() {
  const empty = { changes: [], byType: {} };
  const sb = supabaseServer();
  if (!sb) return empty;
  try {
    const now = Date.now();
    const results = await Promise.allSettled([getElectionChanges(sb, now), getAccountabilityChanges(sb, now), getVerdictChanges(sb, now), getAttentionChanges(now)]);
    const changes = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const byType = {};
    for (const c of changes) (byType[c.type] ||= []).push(c);
    return { changes, byType };
  } catch { return empty; }
}
