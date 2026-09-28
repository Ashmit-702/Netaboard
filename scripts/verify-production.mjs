// Usage: npm run verify:prod -- https://your-site.vercel.app
// Fetches the real deployed site and checks that EVERY route belongs to one
// coherent build and to the current product (not an older one).
const base = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const bust = `?_v=${Date.now()}`;

const ROUTES = ["/", "/current-affairs", "/brief", "/politicians", "/elections", "/evidence", "/attention", "/explore", "/predictions", "/issue-watch"];
const NAV = ["Today", "Politicians", "Elections", "Evidence", "Explore"];
const FORBIDDEN = ["Constituencies", "Heatmap", "Geopolitical", "Stock Market", "Attention Index", "Ask AI", "About this build", "Free stack", "Data sources", "Patna Sahib", "Raghopur", "Bihar Assembly Election 2026", "GNews", "GDELT", "NewsData", "Groq", "Gemini", "OpenRouter", "Vercel", "Supabase"];

let failures = 0;
const fail = (m) => { failures++; console.log("  ✗ " + m); };
const ok = (m) => console.log("  ✓ " + m);
const text = (html) => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

const builds = new Map();
const pages = {};
for (const r of ROUTES) {
  console.log(`\n${r}`);
  let res;
  try { res = await fetch(base + r + (r.includes("?") ? "&" : "?") + "_v=" + Date.now(), { redirect: "manual", headers: { "cache-control": "no-cache" } }); }
  catch (e) { fail("request failed: " + e.message); continue; }
  if (res.status !== 200) { fail(`HTTP ${res.status}`); continue; }
  const html = await res.text();
  pages[r] = html;
  const hdr = res.headers.get("x-netaboard-build");
  const meta = (html.match(/name="netaboard-build" content="([^"]+)"/) || [])[1];
  if (!meta) fail("no build fingerprint in HTML — this route is NOT from the current build");
  else { builds.set(r, meta); ok(`build ${meta}${hdr && hdr !== meta ? ` (header says ${hdr}!)` : ""}`); }
  const t = text(html);
  const missing = NAV.filter((n) => !new RegExp(`>\\s*${n}\\s*<`).test(html));
  if (missing.length) fail(`primary navigation missing: ${missing.join(", ")}`);
  else ok("primary navigation: Today · Politicians · Elections · Evidence · Explore");
  const bad = FORBIDDEN.filter((f) => r !== "/about" && t.includes(f));
  if (bad.length) fail(`forbidden/old content present: ${bad.join(", ")}`); else ok("no old-product or vendor strings");
}

console.log("\n— coherence —");
const distinct = new Set(builds.values());
if (distinct.size === 1) ok(`all ${builds.size} routes report the same build (${[...distinct][0]})`);
else fail(`routes come from DIFFERENT builds: ${[...builds].map(([r, b]) => `${r}=${b}`).join("  ")}`);

if (pages["/"]) {
  const home = pages["/"];
  const title = (home.match(/<title>([^<]*)<\/title>/) || [])[1];
  if (/^Politicians/.test(title || "")) fail(`homepage is serving the Politicians page (title "${title}")`); else ok(`homepage title: ${title}`);
  const sec = (name) => home.search(new RegExp(`class="eyebrow">\\s*${name.replace("'", "(?:'|&#x27;|&apos;)")}\\s*<`));
  const names = ["Today's Brief", "Current Affairs", "Trending Now", "Issue Watch", "Trending Netas", "Ask NetaBoard"];
  const pos = names.map(sec);
  names.forEach((n, i) => { if (pos[i] < 0) fail(`homepage missing section: ${n}`); });
  if (pos.every((v) => v >= 0) && pos.every((v, i) => i === 0 || v > pos[i - 1])) ok("homepage section order: Brief → Current Affairs → Trending Now → Issue Watch → Trending Netas → Ask NetaBoard");
  else fail("homepage sections are out of order");
  if (!home.includes("today-tabs")) fail("homepage has no Today secondary navigation");
  if (/Constituenc|Geopolitical|Stock Market/i.test(text(home))) fail("homepage contains a removed feature");
}

console.log("\n— politician links —");
const slugs = new Set();
for (const html of Object.values(pages)) for (const m of html.matchAll(/href="\/politicians\/([a-z0-9-]+)"/g)) slugs.add(m[1]);
if (!slugs.size) console.log("  (no politician links rendered — database empty or unavailable)");
for (const s of slugs) {
  const res = await fetch(`${base}/politicians/${s}`, { redirect: "manual" });
  res.status === 200 ? ok(`/politicians/${s} → 200`) : fail(`/politicians/${s} → ${res.status}`);
}

const legacy = { "/constituencies": "/elections", "/heatmap": "/explore", "/stock-market": "/attention", "/today": "/" };
console.log("\n— legacy redirects —");
for (const [from, to] of Object.entries(legacy)) {
  const res = await fetch(base + from, { redirect: "manual" });
  const loc = (res.headers.get("location") || "").replace(base, "");
  [307, 308, 301, 302].includes(res.status) && loc.startsWith(to) ? ok(`${from} → ${to}`) : fail(`${from} → ${res.status} ${loc}`);
}

console.log(failures ? `\n${failures} check(s) FAILED — this deployment is not one coherent, current version.` : "\nAll checks passed — one coherent, current version.");
process.exit(failures ? 1 : 0);
