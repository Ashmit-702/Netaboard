import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { generateText } from "@/lib/ai";
import { searchPublishedFactChecks } from "@/lib/factcheck";

const SYSTEM = `You are a political fact-checker. You may be given real published fact-checks as
context — weigh them heavily if present, they're from verified sources. Respond ONLY with strict
JSON: {"verdict":"True|Misleading|Needs Context|False","explanation":"2-3 sentence neutral
explanation"}. Do not include markdown fences or any other text.`;

export async function POST(req) {
  const { text } = await req.json();
  if (!text) return NextResponse.json({ error: "Missing text" }, { status: 400 });

  const published = await searchPublishedFactChecks(text);

  const context = published.length
    ? `\n\nPublished fact-checks found for related claims:\n${published
        .map((p) => `- "${p.claim}" — rated "${p.rating}" by ${p.publisher}`)
        .join("\n")}`
    : "";

  const { text: raw, provider, error } = await generateText(text + context, { system: SYSTEM, json: true });

  if (!raw) {
    return NextResponse.json({
      verdict: "Needs Context",
      explanation: "Demo mode — set GROQ_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY to run real fact-checks.",
      sources: published,
      error,
    });
  }

  let parsed;
  try { parsed = JSON.parse(raw); }
  catch { parsed = { verdict: "Needs Context", explanation: raw }; }

  const sb = supabaseServer();
  if (sb) {
    await sb.from("fact_checks").insert({
      input_text: text, verdict: parsed.verdict, explanation: parsed.explanation,
      sources: published,
    });
  }

  return NextResponse.json({ ...parsed, sources: published, provider });
}
