// RELEVANCE LAYER. Pure. NetaBoard is a political-intelligence product, so
// "important" cannot mean "most articles". Every story cluster gets a
// relevance tier and a score adjustment derived from its classification:
//
//   Tier 1  Indian politics, government, courts, elections, policy,
//           nationally significant economy/finance, security, public-interest
//           events (environment/disasters in India)
//   Tier 2  major science/tech/business, world developments, unclassified
//   Tier 3  sports, entertainment, celebrity, lifestyle
//
// This is a scoring layer, not a blacklist: a tier-3 story is promoted to
// tier 2 ("exceptional") when its own reporting carries strong political /
// government / security signal AND several independent outlets cover it
// (e.g. a sports story that is really about a ministry decision). Nothing
// here names a specific story or topic.

const T1_TOPICS = new Set(["Politics", "Government & Policy", "Security", "Economy", "Environment"]);
const T3_TOPICS = new Set(["Sports", "Entertainment"]);

const TIER_POINTS = { 1: 30, 2: 10, 3: -30 };

export function politicalSignal(scores = {}) {
  return (scores["Politics"] || 0) + (scores["Government & Policy"] || 0) + (scores["Security"] || 0);
}

export function relevanceOf(cls, metrics) {
  const signal = politicalSignal(cls.scores);
  let tier;
  if (cls.topic && T3_TOPICS.has(cls.topic)) tier = 3;
  else if (cls.topic && T1_TOPICS.has(cls.topic)) tier = (cls.region === "India" || cls.topic !== "Economy" && cls.topic !== "Environment") ? 1 : 2;
  else tier = 2;   // Business, Science & Tech, unclassified, non-India economy/environment

  let exceptional = false;
  if (tier === 3 && signal >= 4 && metrics.outletCount >= 3) { tier = 2; exceptional = true; }

  let points = TIER_POINTS[tier];
  if (cls.region === "India") points += 8;              // India relevance
  points += Math.min(10, signal);                        // political / public-interest relevance
  return { tier, points, exceptional, signal };
}

/** Surfaces that must be about "what matters today" use tier <= 2. */
export const isImportant = (item) => item.tier <= 2;
