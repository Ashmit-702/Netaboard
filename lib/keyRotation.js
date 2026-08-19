// Pulls one key at random from a comma-separated env var, e.g.
//   GROQ_API_KEY=key_one,key_two,key_three
// Random (not round-robin) on purpose — serverless functions don't share
// memory between invocations, so an in-memory counter would reset on every
// cold start anyway. Random selection spreads load evenly enough in practice.
//
// Important: most providers' free tiers are per *account*, not per key, and
// their terms of service prohibit creating multiple accounts just to stack
// free quota (Groq's ToS says this explicitly). Use this for keys you
// legitimately hold — e.g. a personal key and a team key, or spreading calls
// across genuinely different provider accounts you're allowed to use — not
// as a rate-limit workaround.
export function pickKey(envVarName) {
  const raw = process.env[envVarName];
  if (!raw) return null;
  const keys = raw.split(",").map((k) => k.trim()).filter(Boolean);
  if (!keys.length) return null;
  return keys[Math.floor(Math.random() * keys.length)];
}

export function hasKey(envVarName) {
  return !!pickKey(envVarName);
}
