// Google's official Fact Check Tools API — free, official, no rate-limit
// surprises. It searches the same ClaimReview-tagged database used by
// PolitiFact, Snopes, BOOM Live, Alt News, and hundreds of other publishers
// worldwide. This is checked BEFORE asking the AI to guess, so /fact-check
// can cite a real published fact-check when one already exists instead of
// relying purely on the model's own judgment.
import { pickKey } from "./keyRotation";

export async function searchPublishedFactChecks(query) {
  const key = pickKey("GOOGLE_FACTCHECK_API_KEY");
  if (!key) return [];
  try {
    const res = await fetch(
      `https://factchecktools.googleapis.com/v1alpha1/claims:search?query=${encodeURIComponent(query)}&languageCode=en&pageSize=5&key=${key}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.claims || []).map((c) => ({
      claim: c.text,
      claimant: c.claimant || "Unknown",
      rating: c.claimReview?.[0]?.textualRating || "Unrated",
      publisher: c.claimReview?.[0]?.publisher?.name || "Unknown publisher",
      url: c.claimReview?.[0]?.url,
    }));
  } catch { return []; }
}
