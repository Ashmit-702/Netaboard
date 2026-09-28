// Centralized server-side data fetchers. There is NO fallback/demo data in
// this file (or anywhere in the app): if Supabase is unconfigured, empty, or
// failing, every function returns an empty/unavailable result and the UI
// renders an honest state. Demo data lives only in supabase/demo/.
import { supabaseServer } from "./supabaseServer";
import { computeAccountabilityScore, withLatestVerdict } from "./evidence";
import { latestPerPolitician } from "./attention";
import { buildSummary } from "./elections/classify";

// Converts a classified election (lib/elections/get.js) into the shape the
// Gauge/vote components need. Null when there is no real prediction.
export function adaptElectionForGauge(election) {
  if (!election || !election.summary) return null;
  const e = election;
  return {
    id: e.id, name: e.name, state: e.state,
    optionA: { label: e.summary.label, probability: e.summary.value },
    optionB: e.summary.optionB
      ? { label: e.summary.optionB.label, probability: e.summary.optionB.value }
      : { label: "Others", probability: Math.max(0, 100 - e.summary.value) },
    history: e.summary.history || [],
    modelName: e.summary.modelName,
    confidence: e.summary.confidence,
    methodology: e.summary.methodology,
    sourceSnapshotAt: e.summary.sourceSnapshotAt,
    lastUpdated: e.summary.timestamp,
  };
}

export { buildSummary };

// Seat counts come from party_election_results (election-linked), so the UI
// can label them with the election and year they are from.
export async function getParties() {
  const sb = supabaseServer();
  if (!sb) return { parties: [], electionMeta: null };
  try {
    const { data: results } = await sb
      .from("party_election_results")
      .select("seats_won,party:parties(id,name,abbreviation),election:elections(name,election_date,is_archived,is_demo)")
      .order("recorded_at", { ascending: false });
    const real = (results || []).filter((r) => !r.election?.is_demo);
    if (!real.length) return { parties: [], electionMeta: null };
    const first = real[0].election;
    const seen = new Set();
    const parties = [];
    for (const r of real) {
      // one election's seat table only — never mix elections
      if (r.election?.name !== first?.name) continue;
      const name = r.party?.name;
      if (!name || seen.has(name)) continue;
      seen.add(name);
      parties.push({ name, abbreviation: r.party?.abbreviation, seats_current: r.seats_won });
    }
    return { parties, electionMeta: first };
  } catch { return { parties: [], electionMeta: null }; }
}

export async function getPredictors() {
  const sb = supabaseServer();
  if (!sb) return [];
  try {
    const { data } = await sb.from("predictors").select("*").order("accuracy_pct", { ascending: false }).limit(5);
    return data || [];
  } catch { return []; }
}

/**
 * @returns {{ ok: boolean, degraded?: boolean, politicians: Array }}
 * degraded = the accountability tables (claims/evidence/verdicts) could not be
 * read, so the roster is shown WITHOUT scores — still real rows, never
 * invented. The real error is logged so it appears in the server logs.
 */
export async function getPoliticians() {
  const sb = supabaseServer();
  if (!sb) return { ok: false, politicians: [] };
  try {
    const full = await sb.from("politicians")
      .select("slug,name,role,party:parties(abbreviation),claims(claim_type,verdicts(status,confidence,created_at))")
      .order("name", { ascending: true });
    if (!full.error) {
      return {
        ok: true,
        politicians: (full.data || []).map((p) => {
          const claims = (p.claims || []).map(withLatestVerdict);
          return { ...p, accountability: computeAccountabilityScore(claims) };
        }),
      };
    }
    console.error("[getPoliticians] full query failed:", full.error.message);
    const basic = await sb.from("politicians").select("slug,name,role,party:parties(abbreviation)").order("name", { ascending: true });
    if (basic.error) { console.error("[getPoliticians] basic query failed:", basic.error.message); return { ok: false, politicians: [] }; }
    return {
      ok: true, degraded: true,
      politicians: (basic.data || []).map((p) => ({ ...p, claims: [], accountability: computeAccountabilityScore([]) })),
    };
  } catch (e) { console.error("[getPoliticians] exception:", e?.message); return { ok: false, politicians: [] }; }
}

/** @returns {{ status: "ok"|"notfound"|"unavailable", politician? }} */
export async function getPolitician(slug) {
  const sb = supabaseServer();
  if (!sb) return { status: "unavailable" };
  try {
    const full = await sb.from("politicians")
      .select(`slug,name,role,bio,party:parties(abbreviation,color),
        timeline_events(event_date,title,category,description),
        claims(id,claim_type,text,claimant,claim_date,source_url,created_at,
          evidence(id,description,source_name,source_url,source_type,stance,added_at),
          verdicts(id,status,confidence,reasoning,methodology,verdict_source,created_at))`)
      .eq("slug", slug).maybeSingle();
    if (!full.error) {
      if (!full.data) return { status: "notfound" };
      const claims = (full.data.claims || []).map(withLatestVerdict);
      return { status: "ok", politician: { ...full.data, claims, accountability: computeAccountabilityScore(claims) } };
    }
    console.error("[getPolitician] full query failed:", full.error.message);
    // Degrade to the profile alone — real row, no claims/timeline — rather than a false error page.
    const basic = await sb.from("politicians").select("slug,name,role,bio,party:parties(abbreviation,color)").eq("slug", slug).maybeSingle();
    if (basic.error) { console.error("[getPolitician] basic query failed:", basic.error.message); return { status: "unavailable" }; }
    if (!basic.data) return { status: "notfound" };
    return { status: "ok", degraded: true, politician: { ...basic.data, claims: [], timeline_events: [], accountability: computeAccountabilityScore([]) } };
  } catch (e) { console.error("[getPolitician] exception:", e?.message); return { status: "unavailable" }; }
}

// Political Attention rows (latest per politician), newest first. The table
// is `stock_prices`; only the application language changed.
export async function getAttention() {
  const sb = supabaseServer();
  if (!sb) return [];
  try {
    const { data } = await sb.from("stock_prices")
      .select("price,change_pct,reason,recorded_at,politician:politicians(name,slug,role,party:parties(abbreviation))")
      .order("recorded_at", { ascending: false }).limit(300);
    const rows = (data || [])
      .filter((r) => r.politician?.name && r.politician?.slug)
      .map((r) => ({ name: r.politician.name, slug: r.politician.slug, role: r.politician.role, party: r.politician.party?.abbreviation, score: r.price, change_pct: r.change_pct, reason: r.reason, recorded_at: r.recorded_at }));
    return latestPerPolitician(rows);
  } catch { return []; }
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
