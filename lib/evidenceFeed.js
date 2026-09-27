// Evidence hub + homepage "The Evidence" data. Reads the existing
// claims -> evidence -> verdicts ledger. No AI, no invention: a claim only
// appears here with the verdict/evidence that exist in the database.
import { supabaseServer } from "./supabaseServer";
import { withLatestVerdict } from "./evidence";

const CLAIM_SELECT = `id,claim_type,text,claimant,claim_date,source_url,created_at,
  politician:politicians(name,slug),
  evidence(id,description,source_name,source_url,source_type,stance,added_at),
  verdicts(id,status,confidence,reasoning,methodology,verdict_source,created_at)`;

export async function getRecentClaims({ limit = 40 } = {}) {
  const sb = supabaseServer();
  if (!sb) return { ok: false, claims: [] };
  try {
    const { data, error } = await sb.from("claims").select(CLAIM_SELECT).order("created_at", { ascending: false }).limit(200);
    if (error) return { ok: false, claims: [] };
    const claims = (data || [])
      .map(withLatestVerdict)
      .filter((c) => c.latestVerdict)
      .sort((a, b) => new Date(b.latestVerdict.created_at) - new Date(a.latestVerdict.created_at))
      .slice(0, limit);
    return { ok: true, claims };
  } catch { return { ok: false, claims: [] }; }
}

const FEATURE_WINDOW_DAYS = 30;

/**
 * One important CURRENT claim for the homepage. Eligible only if it has a
 * verdict AND real backing (a published-source verdict, or at least one
 * evidence row) AND was issued recently. An anonymous, AI-only,
 * evidence-free fact-check is never promoted to the front page.
 */
export function pickFeaturedClaim(claims, now = Date.now()) {
  const cutoff = now - FEATURE_WINDOW_DAYS * 86400000;
  return claims
    .filter((c) => c.latestVerdict && new Date(c.latestVerdict.created_at).getTime() >= cutoff)
    .filter((c) => c.latestVerdict.verdict_source === "published_source" || (c.evidence || []).length >= 1)
    .filter((c) => c.latestVerdict.status !== "unverified")
    .sort((a, b) => (b.evidence?.length || 0) - (a.evidence?.length || 0) || new Date(b.latestVerdict.created_at) - new Date(a.latestVerdict.created_at))[0] || null;
}
