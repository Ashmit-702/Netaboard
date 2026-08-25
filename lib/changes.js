// The "What Changed" data layer. Every function here returns an array of
// normalized Change objects — the homepage (and any future page) consumes
// this shape and does zero calculation of its own:
//
//   { type, entity, title, previousValue, newValue, delta, reason,
//     sources: [{name, url}], timestamp, confidence, href }
//
// Nothing here invents a reason or a number. If there isn't enough history
// to compute a real delta (fewer than 2 data points), the function returns
// nothing for that item rather than fabricating movement — that's the same
// rule the Evidence Ledger follows, applied to time-series data instead of
// claim verdicts.
import { supabaseServer } from "./supabaseServer";
import { fallbackChanges } from "./fallback";

const WINDOW_DAYS = 14; // "recent" window for evidence/verdict-based changes

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

// ---------- Election Pulse: prediction probability movement ----------
async function getElectionChanges(sb) {
  const { data: elections } = await sb.from("elections").select("id,name");
  const out = [];
  for (const el of elections || []) {
    const { data: preds } = await sb
      .from("predictions")
      .select("option_label,probability,recorded_at")
      .eq("election_id", el.id)
      .order("recorded_at", { ascending: true });
    if (!preds?.length) continue;
    const labels = [...new Set(preds.map((p) => p.option_label))];
    for (const label of labels) {
      const series = preds.filter((p) => p.option_label === label);
      if (series.length < 2) continue; // no real movement to report
      const prev = series[series.length - 2];
      const latest = series[series.length - 1];
      const delta = Math.round((latest.probability - prev.probability) * 10) / 10;
      if (delta === 0) continue;
      out.push({
        type: "election_prediction",
        entity: `${el.name} — ${label}`,
        title: `${label} win probability`,
        previousValue: Math.round(prev.probability),
        newValue: Math.round(latest.probability),
        delta,
        reason: "Updated estimate — see /predictions for current methodology and what still needs building.",
        sources: [],
        timestamp: latest.recorded_at,
        confidence: null,
        href: "/predictions",
      });
    }
  }
  return out;
}

