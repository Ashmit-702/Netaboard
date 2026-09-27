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

export const FILTERS = ["All", "India", "Politics", "Economy", "World", "Science & Tech", "Business", "Security", "Environment", "Sports", "Government & Policy"];

export function matchesFilter(item, filter) {
  if (!filter || filter === "All") return true;
  if (filter === "India" || filter === "World") return item.region === filter;
  return item.topic === filter || item.secondaryTopic === filter;
}
