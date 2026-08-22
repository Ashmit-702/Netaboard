// AI models default to markdown even when told not to — bold asterisks,
// pipe tables, header hashes. This app renders plain text, not markdown, so
// anything that slips through gets cleaned here before it reaches the
// browser. Belt-and-suspenders alongside the "plain prose only" instruction
// in every system prompt in lib/ai.js callers.
export function cleanAIText(text) {
  if (!text) return text;
  let out = text;

  // A markdown table has no clean plain-text equivalent, so rows are
  // flattened into "cell — cell — cell" lines instead of showing raw pipes.
  out = out.replace(/(^\|.+\|\r?\n)+/gm, (block) => {
    const rows = block.trim().split("\n")
      .map((r) => r.split("|").map((c) => c.trim()).filter(Boolean))
      .filter((cells) => !cells.every((c) => /^-+$/.test(c))); // drop the |---|---| separator row
    return rows.map((cells) => cells.join(" — ")).join("\n") + "\n";
  });

  out = out
    .replace(/\*\*(.+?)\*\*/g, "$1")   // **bold** -> bold
    .replace(/\*(.+?)\*/g, "$1")        // *italic* -> italic
    .replace(/^#{1,6}\s*/gm, "")        // ## Header -> Header
    .replace(/^[-*]\s+/gm, "• ")        // - item / * item -> • item
    .replace(/`([^`]+)`/g, "$1")        // `code` -> code
    .replace(/\n{3,}/g, "\n\n")         // collapse excess blank lines
    .trim();

  return out;
}
