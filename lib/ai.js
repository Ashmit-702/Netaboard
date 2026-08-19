// Unified AI gateway. Tries providers in order — fastest/cheapest first —
// and falls through automatically if one is unconfigured, rate-limited, or
// errors out. This is what "using multiple API keys for different work"
// looks like in practice: redundancy, not brute-force quota stacking.
//
// Order: Groq (fastest, generous free tier, great for chat/fact-check) →
// Gemini (larger context, good general quality) → OpenRouter free models
// (broadest catch-all, many :free-suffixed models with no cost).
import { pickKey } from "./keyRotation";

async function callGroq(prompt, system, json) {
  const key = pickKey("GROQ_API_KEY");
  if (!key) return null;
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [...(system ? [{ role: "system", content: system }] : []), { role: "user", content: prompt }],
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || null;
}

async function callGemini(prompt, system, json) {
  const key = pickKey("GEMINI_API_KEY");
  if (!key) return null;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        ...(json ? { generationConfig: { responseMimeType: "application/json" } } : {}),
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

async function callOpenRouter(prompt, system, json) {
  const key = pickKey("OPENROUTER_API_KEY");
  if (!key) return null;
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "meta-llama/llama-3.3-70b-instruct:free",
      messages: [...(system ? [{ role: "system", content: system }] : []), { role: "user", content: prompt }],
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || null;
}

const PROVIDERS = [
  { name: "groq", fn: callGroq },
  { name: "gemini", fn: callGemini },
  { name: "openrouter", fn: callOpenRouter },
];

// generateText(prompt, { system, json }) -> { text, provider, error }
export async function generateText(prompt, opts = {}) {
  const { system, json = false } = opts;
  let lastError = null;
  for (const { name, fn } of PROVIDERS) {
    try {
      const text = await fn(prompt, system, json);
      if (text) return { text, provider: name, error: null };
    } catch (e) {
      lastError = `${name}: ${e.message}`;
      continue; // try the next provider
    }
  }
  return { text: null, provider: null, error: lastError || "No AI provider configured — set GROQ_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY" };
}
