// Centralized server-side data fetchers. Every function falls back to
// static demo data if Supabase env vars aren't configured yet, so the
// app is fully browsable before you run supabase/seed.sql.
import { supabaseServer } from "./supabaseServer";
import { computeAccountabilityScore, withLatestVerdict } from "./evidence";
import {
  fallbackParties, fallbackPartiesElectionMeta, fallbackPredictors,
  fallbackPoliticiansWithScores, fallbackPoliticianWithLedger,
  fallbackConstituencies, fallbackStocks, fallbackRisk,
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
    const { data } = await sb.from("politicians")
      .select(`slug,name,role,bio,party:parties(abbreviation,color),
        timeline_events(event_date,title,category,description),
        claims(id,claim_type,text,claimant,claim_date,source_url,
          evidence(id,description,source_name,source_url,source_type,stance),
          verdicts(id,status,confidence,reasoning,methodology,verdict_source,created_at))`)
      .eq("slug", slug).single();
    if (!data) return fallbackPoliticianWithLedger(slug);
    const claims = (data.claims || []).map(withLatestVerdict);
    return { ...data, claims, accountability: computeAccountabilityScore(claims) };
  } catch { return fallbackPoliticianWithLedger(slug); }
}

// Pulls each constituency's LATEST result from constituency_election_results
// — explicitly election-linked, not a bare current-looking number on the
// constituency itself. Every result carries which election/year it's from,
// so the UI can never silently present a 2020 result as current.
export async function getConstituencies() {
  const sb = supabaseServer();
  if (!sb) return fallbackConstituencies;
  try {
    const { data: constituencies } = await sb.from("constituencies").select("id,name,state").order("name");
    if (!constituencies?.length) return fallbackConstituencies;

    const { data: results } = await sb
      .from("constituency_election_results")
      .select("constituency_id,candidate_name,vote_share,margin,turnout,recorded_at,election:elections(name,election_date,data_status,is_archived)")
      .order("recorded_at", { ascending: false });

    return constituencies.map((c) => {
      const latest = (results || []).find((r) => r.constituency_id === c.id);
      return {
        name: c.name, state: c.state,
        current_rep: latest?.candidate_name || null,
        vote_share: latest?.vote_share ?? null,
        margin: latest?.margin ?? null,
        turnout: latest?.turnout ?? null,
        election_name: latest?.election?.name || null,
        election_date: latest?.election?.election_date || null,
        is_archived: latest?.election?.is_archived ?? true,
      };
    });
  } catch { return fallbackConstituencies; }
}

export async function getStocks() {
  const sb = supabaseServer();
  if (!sb) return fallbackStocks;
  try {
    const { data } = await sb.from("stock_prices")
      .select("price,change_pct,reason,politician:politicians(name)")
      .order("recorded_at", { ascending: false }).limit(20);
    if (!data?.length) return fallbackStocks;
    const seen = new Set();
    const rows = [];
    for (const row of data) {
      const name = row.politician?.name;
      if (name && !seen.has(name)) { seen.add(name); rows.push({ name, price: row.price, change_pct: row.change_pct, reason: row.reason }); }
    }
    return rows;
  } catch { return fallbackStocks; }
}

export async function getRisk() {
  const sb = supabaseServer();
  if (!sb) return fallbackRisk;
  try {
    const { data } = await sb.from("geopolitical_risk").select("*");
    return data?.length ? data : fallbackRisk;
  } catch { return fallbackRisk; }
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
