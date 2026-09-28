import { NextResponse } from "next/server";

// Stamps every response with the build fingerprint (see next.config.mjs).
export function middleware() {
  const res = NextResponse.next();
  res.headers.set("x-netaboard-build", process.env.NB_BUILD || "local");
  return res;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
