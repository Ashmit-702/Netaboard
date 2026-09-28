import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Build fingerprint for production parity checks. Contains no secrets.
export function GET() {
  return NextResponse.json({
    build: process.env.NB_BUILD || "local",
    builtAt: process.env.NB_BUILT_AT || null,
    branch: process.env.VERCEL_GIT_COMMIT_REF || null,
    homepage: "Today's Brief + Current Affairs",
  });
}
