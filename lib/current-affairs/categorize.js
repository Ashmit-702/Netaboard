// Deterministic classification of a story cluster. Categories are NOT
// requested from the news APIs (which would multiply API calls); they are
// assigned from the wording of the coverage using the rule table below, so
// the filter chips reflect what today's stories actually are. The rule table
// is generic subject vocabulary — it contains no specific event or topic.

export const TOPICS = ["Politics", "Government & Policy", "Economy", "Business", "Science & Tech", "Environment", "Security", "Sports"];

const RULES = {
  "Politics": ["election", "elections", "minister", "parliament", "lok sabha", "rajya sabha", "assembly", "opposition", "mla", "chief minister", "prime minister", "campaign", "poll", "polls", "voters", "coalition", "cabinet", "bjp", "congress", "party", "alliance", "rally", "manifesto", "politician", "leader"],
  "Government & Policy": ["policy", "bill", "scheme", "regulation", "regulator", "ministry", "notification", "supreme court", "high court", "verdict", "ruling", "tribunal", "law", "legislation", "amendment", "guidelines", "circular", "budget", "court", "ordinance", "mandate"],
  "Economy": ["gdp", "inflation", "repo", "interest rate", "rupee", "fiscal", "trade", "exports", "imports", "unemployment", "economy", "economic", "tariff", "banks", "banking", "bank", "payments", "payment", "rbi", "subsidy", "tax", "gst", "jobs", "wages", "deficit", "growth"],
  "Business": ["shares", "sensex", "nifty", "stock", "stocks", "ipo", "company", "profit", "earnings", "merger", "acquisition", "startup", "quarterly", "revenue", "ceo", "market", "investors", "funding", "valuation", "brand"],
  "Science & Tech": ["technology", "tech", "software", "isro", "satellite", "launch", "research", "scientists", "cyber", "app", "internet", "outage", "server", "servers", "data centre", "semiconductor", "space", "mission", "artificial intelligence", "chip", "network", "platform", "glitch", "digital"],
  "Environment": ["climate", "pollution", "monsoon", "flood", "floods", "cyclone", "heatwave", "emissions", "forest", "wildlife", "air quality", "drought", "rainfall", "earthquake", "landslide", "carbon", "environment", "storm"],
  "Security": ["attack", "terror", "terrorist", "army", "border", "police", "military", "defence", "encounter", "security forces", "ceasefire", "missile", "drone", "militants", "blast", "explosion", "crime", "arrested", "arrest", "hostage"],
  "Sports": ["match", "cricket", "ipl", "tournament", "olympic", "olympics", "football", "hockey", "medal", "world cup", "coach", "league", "tennis", "batting", "bowler", "wicket", "goal", "championship", "athlete"],
};

const COMPILED = Object.fromEntries(
  Object.entries(RULES).map(([topic, words]) => [topic, new RegExp(`\\b(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "gi")])
);

const INDIA_SIGNALS = /\b(india|indian|indians|bharat|new delhi|delhi|mumbai|kolkata|chennai|bengaluru|bangalore|hyderabad|pune|ahmedabad|lucknow|patna|jaipur|bhopal|raipur|ranchi|kochi|guwahati|lok sabha|rajya sabha|rbi|sebi|npci|isro|kerala|tamil nadu|karnataka|maharashtra|gujarat|bihar|punjab|haryana|assam|odisha|rajasthan|uttar pradesh|madhya pradesh|chhattisgarh|jharkhand|west bengal|telangana|andhra pradesh|goa|kashmir|ladakh|uttarakhand|himachal|manipur)\b/i;

function count(re, text) {
  if (!text) return 0;
  const m = text.match(re);
  return m ? m.length : 0;
}

export function classifyCluster(articles) {
  const scores = {};
  for (const topic of TOPICS) {
    let s = 0;
    for (const a of articles) {
      s += 2 * count(COMPILED[topic], a.title);          // headline hits weigh double
      s += count(COMPILED[topic], (a.description || "").slice(0, 300));
    }
    scores[topic] = s;
  }
  const ranked = TOPICS.map((t) => [t, scores[t]]).sort((a, b) => b[1] - a[1] || TOPICS.indexOf(a[0]) - TOPICS.indexOf(b[0]));
  const topic = ranked[0][1] >= 2 ? ranked[0][0] : null;
  const secondary = ranked[1] && ranked[1][1] >= 3 && ranked[1][1] >= ranked[0][1] * 0.6 ? ranked[1][0] : null;

  const indiaText = articles.some((a) => INDIA_SIGNALS.test(a.title) || INDIA_SIGNALS.test((a.description || "").slice(0, 300)));
  const indianOutlets = articles.filter((a) => /\.in$/.test(a.outlet) || /(^|\.)(thehindu|hindustantimes|indiatimes|ndtv|indianexpress|livemint|business-standard|deccanherald|news18|firstpost|moneycontrol)\./.test(a.outlet + ".")).length;
  const region = indiaText || indianOutlets / articles.length >= 0.4 ? "India" : "World";

  return { region, topic, secondary };
}

export { FILTERS, matchesFilter } from "./search.js";
