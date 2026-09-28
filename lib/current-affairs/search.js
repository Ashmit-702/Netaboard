// Pure, dependency-free helpers shared by the server (feed engine) and the
// client (filter/search UI). Search runs over normalized story clusters.
const QUERY_STOP = new Set(["the", "a", "an", "and", "of", "in", "on", "to", "for", "is", "are", "what", "about"]);

export function searchItems(items, query) {
  const terms = [...new Set((query || "").toLowerCase().split(/[^a-z0-9]+/).filter((t) => t && !QUERY_STOP.has(t)))];
  if (!terms.length) return items;
  return items.filter((it) => terms.every((t) => it.searchText.includes(t)));
}

export function sortItems(items, mode = "important") {
  const copy = [...items];
  if (mode === "latest") copy.sort((a, b) => (b.newestAt || "").localeCompare(a.newestAt || ""));
  else copy.sort((a, b) => b.score - a.score || (b.newestAt || "").localeCompare(a.newestAt || ""));
  return copy;
}

// "All" is labelled "All important" in the UI: tier 1-2 stories only.
// Sports and Entertainment are secondary and reachable via their own filter
// (or by searching for them explicitly).
export const FILTERS = ["All", "India", "Politics", "Government & Policy", "Economy", "World", "Science & Tech", "Business", "Security", "Environment", "Sports", "Entertainment"];
export const FILTER_LABEL = { All: "All important" };

export function matchesFilter(item, filter) {
  if (!filter || filter === "All") return item.tier <= 2;
  if (filter === "Sports" || filter === "Entertainment") return item.topic === filter;
  if (item.tier > 2) return false;
  if (filter === "India" || filter === "World") return item.region === filter;
  return item.topic === filter || item.secondaryTopic === filter;
}

/** Filter + search. A typed query searches every tier, so "cricket" still finds cricket. */
export function applyView(items, { filter = "All", query = "" } = {}) {
  const base = (query || "").trim() ? items.filter((it) => filter === "All" || matchesFilter(it, filter)) : items.filter((it) => matchesFilter(it, filter));
  return searchItems(base, query);
}
