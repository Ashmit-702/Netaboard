import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { generateText } from "@/lib/ai";

const SYSTEM = `You are a political fact-checker. Given a claim or speech excerpt, respond ONLY with
strict JSON: {"verdict":"True|Misleading|Needs Context|False","explanation":"2-3 sentence neutral
explanation","confidence":"low|medium|high"}. Do not include markdown fences or any other text.`;

export async function POST(req) {
  const { text } = await req.json();
  if (!text) return NextResponse.json({ error: "Missing text" }, { status: 400 });

  const { text: raw, provider, error } = await generateText(text, { system: SYSTEM, json: true });
  if (!raw) {
    return NextResponse.json({
      verdict: "Needs Context",
      explanation: "Demo mode — set GROQ_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY to run real fact-checks.",
      confidence: "low",
      error,
    });
  }

  let parsed;
  try { parsed = JSON.parse(raw); }
  catch { parsed = { verdict: "Needs Context", explanation: raw, confidence: "low" }; }

  const sb = supabaseServer();
  if (sb) {
    await sb.from("fact_checks").insert({ input_text: text, verdict: parsed.verdict, explanation: parsed.explanation, sources: [] });
  }

  return NextResponse.json({ ...parsed, provider });
}
