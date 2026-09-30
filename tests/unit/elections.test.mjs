import test from "node:test";
import assert from "node:assert/strict";
import { classifyElection, groupElections, selectElectionWatch, STATE_ORDER } from "../../lib/elections/classify.js";

const DAY = 86400000;
const NOW = Date.parse("2026-09-29T10:00:00Z");
const iso = (offsetDays) => new Date(NOW + offsetDays * DAY).toISOString().slice(0, 10);

const base = (over = {}) => ({
  id: "e1", name: "Test Election", region: "Test Region", election_date: iso(10),
  status: "upcoming", data_status: "upcoming", is_demo: false, is_archived: false,
  last_updated_at: new Date(NOW).toISOString(), ...over,
});

test("a real future-dated row with status/data_status='upcoming' classifies UPCOMING — independent of any prediction", () => {
  const c = classifyElection(base(), { now: NOW, hasPredictions: false, hasResults: false });
  assert.equal(c.state, "UPCOMING");
  assert.equal(c.hasPredictions, false);
  assert.ok(c.daysUntil > 0);
});

test("UPCOMING does not require a prediction to appear — Elections and Predictions are decoupled", () => {
  const withPred = classifyElection(base(), { now: NOW, hasPredictions: true });
  const withoutPred = classifyElection(base(), { now: NOW, hasPredictions: false });
  assert.equal(withPred.state, "UPCOMING");
  assert.equal(withoutPred.state, "UPCOMING");
});

test("is_demo rows are excluded outright (classifyElection returns null)", () => {
  assert.equal(classifyElection(base({ is_demo: true }), { now: NOW }), null);
});

test("is_archived rows classify ARCHIVE even if the date is in the future", () => {
  const c = classifyElection(base({ is_archived: true }), { now: NOW });
  assert.equal(c.state, "ARCHIVE");
});

test("a live/in-progress election classifies LIVE regardless of the raw date math", () => {
  const c = classifyElection(base({ status: "live", data_status: "live", election_date: iso(0) }), { now: NOW });
  assert.equal(c.state, "LIVE");
});

test("a concluded election with a declared result classifies RESULTS, and RECENT within 30 days", () => {
  const c = classifyElection(base({ status: "concluded", data_status: "results", election_date: iso(-5) }), { now: NOW, hasResults: true });
  assert.equal(c.state, "RESULTS");
  assert.equal(c.recent, true);
});

test("an old concluded election (>365 days) is reclassified ARCHIVE, never RESULTS forever", () => {
  const c = classifyElection(base({ status: "concluded", data_status: "results", election_date: iso(-400) }), { now: NOW });
  assert.equal(c.state, "ARCHIVE");
});

test("an 'upcoming' row whose date has already passed with no result becomes NOT_ENOUGH_DATA, not a stale UPCOMING", () => {
  const c = classifyElection(base({ election_date: iso(-10) }), { now: NOW });
  assert.equal(c.state, "NOT_ENOUGH_DATA");
});

test("groupElections never mixes years/elections within a state, and sorts UPCOMING soonest-first", () => {
  const soon = classifyElection(base({ id: "a", election_date: iso(5) }), { now: NOW });
  const later = classifyElection(base({ id: "b", election_date: iso(50) }), { now: NOW });
  const groups = groupElections([later, soon]);
  assert.deepEqual(groups.UPCOMING.map((e) => e.id), ["a", "b"]);
  for (const s of STATE_ORDER) assert.ok(Array.isArray(groups[s]));
});

test("selectElectionWatch prefers LIVE, then RECENT results with data, then near-term UPCOMING (<=120 days) — never forces a stale one", () => {
  const upcomingFar = classifyElection(base({ id: "far", election_date: iso(200) }), { now: NOW });
  assert.equal(selectElectionWatch([upcomingFar]), null, "an election 200 days out must not be forced onto the homepage");

  const upcomingNear = classifyElection(base({ id: "near", election_date: iso(30) }), { now: NOW });
  assert.equal(selectElectionWatch([upcomingFar, upcomingNear]).id, "near");

  const live = classifyElection(base({ id: "live", status: "live", data_status: "live", election_date: iso(0) }), { now: NOW });
  assert.equal(selectElectionWatch([upcomingNear, live]).id, "live", "LIVE always wins over UPCOMING");

  const archived = classifyElection(base({ id: "old", is_archived: true }), { now: NOW });
  assert.equal(selectElectionWatch([archived]), null, "archive is never forced onto the homepage");
});

test("an empty election set never fabricates a watch entry", () => {
  assert.equal(selectElectionWatch([]), null);
});
