// Synthetic fixtures. They are shaped like what lib/news/ingest.js returns
// per provider. They are TEST DATA ONLY and never imported by the app.
export const NOW = Date.parse("2026-09-24T10:00:00Z");
const min = (m) => new Date(NOW - m * 60000).toISOString();

export function raw(title, url, minutesAgo, description = null, source = null) {
  return { title, url, source, publishedAt: minutesAgo === null ? null : min(minutesAgo), description };
}

// A UPI-style multi-outlet outage: different words, different outlets.
export const upiArticles = [
  raw("UPI services down across multiple banks, users report failed payments", "https://www.thehindu.com/business/upi-down/article1.ece", 150, "Users across the country reported failed UPI transactions on Thursday morning, with several banks confirming disruptions."),
  raw("UPI outage hits users nationwide as payments fail", "https://www.ndtv.com/india-news/upi-outage-hits-users-1", 140, "Digital payments were disrupted for lakhs of users nationwide."),
  raw("NPCI says it is monitoring UPI disruption, restoring services", "https://economictimes.indiatimes.com/wealth/upi-npci-monitor/articleshow/1.cms", 95, "NPCI said technical teams are working to restore services."),
  raw("Why is UPI not working today? Payments app users stranded", "https://www.hindustantimes.com/technology/why-upi-not-working-1.html", 60, null),
  raw("UPI payments partially restored after hours-long outage", "https://indianexpress.com/article/business/upi-restored-1/", 15, "Services were partially restored after a prolonged outage, officials said."),
  raw("UPI outage: RBI seeks report from NPCI", "https://www.livemint.com/economy/upi-outage-rbi-report-1.html", 8, "The central bank has asked for a detailed report."),
  // one publisher repeating itself must not inflate breadth
  raw("UPI down live updates", "https://www.hindustantimes.com/live/upi-down-live-1.html", 50),
  raw("UPI down live updates: latest", "https://www.hindustantimes.com/live/upi-down-live-2.html", 30),
  raw("UPI down live updates: bank statements", "https://www.hindustantimes.com/live/upi-down-live-3.html", 20),
];

// Distractors: share a politician name / generic acronym but are different stories.
export const distractors = [
  raw("Modi inaugurates new expressway in Gujarat", "https://www.thehindu.com/news/modi-expressway-gujarat/a1.ece", 300, "The Prime Minister inaugurated a 120 km expressway."),
  raw("Modi expressway opening draws praise from Gujarat leaders", "https://timesofindia.indiatimes.com/india/modi-expressway-praise/articleshow/2.cms", 280),
  raw("Modi to visit Japan next month for bilateral summit", "https://www.ndtv.com/india-news/modi-japan-visit-2", 200, "The visit will focus on trade and semiconductors."),
  raw("Modi Japan trip: what is on the agenda", "https://www.hindustantimes.com/india-news/modi-japan-agenda-2.html", 190),
  raw("RBI keeps repo rate unchanged, cites inflation risks", "https://www.livemint.com/economy/rbi-repo-unchanged-3.html", 240, "The monetary policy committee kept rates steady."),
  raw("RBI repo rate decision: what it means for home loans", "https://www.business-standard.com/finance/rbi-repo-loans-3", 230),
  raw("SEBI tightens norms for small-cap mutual funds", "https://www.moneycontrol.com/news/sebi-smallcap-norms-4.html", 210, "The regulator issued new disclosure rules."),
  raw("SEBI new small-cap mutual fund norms explained", "https://economictimes.indiatimes.com/mf/sebi-smallcap-4/articleshow/4.cms", 205),
];

export const oldStories = [
  raw("Cyclone Vayu makes landfall on eastern coast, thousands evacuated", "https://www.thehindu.com/news/cyclone-vayu-a.ece", 96 * 60 / 60 * 60, "Evacuations under way."),
  raw("Cyclone Vayu landfall: evacuation operations continue", "https://www.ndtv.com/india-news/cyclone-vayu-b", 95 * 60),
];

export const continuing = [ // 3 outlets, first report ~60h ago, latest 30h ago => >=24h span, kept to 72h
  raw("Flood relief operations continue in northern districts as rivers swell", "https://www.thehindu.com/news/flood-relief-c1.ece", 60 * 60, "Relief camps have been set up."),
  raw("Northern districts flood relief: rivers swell, camps set up", "https://www.ndtv.com/india-news/flood-relief-c2", 45 * 60),
  raw("Flood relief camps overwhelmed as northern rivers rise further", "https://www.hindustantimes.com/india-news/flood-relief-c3.html", 30 * 60),
];

