import { computeAccountabilityScore } from "./evidence";
import { selectElection } from "./electionSelector";
// Static fallback data — used whenever Supabase env vars aren't set yet,
// so the app looks and works correctly before you've run the seed script.
export const fallbackElection = {
  name: "Bihar Assembly Election 2026",
  optionA: { label: "NDA", probability: 72 },
  optionB: { label: "Mahagathbandhan", probability: 28 },
  history: [
    { d: "Jul 10", v: 60 },
    { d: "Jul 25", v: 67 },
    { d: "Aug 4", v: 72 },
  ],
};

export const fallbackParties = [
  { name: "BJP", abbreviation: "BJP", seats_current: 74 },
  { name: "RJD", abbreviation: "RJD", seats_current: 79 },
  { name: "JD(U)", abbreviation: "JD(U)", seats_current: 43 },
  { name: "Congress", abbreviation: "Congress", seats_current: 19 },
  { name: "LJP(RV)", abbreviation: "LJP(RV)", seats_current: 5 },
  { name: "HAM", abbreviation: "HAM", seats_current: 4 },
  { name: "VIP", abbreviation: "VIP", seats_current: 4 },
  { name: "Independents", abbreviation: "IND", seats_current: 15 },
];

export const fallbackPredictors = [
  { display_name: "Ashmit R.", accuracy_pct: 92 },
  { display_name: "Rahul K.", accuracy_pct: 90 },
  { display_name: "Ananya S.", accuracy_pct: 88 },
  { display_name: "Devansh P.", accuracy_pct: 85 },
  { display_name: "Meher I.", accuracy_pct: 83 },
];

// Full Evidence Ledger shape (claims -> evidence -> verdicts), matching
// exactly what a real Supabase-backed politician would return, so demo mode
// exercises the real model instead of a simplified stand-in for it.
const rawFallbackClaims = {
  "narendra-modi": [
    {
      id: "m1", claim_type: "promise", text: "Ram Mandir construction in Ayodhya", claimant: "Narendra Modi",
      evidence: [
        { id: "e1", description: "Ram Mandir consecration ceremony held in Ayodhya, widely covered as completed.", source_name: "Wikipedia", source_url: "https://en.wikipedia.org/wiki/Ram_Mandir", source_type: "official", stance: "supports" },
        { id: "e2", description: "Temple construction confirmed complete and open to the public by government and press coverage.", source_name: "Press coverage (general)", source_type: "news", stance: "supports" },
      ],
      verdicts: [{ id: "v1", status: "fulfilled", confidence: 78, reasoning: "Two independent sources confirm the temple was constructed and formally opened — the core commitment was delivered.", methodology: "Derived from 2 evidence item(s): 2 supporting, 0 contradicting. Formula: 40 base + 8×evidence count + 25×agreement ratio, clamped 15-95.", verdict_source: "ai", created_at: "2026-08-01" }],
    },
    {
      id: "m2", claim_type: "promise", text: "Revocation of Article 370 in J&K", claimant: "Narendra Modi",
      evidence: [{ id: "e3", description: "Article 370 formally revoked in August 2019, confirmed by official record.", source_name: "Wikipedia", source_url: "https://en.wikipedia.org/wiki/Article_370", source_type: "official", stance: "supports" }],
      verdicts: [{ id: "v2", status: "fulfilled", confidence: 68, reasoning: "One clear official-record source confirms revocation took effect as stated.", methodology: "Derived from 1 evidence item(s): 1 supporting, 0 contradicting. Formula: 40 base + 8×evidence count + 25×agreement ratio, clamped 15-95.", verdict_source: "ai", created_at: "2026-08-01" }],
    },
    {
      id: "m3", claim_type: "promise", text: "Uniform Civil Code nationwide", claimant: "Narendra Modi",
      evidence: [],
      verdicts: [{ id: "v3", status: "unverified", confidence: 20, reasoning: "Tracked but no structured evidence has been attached yet.", methodology: "No evidence attached yet. Formula: base confidence 20 when evidence count = 0.", verdict_source: "manual", created_at: "2026-08-01" }],
    },
    {
      id: "m4", claim_type: "promise", text: "Two crore jobs a year", claimant: "Narendra Modi",
      evidence: [{ id: "e4", description: "Unemployment and underemployment have remained persistent points of public debate, widely reported as falling short of the pledge.", source_name: "General reporting on employment data", source_type: "news", stance: "contradicts" }],
      verdicts: [{ id: "v4", status: "not_fulfilled", confidence: 45, reasoning: "Available reporting has repeatedly characterized this target as unmet. Confidence is capped at moderate because only one evidence category is attached.", methodology: "Derived from 1 evidence item(s): 0 supporting, 1 contradicting. Formula: 40 base + 8×evidence count + 25×agreement ratio, clamped 15-95.", verdict_source: "ai", created_at: "2026-08-01" }],
    },
  ],
  "nitish-kumar": [
    {
      id: "n1", claim_type: "promise", text: "Statewide liquor prohibition", claimant: "Nitish Kumar",
      evidence: [
        { id: "e5", description: "Bihar implemented a statewide alcohol ban in April 2016, formally enacted and enforced.", source_type: "official", stance: "supports" },
        { id: "e6", description: "Enforcement has faced ongoing challenges including illicit liquor trade, a frequently reported gap between the law and outcomes.", source_type: "news", stance: "contradicts" },
      ],
      verdicts: [{ id: "v5", status: "partially_fulfilled", confidence: 58, reasoning: "The law was enacted and remains in force, fulfilling the literal promise — but persistent enforcement gaps suggest the intended outcome is only partly realized.", methodology: "Derived from 2 evidence item(s): 1 supporting, 1 contradicting. Formula: 40 base + 8×evidence count + 25×agreement ratio, clamped 15-95.", verdict_source: "ai", created_at: "2026-08-01" }],
    },
    {
      id: "n2", claim_type: "promise", text: "Bijli-Sadak-Pani infrastructure push", claimant: "Nitish Kumar",
      evidence: [], verdicts: [{ id: "v6", status: "unverified", confidence: 20, reasoning: "Tracked but no structured evidence has been attached yet.", methodology: "No evidence attached yet. Formula: base confidence 20 when evidence count = 0.", verdict_source: "manual", created_at: "2026-08-01" }],
    },
    {
      id: "n3", claim_type: "promise", text: "Jeevika women self-help group expansion", claimant: "Nitish Kumar",
      evidence: [], verdicts: [{ id: "v7", status: "unverified", confidence: 20, reasoning: "Tracked but no structured evidence has been attached yet.", methodology: "No evidence attached yet. Formula: base confidence 20 when evidence count = 0.", verdict_source: "manual", created_at: "2026-08-01" }],
    },
    {
      id: "n4", claim_type: "promise", text: "Special Category Status for Bihar", claimant: "Nitish Kumar",
      evidence: [], verdicts: [{ id: "v8", status: "not_fulfilled", confidence: 20, reasoning: "Tracked but no structured evidence has been attached yet — status carried over from legacy tracking, needs review.", methodology: "No evidence attached yet. Formula: base confidence 20 when evidence count = 0.", verdict_source: "manual", created_at: "2026-08-01" }],
    },
  ],
  "tejashwi-yadav": [
    {
      id: "t1", claim_type: "promise", text: "10 lakh government jobs pledge", claimant: "Tejashwi Yadav",
      evidence: [], verdicts: [{ id: "v9", status: "unverified", confidence: 20, reasoning: "Tracked but no structured evidence has been attached yet.", methodology: "No evidence attached yet. Formula: base confidence 20 when evidence count = 0.", verdict_source: "manual", created_at: "2026-08-01" }],
    },
  ],
};