// ---------- Accountability Watch: promise status changes + new evidence ----------
async function getAccountabilityChanges(sb) {
  const { data: claims } = await sb
    .from("claims")
    .select("id,text,claim_type,politician:politicians(name,slug),verdicts(status,confidence,reasoning,created_at)")
    .eq("claim_type", "promise");

  const out = [];
  for (const c of claims || []) {
    const sorted = [...(c.verdicts || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (sorted.length >= 2) {
      const [latest, prev] = sorted;
      if (latest.status !== prev.status) {
        out.push({
          type: "promise_status",
          entity: c.politician?.name || "Unknown",
          title: c.text,
          previousValue: prev.status,
          newValue: latest.status,
          delta: null,
          reason: latest.reasoning || null,
          sources: [],
          timestamp: latest.created_at,
          confidence: latest.confidence,
          href: c.politician?.slug ? `/politicians/${c.politician.slug}` : "/politicians",
        });
      }
    }
  }

  // New evidence attached recently — a change even without a status flip yet.
  const { data: recentEvidence } = await sb
    .from("evidence")
    .select("id,description,source_name,source_url,added_at,claim:claims(text,claim_type,politician:politicians(name,slug))")
    .gte("added_at", daysAgo(WINDOW_DAYS));

  for (const e of recentEvidence || []) {
    if (!e.claim || e.claim.claim_type !== "promise") continue; // filtered in JS — PostgREST embedded-filter syntax is fragile without an inner-join hint
    out.push({
      type: "new_evidence",
      entity: e.claim.politician?.name || "Unknown",
      title: e.claim.text,
      previousValue: null,
      newValue: null,
      delta: null,
      reason: e.description,
      sources: e.source_url ? [{ name: e.source_name || "Source", url: e.source_url }] : [],
      timestamp: e.added_at,
      confidence: null,
      href: e.claim.politician?.slug ? `/politicians/${e.claim.politician.slug}` : "/politicians",
    });
  }
  return out;
}

// ---------- Fact Check: recent verdicts on fact-check claims ----------
async function getFactCheckChanges(sb) {
  const { data: claims } = await sb
    .from("claims")
    .select("id,text,verdicts(status,confidence,reasoning,verdict_source,created_at),evidence(id)")
    .eq("claim_type", "fact_check")
    .order("created_at", { ascending: false })
    .limit(10);

  return (claims || []).map((c) => {
    const latest = [...(c.verdicts || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    if (!latest) return null;
    return {
      type: "fact_check",
      entity: "Fact Check",
      title: c.text,
      previousValue: null,
      newValue: latest.status,
      delta: null,
      reason: latest.reasoning,
      sources: [],
      timestamp: latest.created_at,
      confidence: latest.confidence,
      href: "/fact-check",
      sourceCount: c.evidence?.length || 0,
    };
  }).filter(Boolean);
}

// ---------- Constituency Watch: needs 2+ snapshots to report anything ----------
async function getConstituencyChanges(sb) {
  const { data: constituencies } = await sb.from("constituencies").select("id,name,state");
  const out = [];
  for (const con of constituencies || []) {
    const { data: snaps } = await sb
      .from("constituency_snapshots")
      .select("vote_share_estimate,probability_estimate,reason,recorded_at")
      .eq("constituency_id", con.id)
      .order("recorded_at", { ascending: true });
    if (!snaps || snaps.length < 2) continue; // honest: no fabricated movement from a single point
    const prev = snaps[snaps.length - 2];
    const latest = snaps[snaps.length - 1];
    const prevVal = latest.probability_estimate != null ? prev.probability_estimate : prev.vote_share_estimate;
    const newVal = latest.probability_estimate != null ? latest.probability_estimate : latest.vote_share_estimate;
    if (prevVal == null || newVal == null) continue;
    const delta = Math.round((newVal - prevVal) * 10) / 10;
    if (delta === 0) continue;
    out.push({
      type: "constituency",
      entity: `${con.name}, ${con.state}`,
      title: con.name,
      previousValue: prevVal,
      newValue: newVal,
      delta,
      reason: latest.reason || null,
      sources: [],
      timestamp: latest.recorded_at,
      confidence: null,
      href: "/constituencies",
    });
  }
  return out;
}

// ---------- Political Attention: real mention-driven movement, already computed by stock-refresh ----------
async function getAttentionChanges(sb) {
  const { data: politicians } = await sb.from("politicians").select("id,name,slug");
  const out = [];
  for (const p of politicians || []) {
    const { data: prices } = await sb
      .from("stock_prices")
      .select("price,change_pct,reason,recorded_at")
      .eq("politician_id", p.id)
      .order("recorded_at", { ascending: false })
      .limit(1);
    const latest = prices?.[0];
    if (!latest || latest.change_pct === 0) continue;
    out.push({
      type: "attention",
      entity: p.name,
      title: `${p.name} — attention volume`,
      previousValue: null,
      newValue: Math.round(latest.price * 10) / 10,
      delta: latest.change_pct,
      reason: latest.reason,
      sources: [],
      timestamp: latest.recorded_at,
      confidence: null,
      href: "/stock-market",
    });
  }
  return out;
}

/**
 * getAllChanges() — the single function the homepage calls. Returns
 * { changes, byType } where changes is everything sorted newest-first, and
 * byType groups the same objects by their `type` field for section
 * rendering. Falls back to labeled demo data if Supabase isn't configured.
 */
export async function getAllChanges() {
  const sb = supabaseServer();
  if (!sb) return fallbackChanges();

  try {
    const [election, accountability, factCheck, constituency, attention] = await Promise.all([
      getElectionChanges(sb),
      getAccountabilityChanges(sb),
      getFactCheckChanges(sb),
      getConstituencyChanges(sb),
      getAttentionChanges(sb),
    ]);
    const changes = [...election, ...accountability, ...factCheck, ...constituency, ...attention]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const byType = {};
    for (const c of changes) {
      byType[c.type] = byType[c.type] || [];
      byType[c.type].push(c);
    }
    return { changes, byType };
  } catch {
    return fallbackChanges();
  }
}

/**
 * Parses the real per-source breakdown already stored in a stock_prices
 * `reason` string (see app/api/stock-refresh/route.js) into a factor list.
 * This is the ONLY place NetaBoard shows a "why did this number move"
 * breakdown, and it only works because the underlying counts are real,
 * already-computed values — nothing here is invented. Returns [] if the
 * reason string doesn't match the expected format (e.g. demo copy).
 */
export function parseAttentionFactors(reason) {
  if (!reason) return [];
  const match = reason.match(/\(([^)]+)\)/);
  if (!match) return [];
  return match[1].split(",").map((pair) => {
    const [label, value] = pair.split(":").map((s) => s.trim());
    return { label, value: Number(value) || 0 };
  }).filter((f) => f.value > 0);
}