export const stale72 = [ // 3 outlets but all within 2h of each other, 60h old => dropped
  raw("Metro line inauguration postponed after safety inspection", "https://www.thehindu.com/news/metro-postponed-d1.ece", 60 * 60),
  raw("Metro inauguration postponed after safety inspection finds issues", "https://www.ndtv.com/india-news/metro-postponed-d2", 60 * 60 - 60),
  raw("Metro line opening postponed following safety inspection", "https://www.hindustantimes.com/india-news/metro-postponed-d3.html", 60 * 60 - 90),
];

export const undated = [
  raw("Historic archive piece on assembly delimitation debates resurfaces", "https://www.thehindu.com/opinion/delimitation-e1.ece", null, "An explainer."),
];

export const sportsArticles = [
  raw("India beat Australia by five wickets in thrilling cricket final", "https://www.espncricinfo.com/series/final-1", 100, "A last-over finish sealed the tournament."),
  raw("Cricket final: India win by five wickets against Australia", "https://www.ndtv.com/cricket/final-2", 90),
  raw("India clinch cricket final against Australia with last-over finish", "https://www.thehindu.com/sport/final-3.ece", 85),
];

export const worldArticles = [
  raw("European Central Bank holds rates as eurozone growth slows", "https://www.theguardian.com/business/ecb-rates-1", 120, "Policymakers in Frankfurt kept borrowing costs unchanged."),
  raw("ECB leaves interest rates unchanged amid slowing eurozone growth", "https://www.reuters.com/markets/ecb-rates-2", 110),
];

export const roster = [
  { name: "Narendra Modi", slug: "narendra-modi" },
  { name: "Rahul Gandhi", slug: "rahul-gandhi" },
];

export const asProvider = (articles, provider = "gdelt") => [{ provider, articles }];

// ---- relevance fixtures -------------------------------------------------
// A political/court story with modest coverage.
export const courtArticles = [
  raw("Supreme Court reserves verdict on election commission appointment law", "https://www.thehindu.com/news/sc-election-commission-r1.ece", 120, "The court heard petitions challenging the appointment process for election commissioners."),
  raw("SC reserves order on plea against election commission appointments law", "https://www.ndtv.com/india-news/sc-reserves-order-r2", 105, "The bench reserved its order after two days of hearings."),
  raw("Supreme Court election commission appointments case: order reserved", "https://www.livemint.com/politics/sc-order-reserved-r3.html", 95),
];
// A celebrity story with MANY outlets and very fresh.
export const celebrityArticles = ["thehindu.com", "ndtv.com", "hindustantimes.com", "indianexpress.com", "livemint.com", "news18.com", "firstpost.com", "deccanherald.com"].map((d, i) =>
  raw(`Bollywood actor announces new film with famous director, fans celebrate ${i % 2 ? "trailer" : "release"}`, `https://www.${d}/entertainment/actor-film-${i}`, 20 + i * 3, i === 0 ? "The film's trailer will release next week, the actor said." : null));
// A big sports story.
export const bigSports = ["thehindu.com", "ndtv.com", "hindustantimes.com", "indianexpress.com", "livemint.com", "news18.com", "firstpost.com", "deccanherald.com"].map((d, i) =>
  raw(`India win thrilling cricket final, batting heroes celebrate championship victory ${i}`, `https://www.${d}/sport/final-${i}`, 15 + i * 2, i === 0 ? "A last-over finish sealed the tournament." : null));
// A sports story that is really a government decision: exceptional.
export const sportsPolicy = [
  raw("Wrestling federation banned: athletes, coach and medal winners react before tournament", "https://www.thehindu.com/sport/ministry-ban-1.ece", 70, "The sports ministry ordered the ban after a parliament committee report; athletes and the coach said the tournament plans are in doubt."),
  raw("Wrestling federation ban: athletes, coach and medal winners react ahead of tournament, opposition questions minister in parliament", "https://www.ndtv.com/sport/ministry-ban-2", 60),
  raw("Wrestling federation ban: tournament in doubt, athletes and coach say; parliament committee report cited", "https://www.hindustantimes.com/sport/ministry-ban-3.html", 55),
];
