import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Guards against a copy/paste mix-up where one route's file ends up holding
// another route's code (this happened once: the homepage served the
// Politicians page).
const expected = {
  "app/page.js": "Home",
  "app/politicians/page.js": "PoliticiansPage",
  "app/current-affairs/page.js": "CurrentAffairsPage",
  "app/issue-watch/page.js": "IssueWatchPage",
  "app/brief/page.js": "BriefPage",
  "app/elections/page.js": "ElectionsPage",
  "app/evidence/page.js": "EvidencePage",
  "app/attention/page.js": "AttentionPage",
};

for (const [file, fn] of Object.entries(expected)) {
  test(`${file} exports ${fn}`, () => {
    const src = readFileSync(new URL(`../../${file}`, import.meta.url), "utf8");
    assert.match(src, new RegExp(`export default (async )?function ${fn}\\b`));
  });
}

test("homepage is not the Politicians page", () => {
  const src = readFileSync(new URL("../../app/page.js", import.meta.url), "utf8");
  assert.doesNotMatch(src, /PoliticiansPage/);
  assert.match(src, /TodaysBrief/);
});
