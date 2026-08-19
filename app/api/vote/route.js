import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// GET /api/vote?election_id=... -> { counts: { NDA: 5204, ... } }
export async function GET(req) {
  const sb = supabaseServer();
  const { searchParams } = new URL(req.url);
  const electionId = searchParams.get("election_id");
  if (!sb || !electionId) return NextResponse.json({ counts: {} });

  const { data, error } = await sb.from("market_votes").select("option_label").eq("election_id", electionId);
  if (error) return NextResponse.json({ counts: {}, error: error.message }, { status: 500 });

  const counts = {};
  for (const row of data) counts[row.option_label] = (counts[row.option_label] || 0) + 1;
  return NextResponse.json({ counts });
}

// POST { election_id, option_label, fingerprint } -> records one vote per fingerprint per election
export async function POST(req) {
  const sb = supabaseServer();
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const body = await req.json();
  const { election_id, option_label, fingerprint } = body || {};
  if (!election_id || !option_label || !fingerprint) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { error } = await sb.from("market_votes").insert({
    election_id, option_label, voter_fingerprint: fingerprint,
  });

  if (error) {
    // unique constraint violation = already voted
    if (error.code === "23505") return NextResponse.json({ error: "already_voted" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
