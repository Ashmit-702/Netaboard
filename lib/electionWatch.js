// Event-aware Election Watch — reads every row in `elections`, ranks by
// real status/data via the shared algorithm in lib/electionSelector.js, and
// never hardcodes a state. If nothing qualifies, returns { election: null }
// — the UI shows an honest empty state rather than fabricating a story.
import { supabaseServer } from "./supabaseServer";
import { fallbackElectionWatch } from "./fallback";
import { selectElection } from "./electionSelector";

export async function getElectionWatch() {
  const sb = supabaseServer();
  if (!sb) return fallbackElectionWatch();

  try {
    const { data: elections } = await sb
      .from("elections")
      .select("id,name,region,election_date,status,description")
      .order("election_date", { ascending: false });
    if (!elections?.length) return { election: null };

    const { data: allPreds } = await sb
      .from("predictions")
      .select("election_id,option_label,probability,recorded_at")
      .order("recorded_at", { ascending: true });
    const predsByElection = {};
    for (const p of allPreds || []) (predsByElection[p.election_id] ||= []).push(p);

    return { election: selectElection(elections, predsByElection) };
  } catch {
    return fallbackElectionWatch();
  }
}
