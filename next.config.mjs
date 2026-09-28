// The build fingerprint is inlined at build time. Every route of one
// deployment therefore reports the SAME value (meta tag, x-netaboard-build
// header, /api/version) — scripts/verify-production.mjs uses that to prove
// a deployment is one coherent version.
const build = (process.env.VERCEL_GIT_COMMIT_SHA || "local").slice(0, 7);
const builtAt = new Date().toISOString();

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  env: { NB_BUILD: build, NB_BUILT_AT: builtAt },
};
export default nextConfig;
