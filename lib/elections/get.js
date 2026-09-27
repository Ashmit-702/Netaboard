// Supabase access for elections. Reads only; no fallback data of any kind —
// if the database is unavailable or empty the callers render an honest state.
import { supabaseServer } from "../supabaseServer.js";
import { classifyElection, buildSummary } from "./classify.js";

const COLS = "id,name,region,election_date,status,data_status,is_archived,is_demo,result_declared_at,last_updated_at,description,source_url";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** @returns {{ ok: boolean, elections: Array }} ok=false means the database could not be read (distinct from "no elections"). */
export async function getElections() {
  const sb = supabaseServer();
  if (!sb) return { ok: false, elections: [] };
  try {
    const { data: elections, error } = await sb.from("elections").select(COLS).eq("is_demo", false).order("election_date", { ascending: false });
    if (error) return { ok: false, elections: [] };
    const [{ data: preds }, { data: results }] = await Promise.all([
      sb.from("predictions").select("election_id,option_label,probability,recorded_at,model_name,confidence,methodology,source_snapshot_at").order("recorded_at", { ascending: true }),
      sb.from("party_election_results").select("election_id"),
    ]);
    const predsBy = {};
    for (const p of preds || []) (predsBy[p.election_id] ||= []).push(p);
    const resultIds = new Set((results || []).map((r) => r.election_id));
    const now = Date.now();
    const classified = (elections || []).map((e) => {
      const c = classifyElection(e, { now, hasPredictions: (predsBy[e.id] || []).length > 0, hasResults: resultIds.has(e.id) });
      return c ? { ...c, summary: buildSummary(predsBy[e.id]) } : null;
    }).filter(Boolean);
    return { ok: true, elections: classified };
  } catch { return { ok: false, elections: [] }; }
}

export async function getElection(id) {
  if (!UUID.test(id || "")) return { found: false, ok: true };
  const sb = supabaseServer();
  if (!sb) return { found: false, ok: false };
  try {
    const { data: e, error } = await sb.from("elections").select(COLS).eq("id", id).maybeSingle();
    if (error) return { found: false, ok: false };
    if (!e || e.is_demo) return { found: false, ok: true };
    const [{ data: preds }, { data: results }] = await Promise.all([
      sb.from("predictions").select("option_label,probability,recorded_at,model_name,confidence,methodology,source_snapshot_at").eq("election_id", id).order("recorded_at", { ascending: true }),
      sb.from("party_election_results").select("seats_won,vote_share,source_url,party:parties(name,abbreviation)").eq("election_id", id).order("seats_won", { ascending: false }),
    ]);
    const c = classifyElection(e, { hasPredictions: (preds || []).length > 0, hasResults: (results || []).length > 0 });
    return { found: true, ok: true, election: { ...c, summary: buildSummary(preds), results: results || [] } };
  } catch { return { found: false, ok: false }; }
}
