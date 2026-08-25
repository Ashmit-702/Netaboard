// Centralized server-side data fetchers. Every function falls back to
// static demo data if Supabase env vars aren't configured yet, so the
// app is fully browsable before you run supabase/seed.sql.
import { supabaseServer } from "./supabaseServer";
import { computeAccountabilityScore, withLatestVerdict } from "./evidence";
import {
  fallbackElection, fallbackParties, fallbackPredictors,
  fallbackPoliticiansWithScores, fallbackPoliticianWithLedger,
  fallbackConstituencies, fallbackStocks, fallbackRisk,
} from "./fallback";

export async function getElection() {
  const sb = supabaseServer();
  if (!sb) return fallbackElection;
  try {
    const { data: election } = await sb.from("elections").select("id,name")
      .order("created_at", { ascending: false }).limit(1).single();
    if (!election) return fallbackElection;
    const { data: preds } = await sb.from("predictions")
      .select("option_label,probability,recorded_at")
      .eq("election_id", election.id).order("recorded_at", { ascending: true });
    if (!preds?.length) return fallbackElection;
    const labels = [...new Set(preds.map((p) => p.option_label))];
    const latestA = [...preds].reverse().find((p) => p.option_label === labels[0]);
    const latestB = [...preds].reverse().find((p) => p.option_label === labels[1]);
    const history = preds.filter((p) => p.option_label === labels[0]).slice(-3).map((p) => ({
      d: new Date(p.recorded_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      v: Math.round(p.probability),
    }));
    return {
      id: election.id, name: election.name,
      optionA: { label: labels[0], probability: Math.round(latestA?.probability ?? 0) },
      optionB: { label: labels[1] || "Others", probability: Math.round(latestB?.probability ?? 0) },
      history,
    };
  } catch { return fallbackElection; }
}

export async function getParties() {
  const sb = supabaseServer();
  if (!sb) return fallbackParties;
  try {
    const { data } = await sb.from("parties").select("*").order("seats_current", { ascending: false });
    return data?.length ? data : fallbackParties;
  } catch { return fallbackParties; }
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

export async function getConstituencies() {
  const sb = supabaseServer();
  if (!sb) return fallbackConstituencies;
  try {
    const { data } = await sb.from("constituencies").select("*").order("name");
    return data?.length ? data : fallbackConstituencies;
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