const fallbackPoliticianMeta = {
  "narendra-modi": { name: "Narendra Modi", role: "Prime Minister of India", party: { abbreviation: "BJP" }, bio: "Prime Minister since 2014, MP from Varanasi." },
  "nitish-kumar": { name: "Nitish Kumar", role: "Chief Minister, Bihar", party: { abbreviation: "JD(U)" }, bio: "Chief Minister of Bihar across multiple terms since 2005." },
  "tejashwi-yadav": { name: "Tejashwi Yadav", role: "Leader of Opposition, Bihar", party: { abbreviation: "RJD" }, bio: "RJD leader and former Deputy Chief Minister of Bihar." },
};

export function fallbackPoliticianWithLedger(slug) {
  const meta = fallbackPoliticianMeta[slug];
  const claims = rawFallbackClaims[slug];
  if (!meta || !claims) return null;
  const withLatest = claims.map((c) => ({ ...c, latestVerdict: c.verdicts[0] || null }));
  return {
    slug, ...meta, timeline_events: [],
    claims: withLatest,
    accountability: computeAccountabilityScore(withLatest),
  };
}

export function fallbackPoliticiansWithScores() {
  return Object.keys(fallbackPoliticianMeta).map((slug) => {
    const p = fallbackPoliticianWithLedger(slug);
    return { slug, name: p.name, role: p.role, party: p.party, accountability: p.accountability };
  });
}

export const fallbackConstituencies = [
  { name: "Patna Sahib", state: "Bihar", current_rep: "Ravi Shankar Prasad", vote_share: 55.2, margin: 12.4, turnout: 58.6 },
  { name: "Raghopur", state: "Bihar", current_rep: "Tejashwi Yadav", vote_share: 51.8, margin: 6.2, turnout: 61.3 },
];

export const fallbackStocks = [
  { name: "Narendra Modi", price: 187.4, change_pct: 3.1, reason: "142 mentions in the last 24h (wikipedia_pageviews:89, gdelt_articles:31, hackernews:4, mastodon:18)" },
  { name: "Nitish Kumar", price: 92.1, change_pct: -1.4, reason: "58 mentions in the last 24h (wikipedia_pageviews:22, gdelt_articles:19, mastodon:17)" },
  { name: "Tejashwi Yadav", price: 104.6, change_pct: 4.2, reason: "76 mentions in the last 24h (wikipedia_pageviews:31, gdelt_articles:28, hackernews:2, mastodon:15)" },
  { name: "Rahul Gandhi", price: 78.3, change_pct: -0.6, reason: "49 mentions in the last 24h (wikipedia_pageviews:20, gdelt_articles:24, mastodon:5)" },
];

