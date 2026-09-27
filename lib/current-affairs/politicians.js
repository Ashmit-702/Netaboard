// Attach politicians to a story ONLY on a real textual match: the full name
// must literally appear in the coverage. Never inferred from role or
// context. "Mentioned repeatedly" = named in at least two of the cluster's
// articles, or in the headline of the lead article.

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

export function matchPoliticians(articles, leadTitle, roster = []) {
  const out = [];
  for (const p of roster) {
    if (!p?.name || !p?.slug) continue;
    const re = new RegExp(`\\b${escapeRe(p.name)}\\b`, "i");
    const hits = articles.filter((a) => re.test(a.title) || re.test(a.description || "")).length;
    const inLead = re.test(leadTitle || "");
    if (hits >= 2 || inLead) out.push({ name: p.name, slug: p.slug, mentions: hits });
  }
  return out.sort((a, b) => b.mentions - a.mentions);
}
