// Centralized server-side data fetchers. Every function falls back to
// static demo data if Supabase env vars aren't configured yet, so the
// app is fully browsable before you run supabase/seed.sql.
import { supabaseServer } from "./supabaseServer";
import { computeAccountabilityScore, withLatestVerdict } from "./evidence";
import {
  fallbackParties, fallbackPartiesElectionMeta, fallbackPredictors,
  fallbackPoliticiansWithScores, fallbackPoliticianWithLedger,
  fallbackAttention,
} from "./fallback";

// getElection() (the old unfiltered "grab the latest election row" query)
// has been retired — it was the actual reason a fabricated demo election
// could surface on /predictions and /market even after the homepage
// selector became honest. adaptElectionForGauge() below converts
// getElectionWatch()'s result (the single source of truth for "which
// election is current") into the shape Gauge/vote-widget components need.
// Returns null when there's genuinely no current election — callers must
// render an honest empty state, not assume a shape exists.
export function adaptElectionForGauge(watchResult) {
  const e = watchResult?.election;
  if (!e || !e.summary) return null;
  return {
    id: e.id, name: e.name,
    optionA: { label: e.summary.label, probability: e.summary.value },
    optionB: e.summary.optionB
      ? { label: e.summary.optionB.label, probability: e.summary.optionB.value }
      : { label: "Others", probability: Math.max(0, 100 - e.summary.value) },
    history: e.summary.history || [],
    tier: e.tier,
    modelName: e.summary.modelName,
    confidence: e.summary.confidence,
    methodology: e.summary.methodology,
    sourceSnapshotAt: e.summary.sourceSnapshotAt,
    lastUpdated: e.summary.timestamp,
  };
}

// Pulls each party's seats from party_election_results — election-linked,
// not the bare parties.seats_current field, which has no year attached.
// Returns { parties, electionMeta } so the UI can label the seat count with
// which election/year it's actually from, instead of presenting it as a
// current tally.
export async function getParties() {
  const sb = supabaseServer();
  if (!sb) return { parties: fallbackParties, electionMeta: fallbackPartiesElectionMeta };
  try {
    const { data: results } = await sb
      .from("party_election_results")
      .select("seats_won,party:parties(id,name,abbreviation),election:elections(name,election_date,is_archived)")
      .order("recorded_at", { ascending: false });
    if (!results?.length) return { parties: fallbackParties, electionMeta: fallbackPartiesElectionMeta };

    const seen = new Set();
    const parties = [];
    let electionMeta = null;
    for (const r of results) {
      const name = r.party?.name;
      if (!name || seen.has(name)) continue;
      seen.add(name);
      parties.push({ name, abbreviation: r.party?.abbreviation, seats_current: r.seats_won });
      if (!electionMeta) electionMeta = r.election;
    }
    return { parties, electionMeta };
  } catch { return { parties: fallbackParties, electionMeta: fallbackPartiesElectionMeta }; }
}

export async function getPredictors() {
  const sb = supabaseServer();
  if (!sb) return fallbackPredictors;
  try {
    const { data } = await sb.from("predictors").select("*").order("accuracy_pct", { ascending: false }).limit(5);
    return data?.length ? data : fallbackPredictors;
  } catch { return fallbackPredictors; }
}

export async function getPoliticians() {
  const sb = supabaseServer();
  if (!sb) return fallbackPoliticiansWithScores();
  try {
    const { data } = await sb.from("politicians")
      .select("slug,name,role,party:parties(abbreviation),claims(claim_type,verdicts(status,confidence,created_at))");
    if (!data?.length) return fallbackPoliticiansWithScores();
    return data.map((p) => {
      const claims = (p.claims || []).map(withLatestVerdict);
      return { ...p, accountability: computeAccountabilityScore(claims) };
    });
  } catch { return fallbackPoliticiansWithScores(); }
}

export async function getPolitician(slug) {
  const sb = supabaseServer();
  if (!sb) return fallbackPoliticianWithLedger(slug);
  try {
    const { data, error } = await sb.from("politicians")
      .select(`slug,name,role,bio,party:parties(abbreviation,color),
        timeline_events(event_date,title,category,description),
        claims(id,claim_type,text,claimant,claim_date,source_url,
          evidence(id,description,source_name,source_url,source_type,stance),
          verdicts(id,status,confidence,reasoning,methodology,verdict_source,created_at))`)
      .eq("slug", slug).maybeSingle();

    // A genuine "no such politician" (no error, no row) must 404 — not
    // silently fall through to demo data for a different person. Only a
    // real query failure falls back.
    if (error) return fallbackPoliticianWithLedger(slug);
    if (!data) return null;

    const claims = (data.claims || []).map(withLatestVerdict);
    return { ...data, claims, accountability: computeAccountabilityScore(claims) };
  } catch { return fallbackPoliticianWithLedger(slug); }
}

// Political Attention — not a stock market. The `stock_prices` table name
// is unchanged (a rename migration would add risk for no functional gain,
// and the schema already has exactly the shape an attention-snapshot model
// needs). Only the application layer's language changed.
export async function getAttention() {
  const sb = supabaseServer();
  if (!sb) return fallbackAttention;
  try {
    const { data } = await sb.from("stock_prices")
      .select("price,change_pct,reason,politician:politicians(name,slug,role)")
      .order("recorded_at", { ascending: false }).limit(20);
    if (!data?.length) return fallbackAttention;
    const seen = new Set();
    const rows = [];
    for (const row of data) {
      const name = row.politician?.name;
      if (name && !seen.has(name)) {
        seen.add(name);
        rows.push({ name, slug: row.politician?.slug, role: row.politician?.role, score: row.price, change_pct: row.change_pct, reason: row.reason });
      }
    }
    return rows;
  } catch { return fallbackAttention; }
}

export async function getDailyBrief() {
  const sb = supabaseServer();
  if (!sb) return null;
  try {
    const { data } = await sb.from("daily_briefs").select("*").order("brief_date", { ascending: false }).limit(1).single();
    return data || null;
  } catch { return null; }
}

export async function getDebate() {
  const sb = supabaseServer();
  if (!sb) return null;
  try {
    const { data: debate } = await sb.from("debates").select("id,topic").order("created_at", { ascending: false }).limit(1).single();
    if (!debate) return null;
    const { data: args } = await sb.from("debate_arguments").select("*").eq("debate_id", debate.id).order("votes", { ascending: false });
    return { ...debate, args: args || [] };
  } catch { return null; }
}

export async function getQuiz() {
  const sb = supabaseServer();
  if (!sb) return [];
  try {
    const { data } = await sb.from("quiz_questions").select("*").limit(10);
    return data || [];
  } catch { return []; }
}