export const fallbackRisk = [
  { country: "India", war_risk: 15, economic_risk: 20, political_stability: 83 },
  { country: "Pakistan", war_risk: 34, economic_risk: 58, political_stability: 41 },
  { country: "China", war_risk: 22, economic_risk: 30, political_stability: 76 },
];

// Demo data for the "What Changed" homepage layer — used when Supabase
// isn't configured. Mirrors exactly the shape lib/changes.js returns from
// real data, so the homepage exercises the same rendering path either way.
export function fallbackChanges() {
  const changes = [
    {
      type: "election_prediction", entity: "Bihar Assembly Election 2026 — NDA", title: "NDA win probability",
      previousValue: 67, newValue: 72, delta: 5, reason: "Updated estimate — see /predictions for current methodology and what still needs building.",
      sources: [], timestamp: "2026-08-20T09:00:00Z", confidence: null, href: "/predictions",
    },
    {
      type: "promise_status", entity: "Nitish Kumar", title: "Statewide liquor prohibition",
      previousValue: "unverified", newValue: "partially_fulfilled", delta: null,
      reason: "The law was enacted and remains in force, fulfilling the literal promise — but persistent enforcement gaps suggest the intended outcome is only partly realized.",
      sources: [], timestamp: "2026-08-19T14:00:00Z", confidence: 58, href: "/politicians/nitish-kumar",
    },
    {
      type: "fact_check", entity: "Fact Check", title: "Claim about Bihar's employment figures circulating online",
      previousValue: null, newValue: "misleading", delta: null,
      reason: "The figure cited omits the comparison baseline used in the original report, which changes the conclusion.",
      sources: [], timestamp: "2026-08-19T11:00:00Z", confidence: 64, href: "/fact-check", sourceCount: 2,
    },
    {
      type: "attention", entity: "Tejashwi Yadav", title: "Tejashwi Yadav — attention volume",
      previousValue: null, newValue: 104.6, delta: 4.2, reason: "Strong rally turnout in Bihar",
      sources: [], timestamp: "2026-08-19T06:00:00Z", confidence: null, href: "/stock-market",
    },
    {
      type: "new_evidence", entity: "Narendra Modi", title: "Two crore jobs a year",
      previousValue: null, newValue: null, delta: null,
      reason: "New reporting added on employment data trends relevant to this promise.",
      sources: [], timestamp: "2026-08-18T08:00:00Z", confidence: null, href: "/politicians/narendra-modi",
    },
  ];
  const byType = {};
  for (const c of changes) { byType[c.type] = byType[c.type] || []; byType[c.type].push(c); }
  // Constituency Watch intentionally starts empty even in demo mode — real
  // constituency movement needs 2+ snapshots over time, which a fresh
  // deployment never has yet. Showing nothing here is the honest state,
  // not a bug, and the homepage renders that as an explicit empty message.
  byType.constituency = [];
  return { changes, byType };
}

// Demo data for the Election Watch selector (lib/electionWatch.js). Mirrors
// the real-world shape on purpose: one upcoming election with actual
// prediction history (Bihar, genuinely upcoming as of Aug 2026), and one
// concluded election with NO structured result data attached (Tamil Nadu,
// concluded 4 May 2026 per the Election Commission, but NetaBoard hasn't
// loaded detailed results) — so the selector's real priority logic runs
// even in demo mode: Tamil Nadu is correctly skipped for lacking data, and
// Bihar is chosen via the "upcoming with real history" tier, not because
// it's hardcoded anywhere in the selection code itself.
export function fallbackElectionWatch() {
  if (process.env.TEST_NO_ELECTION) return { election: null };
  const now = Date.now();
  const daysAgo = (n) => new Date(now - n * 86400000).toISOString();

  // Demo elections in the exact { elections, predsByElection } shape
  // selectElection() expects — run through the REAL algorithm below, not
  // hardcoded, so the same tier-skipping logic is genuinely exercised in
  // demo mode. Tamil Nadu is concluded but has zero predictions rows, so
  // it's correctly skipped by tier 2; Bihar wins via tier 3.
  const elections = [
    { id: "bihar-2026", name: "Bihar Assembly Election 2026", region: "Bihar", election_date: "2026-11-10", status: "upcoming", description: "Election for all 243 seats of the Bihar Legislative Assembly." },
    { id: "tn-2026", name: "Tamil Nadu Assembly Election 2026", region: "Tamil Nadu", election_date: "2026-05-04", status: "concluded", description: "Results declared 4 May 2026. Detailed results not yet loaded into NetaBoard." },
  ];
  const predsByElection = {
    "bihar-2026": [
      { option_label: "NDA", probability: 67, recorded_at: daysAgo(9) },
      { option_label: "NDA", probability: 72, recorded_at: daysAgo(2) },
    ],
    // tn-2026 deliberately has no entries — this is what makes it get skipped.
  };

  return { election: selectElection(elections, predsByElection) };
}
