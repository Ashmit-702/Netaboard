import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { generateText } from "@/lib/ai";
import { searchPublishedFactChecks } from "@/lib/factcheck";
import { cleanAIText } from "@/lib/sanitize";

const SYSTEM = `You are a political fact-checker. You may be given real published fact-checks as
context. IMPORTANT: if a published fact-check exists with a clear rating for the same claim, your
verdict should match it unless you have a specific, stated reason to disagree — you are not the
final authority when a verified publisher has already ruled on this. Respond ONLY with strict JSON:
{"verdict":"True|Misleading|Needs Context|False","explanation":"2-3 sentence neutral explanation in
plain prose, no markdown, no asterisks"}. Do not include markdown fences or any other text.`;

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

  parsed.explanation = cleanAIText(parsed.explanation);

  const sb = supabaseServer();
  if (sb) {
    await sb.from("fact_checks").insert({
      input_text: text, verdict: parsed.verdict, explanation: parsed.explanation,
      sources: published,
    });
  }

  return NextResponse.json({ ...parsed, sources: published, provider, grounded: published.length > 0 });
}
