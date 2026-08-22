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
    accountability: computeAccountabilityScoreLocal(withLatest),
  };
}

export function fallbackPoliticiansWithScores() {
  return Object.keys(fallbackPoliticianMeta).map((slug) => {
    const p = fallbackPoliticianWithLedger(slug);
    return { slug, name: p.name, role: p.role, party: p.party, accountability: p.accountability };
  });
}

// Mirrors lib/evidence.js's computeAccountabilityScore exactly — duplicated
// here (not imported) only to keep fallback.js dependency-free and safe to
// import from both server and client code without pulling in extra modules.
function computeAccountabilityScoreLocal(claims) {
  const promises = claims.filter((c) => c.claim_type === "promise");
  const total = promises.length;
  const fulfilled = promises.filter((c) => c.latestVerdict?.status === "fulfilled").length;
  const partial = promises.filter((c) => c.latestVerdict?.status === "partially_fulfilled").length;
  const notFulfilled = promises.filter((c) => c.latestVerdict?.status === "not_fulfilled").length;
  const disputed = promises.filter((c) => !c.latestVerdict || ["disputed", "unverified"].includes(c.latestVerdict.status)).length;
  const scored = fulfilled + partial + notFulfilled;
  const score = scored > 0 ? Math.round(((fulfilled * 1 + partial * 0.5) / scored) * 100) : null;
  const confidences = promises.map((c) => c.latestVerdict?.confidence).filter((c) => typeof c === "number");
  const avgConfidence = confidences.length ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length) : null;
  return {
    score, total, fulfilled, partial, notFulfilled, disputed, avgConfidence,
    methodology: scored > 0
      ? `Score = (fulfilled×1 + partially_fulfilled×0.5 + not_fulfilled×0) ÷ ${scored} scored claims × 100. ${disputed} disputed/unverified claim(s) are tracked but excluded from the score until they have a real verdict.`
      : `No promise claims have a verified verdict yet — score withheld rather than shown as 0. ${disputed} claim(s) are tracked and awaiting evidence.`,
  };
}

export const fallbackConstituencies = [
  { name: "Patna Sahib", state: "Bihar", current_rep: "Ravi Shankar Prasad", vote_share: 55.2, margin: 12.4, turnout: 58.6 },
  { name: "Raghopur", state: "Bihar", current_rep: "Tejashwi Yadav", vote_share: 51.8, margin: 6.2, turnout: 61.3 },
];

export const fallbackStocks = [
  { name: "Narendra Modi", price: 187.4, change_pct: 3.1 },
  { name: "Nitish Kumar", price: 92.1, change_pct: -1.4 },
  { name: "Tejashwi Yadav", price: 104.6, change_pct: 4.2 },
  { name: "Rahul Gandhi", price: 78.3, change_pct: -0.6 },
];

export const fallbackRisk = [
  { country: "India", war_risk: 15, economic_risk: 20, political_stability: 83 },
  { country: "Pakistan", war_risk: 34, economic_risk: 58, political_stability: 41 },
  { country: "China", war_risk: 22, economic_risk: 30, political_stability: 76 },
];
