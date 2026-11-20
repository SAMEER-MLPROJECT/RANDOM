import { test } from "node:test";
import assert from "node:assert/strict";
import {
  channels,
  eventsAt,
  resolve,
  extract,
  evidenceScore,
  importBatch,
} from "../dist/oracle.js";
import {
  propose,
  evaluate,
  testHypothesis,
  adjustBY,
  experimentSnapshot,
} from "../dist/ahead.js";
import { place, account, advance } from "../dist/ledger.js";
import { tape } from "../dist/market.js";
import { createAdapters } from "../server/adapters.mjs";
import { readFile } from "node:fs/promises";
const es = eventsAt(180),
  event = es[0],
  h = () => propose(event, es, 180);
test("entity resolution uses approved relationships and rejects ambiguous names", () => {
  assert.equal(resolve("Lumen Components bulletin").asset, 0);
  assert.equal(resolve("Vyraa Systems"), null);
  assert.equal(resolve("Vyra Systems and Kora Financial"), null);
  assert.equal(
    extract({
      ...event.sources[0],
      text: "VYRA announces its annual meeting.",
    }),
    null,
  );
});
test("connectors filter by vintage, independent switches and contradiction", () => {
  assert.ok(es.every((e) => e.sources.every((x) => x.observed <= 180)));
  assert.equal(eventsAt(180, []).length, 0);
  assert.ok(eventsAt(180, ["corporate"]).every((e) => e.sources.length === 1));
  assert.ok(
    eventsAt(181)
      .find((e) => e.id === "supply-180")
      .sources.some((r) => r.channel === "infrastructure"),
  );
  const later = eventsAt(169).find((e) => e.day === 168);
  assert.ok(later.sources.some((r) => r.stance === "contradicts"));
  assert.equal(Object.keys(channels).length, 5);
});
test("syndication cannot inflate independent source score; contradiction reduces it", () => {
  const r = event.sources[0],
    base = evidenceScore({ sources: [r] });
  const repeated = evidenceScore({
    sources: [r, { ...r, id: "new", channel: "social" }],
  });
  assert.equal(base.value, repeated.value);
  assert.equal(repeated.independent, 1);
  assert.ok(
    evidenceScore({
      sources: [r, { ...r, origin: "different", stance: "contradicts" }],
    }).value < base.value,
  );
});
test("fixture import validates dates and IDs, is atomic and idempotent", async () => {
  const raw = await readFile(
    new URL("../dist/sample-observations.json", import.meta.url),
    "utf8",
  );
  const records = importBatch(raw, 180);
  assert.deepEqual(importBatch(raw, 180, records), records);
  assert.throws(() => importBatch(raw, 179));
  assert.throws(() => importBatch(raw.replace("depot", "site"), 180, records));
  assert.throws(() =>
    importBatch(raw.replace("Lumen Components", "Vyraa Components"), 180),
  );
  assert.equal(
    eventsAt(180, undefined, records)[0].sources.length,
    event.sources.length + 1,
  );
});
test("nine mature cases, sign-flip and multiplicity correction reproduce from bounded tape", () => {
  const study = h();
  const bounded = {
    at(d) {
      assert.ok(d <= 180);
      return tape.at(d);
    },
  };
  const r = evaluate(study, bounded);
  assert.equal(r.n, 9);
  assert.equal(r.p, 52 / 512);
  assert.equal(r.status, "INCONCLUSIVE");
  assert.ok(Math.abs(r.q - 0.55859375) < 1e-12);
  assert.ok(r.sample.every((v) => v.t + 5 <= 180));
  assert.deepEqual(evaluate(study), r);
  assert.ok(
    adjustBY([0.01, 0.02, 1]).every(
      (x, i) => Math.abs(x - [0.055, 0.055, 1][i]) < 1e-12,
    ),
  );
});
test("missing samples and ambiguous evidence cannot earn support", () => {
  const proposal = h();
  proposal.vintage = [];
  const r = evaluate(proposal);
  assert.equal(r.status, "INCONCLUSIVE");
  assert.equal(r.ci, null);
  assert.throws(() => propose({ ...event, sources: [] }, es, 180));
  assert.throws(() => experimentSnapshot(proposal));
});
test("proposal audit, research attribution and shadow survive paper execution", () => {
  const proposal = h(),
    s = account();
  testHypothesis(proposal, 180);
  assert.throws(() => testHypothesis(proposal, 182));
  const snapshot = experimentSnapshot(proposal),
    buy = { i: 0, side: "Buy", type: "Market", q: 4, experiment: snapshot };
  place(s, buy);
  advance(s);
  proposal.status = "INVALIDATED";
  assert.throws(() => experimentSnapshot(proposal));
  place(s, { i: 0, side: "Sell", type: "Market", q: 2 });
  assert.equal(s.reports[0].experiments[0].status, "INCONCLUSIVE");
  assert.equal(s.reports[0].experiments[0].event, event.id);
  assert.ok(s.reports[0].allocation > 0);
  assert.deepEqual(
    proposal.log.map((x) => x.status),
    ["PROPOSED", "TESTING", "INCONCLUSIVE"],
  );
});
test("adapter handles disabled feeds, cache, one bounded retry and backoff", async () => {
  const row = event.sources[0],
    env = {
      QUANTARA_CORPORATE_URL: "https://fixtures.example/demo",
      QUANTARA_CORPORATE_LICENSE: "Synthetic fixture",
    };
  let tries = 0;
  const a = createAdapters(
    env,
    async () =>
      ++tries === 1 ? new Response("", { status: 503 }) : Response.json([row]),
    () => 1000,
    async () => {},
  );
  assert.equal((await a.feed("corporate")).rows.length, 1);
  await a.feed("corporate");
  assert.equal(tries, 2);
  await assert.rejects(() => a.feed("social"));
  let requests = 0;
  const b = createAdapters(env, async () => {
    requests++;
    return new Response("", { status: 429, headers: { "Retry-After": "60" } });
  });
  await assert.rejects(() => b.feed("corporate"));
  await assert.rejects(() => b.feed("corporate"));
  assert.equal(requests, 1);
});
test("model proposes only a bounded question; missing access and malformed results fail closed", async () => {
  const env = {
    QUANTARA_MODEL_URL: "https://model.example/generate",
    QUANTARA_MODEL_NAME: "mock",
  };
  await assert.rejects(() => createAdapters({}).question("supply"));
  const fake = (q) =>
    createAdapters(env, async () =>
      Response.json({ choices: [{ message: { content: q } }] }),
    );
  const q =
    "Does the matched peer show lower volatility over the five sessions?";
  assert.equal((await fake(q).question("supply")).question, q);
  await assert.rejects(() => fake("Significant?").question("supply"));
});
