// The Evidence Ledger's scoring logic — the ONLY place confidence numbers
// and accountability scores are computed. Both are plain, documented
// formulas over evidence/verdict counts, not AI-invented numbers. The AI's
// role (in app/api/fact-check and any future ingest tooling) is to write
// reasoning text and classify each piece of evidence as supporting or
// contradicting a claim — never to output the confidence number itself.
// That keeps every score traceable back to countable, inspectable inputs.

/**
 * Confidence for a single claim's verdict, from its attached evidence.
 * Formula: 40 base + 8 per evidence item + 25 * agreement ratio, clamped
 * to [15, 95]. Agreement ratio = (supporting - contradicting) / total,
 * so unanimous evidence pushes confidence up, split evidence pulls it
 * toward the base, and zero evidence caps out low regardless of what
 * anyone claims.
 */
export function computeConfidence(evidenceList = []) {
  const total = evidenceList.length;
  if (total === 0) {
    return {
      confidence: 20,
      methodology: "No evidence attached yet. Formula: base confidence 20 when evidence count = 0.",
    };
  }
  const supporting = evidenceList.filter((e) => e.stance === "supports").length;
  const contradicting = evidenceList.filter((e) => e.stance === "contradicts").length;
  const agreement = (supporting - contradicting) / total; // -1 (all contradict) to 1 (all support)
  const raw = 40 + total * 8 + agreement * 25;
  const confidence = Math.max(15, Math.min(95, Math.round(raw)));
  return {
    confidence,
    methodology: `Derived from ${total} evidence item(s): ${supporting} supporting, ${contradicting} contradicting. Formula: 40 base + 8×evidence count + 25×agreement ratio, clamped 15-95.`,
  };
}

/**
 * A politician's Accountability Score, computed fresh from their tracked
 * promise claims and each claim's latest verdict — never stored as a bare
 * number. Disputed/unverified claims are shown but excluded from the score
 * itself, so an unreviewed backlog can't silently drag (or inflate) the
 * number. If there's no scored data yet, score is null — not 0, not 100 —
 * because "we don't have enough verified data" is a different fact than
 * "this person has fulfilled 0% of promises."
 *
 * @param {Array} claims - promise-type claims, each with a `latestVerdict`
 *   object ({status, confidence}) or null if never verdicted.
 */
export function computeAccountabilityScore(claims = []) {
  const promises = claims.filter((c) => c.claim_type === "promise");
  const totalClaims = promises.length;

  const fulfilled = promises.filter((c) => c.latestVerdict?.status === "fulfilled").length;
  const partial = promises.filter((c) => c.latestVerdict?.status === "partially_fulfilled").length;
  const notFulfilled = promises.filter((c) => c.latestVerdict?.status === "not_fulfilled").length;
  const unverified = promises.filter(
    (c) => !c.latestVerdict || ["disputed", "unverified"].includes(c.latestVerdict.status)
  ).length;

  const scoredClaims = fulfilled + partial + notFulfilled;
  const accountabilityScore = scoredClaims > 0
    ? Math.round(((fulfilled * 1 + partial * 0.5 + notFulfilled * 0) / scoredClaims) * 100)
    : null;

  // Coverage is reported unconditionally, even when the score itself looks
  // clean — a 100/100 built on 1 of 40 promises is a different fact than a
  // 100/100 built on 40 of 40, and this app never lets the first one hide
  // as the second.
  const evidenceCoverage = totalClaims > 0 ? Math.round((scoredClaims / totalClaims) * 100) : 0;

  const confidences = promises
    .map((c) => c.latestVerdict?.confidence)
    .filter((c) => typeof c === "number");
  const avgConfidence = confidences.length
    ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
    : null;

  return {
    accountabilityScore,
    evidenceCoverage,
    scoredClaims,
    totalClaims,
    fulfilled,
    partial,
    notFulfilled,
    unverified,
    avgConfidence,
    // Legacy aliases — kept so nothing that already reads .score/.total/.disputed breaks.
    score: accountabilityScore,
    total: totalClaims,
    disputed: unverified,
    methodology: scoredClaims > 0
      ? `Score = (fulfilled×1 + partially_fulfilled×0.5 + not_fulfilled×0) ÷ ${scoredClaims} scored claim(s) × 100. Evidence coverage = ${scoredClaims} scored ÷ ${totalClaims} total tracked = ${evidenceCoverage}%. ${unverified} unverified/disputed claim(s) are tracked but excluded from the score until they have a real verdict.`
      : `No promise claims have a verified verdict yet — score withheld rather than shown as 0. ${unverified} claim(s) are tracked and awaiting evidence. Evidence coverage: 0%.`,
  };
}

/**
 * Reduces a claim's verdicts array (newest-first from the query) down to
 * just the current one, the shape computeAccountabilityScore expects.
 */
export function withLatestVerdict(claim) {
  const sorted = [...(claim.verdicts || [])].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
  return { ...claim, latestVerdict: sorted[0] || null, verdictHistory: sorted };
}
