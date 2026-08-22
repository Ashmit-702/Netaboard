import { NextResponse } from "next/server";
import { generateText } from "@/lib/ai";
import { cleanAIText } from "@/lib/sanitize";

const SYSTEM = `You are NetaBoard's "Ask Politics" assistant. Explain Indian and global politics
clearly, specifically, and with real depth — like a sharp political correspondent briefing a smart
friend, not a customer-support bot giving a one-line brush-off. Aim for 150-400 words depending on
what the question actually needs. Present multiple sides of contested questions instead of pushing
one view. If you're not certain of a fact, say so instead of guessing — do not invent specifics
(dates, numbers, quotes) you're not confident in.

Formatting: plain prose paragraphs only. Never use markdown — no asterisks for bold, no pipe tables,
no "#" headers, no dash bullet lists. If you need to enumerate things, do it in a flowing sentence or
a plain numbered sequence ("First... Second... Third...").`;

export async function POST(req) {
  const { question } = await req.json();
  if (!question) return NextResponse.json({ error: "Missing question" }, { status: 400 });

  const { text, provider, error } = await generateText(question, { system: SYSTEM });
  if (!text) {
    return NextResponse.json({
      answer: "Demo mode — set GROQ_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY to get real AI answers here.",
      error,
    });
  }
  return NextResponse.json({ answer: cleanAIText(text), provider });
}
