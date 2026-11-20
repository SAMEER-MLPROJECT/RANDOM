import assert from "node:assert/strict";
import test from "node:test";
import {
  account,
  place,
  cancel,
  projected,
  advance,
  quote,
  comparison,
} from "../dist/ledger.js";
import {
  book,
  indexScore,
  risk,
  tail,
  drawdown,
  foundry,
  clusters,
} from "../dist/quant.js";
import {
  START,
  tape,
  assets,
  makeTape,
  calibration,
  mean,
  sd,
  round,
  corr,
} from "../dist/market.js";
const buy = (i = 0, q = 10) => ({
  i,
  q,
  side: "Buy",
  type: "Market",
  trigger: null,
});
const sell = (i = 0, q = 10) => ({ ...buy(i, q), side: "Sell" });
const near = (a, b, t = 1e-8) => assert.ok(Math.abs(a - b) < t, a + " != " + b);
test("cash account, unavailable scores and separate shadow ledger", () => {
  const s = account();
  assert.equal(s.cash, 1e6);
  assert.equal(book(s).equity, 1e6);
  assert.equal(indexScore(s).value, null);
  assert.equal(indexScore(s).coverage, 0);
  assert.ok(s.shadow.cash < 1e6);
  assert.equal(book(s).exposure, 0);
  assert.equal(comparison(s, "equity").dd, 0);
});
test("known fees, slippage and preview with no side effects", () => {
  const s = account(),
    before = JSON.stringify(s),
    p = projected(s, buy());
  assert.equal(JSON.stringify(s), before);
  const x = quote("Buy", 10, 100);
  assert.deepEqual(x, {
    price: 100.03,
    gross: 1000.3,
    fee: 0.5,
    cost: 1000.8,
    net: 999.8,
    slip: 0.3,
  });
  place(s, buy());
  near(book(p).equity, book(s).equity);
  assert.equal(p.cash, s.cash);
  assert.deepEqual(indexScore(p), indexScore(s));
  near(book(s).weights.reduce((a, b) => a + b, 0) + s.cash / book(s).equity, 1);
});
test("weighted average, partial closes, cash conservation and full liquidation", () => {
  const s = account();
  const x = place(s, buy(0, 9));
  advance(s);
  const y = place(s, buy(0, 12));
  near(s.pos[0].basis, x.cost + y.cost);
  const avg = (x.cost + y.cost) / 21;
  const z = place(s, sell(0, 7));
  assert.equal(s.pos[0].q, 14);
  near(s.reports[0].pnl, z.net - round(avg * 7), 0.001);
  near(s.pos[0].basis / 14, avg, 0.002);
  advance(s);
  place(s, sell(0, 14));
  assert.equal(s.pos[0].basis, 0);
  assert.equal(s.pos[0].lots.length, 0);
  near(
    s.cash - 1e6,
    s.reports.reduce((v, r) => v + r.pnl, 0),
  );
  near(s.cash, book(s).equity);
});
test("invalid orders are atomic", () => {
  const s = account(),
    before = JSON.stringify(s);
  for (const o of [
    buy(0, 0),
    buy(0, 2.5),
    buy(0, 1e7),
    sell(),
    buy(99),
    { ...buy(), type: "Limit", trigger: NaN },
  ]) {
    assert.throws(() => place(s, o));
    assert.equal(JSON.stringify(s), before);
  }
});
test("conditional limit and stop lifecycle, executable prices and cancellation", () => {
  const s = account(),
    px = tape.at(START).prices[0];
  const o = place(s, { ...buy(), type: "Limit", trigger: round(px * 0.6) });
  assert.equal(o.status, "Open");
  assert.equal(s.cash, 1e6);
  cancel(s, o.id);
  advance(s);
  assert.equal(o.status, "Cancelled");
  const ready = place(s, { ...buy(), type: "Limit", trigger: round(px * 2) });
  assert.ok(ready.price <= ready.trigger);
  const stop = place(s, {
    ...sell(),
    type: "Stop-loss",
    trigger: round(tape.at(s.d).prices[0] * 1.5),
  });
  assert.equal(stop.status, "Filled");
});
test("pending fill sequence rejects unfunded inventory without corruption", () => {
  const s = account();
  place(s, buy());
  const rows = tape.window(s.d, 1);
  const p = rows[0].prices[0];
  let k = s.d + 1;
  while (tape.at(k).prices[0] >= p) k++;
  const trig = tape.at(k).prices[0];
  const a = place(s, { ...sell(), type: "Stop-loss", trigger: trig }),
    b = place(s, { ...sell(), type: "Stop-loss", trigger: trig });
  while (s.d < k) advance(s);
  assert.equal(a.status, "Filled");
  assert.equal(b.status, "Rejected");
  assert.equal(s.pos[0].q, 0);
  assert.equal(s.reports.length, 1);
});
test("entry thesis and retrospective alternatives remain separate", () => {
  const s = account();
  const p = tape.at(s.d).prices[0];
  let j = s.d + 1;
  while (tape.at(j).prices[0] <= p) j++;
  const o = place(s, {
    ...buy(),
    type: "Stop-loss",
    trigger: tape.at(j).prices[0],
  });
  const frozen = structuredClone(o.thesis);
  while (o.status === "Open") advance(s);
  assert.deepEqual(o.thesis, frozen);
  const filled = structuredClone(o.snap);
  advance(s);
  place(s, sell());
  const r = s.reports[0];
  assert.equal(r.quality, frozen.quality);
  assert.equal(r.entryQuality, filled.quality);
  assert.deepEqual(r.prob, filled.prob);
  assert.equal(r.alternatives[0].pnl, r.pnl);
  assert.equal(r.alternatives.at(-1).pnl, 0);
  assert.equal(r.alternatives[1].pnl, round(r.pnl / 2));
  assert.ok(r.regret >= 0);
  assert.ok(r.fees > 0);
});
test("historic and robust expected shortfall have exact fractional tail weights", () => {
  near(tail([0.1, 0.08, 0.04, 0.01], 0.625), (0.1 + 0.08 + 0.02) / 2.5);
  near(tail([0.1, 0.08, 0.04, 0.01], 0.125), 0.1);
  const s = account();
  place(s, buy(0, 100));
  const r = risk(book(s).weights, s.d);
  assert.ok(r.rob >= r.es && r.es >= r.var);
  near(drawdown([100, 125, 75, 110]), 0.4);
  assert.equal(
    risk(
      assets.map(() => 0),
      s.d,
    ).vol,
    0,
  );
  assert.ok(clusters(s, 0).cluster >= book(s).weights[0]);
});
test("index normalization, configurable weights, missing-data renormalization", () => {
  const s = account();
  place(s, buy());
  let idx = indexScore(s);
  assert.equal(idx.coverage, 0.9);
  assert.ok(idx.parts.every((x) => x === null || (x >= 0 && x <= 100)));
  s.weights = [0, 0, 0, 100, 0];
  near(indexScore(s).value, idx.parts[3]);
  s.weights = [0, 0, 0, 0, 100];
  assert.equal(indexScore(s).value, null);
  s.foundry = { stability: 62 };
  assert.equal(indexScore(s).value, 62);
});
test("block simulation reproducibility, intervals and strategy controls", () => {
  const f = foundry(START, 0, 15, "Momentum"),
    g = foundry(START, 0, 15, "Momentum");
  assert.deepEqual(f, g);
  assert.equal(f.paths, 300);
  assert.equal(f.n, 120);
  assert.ok(f.lo <= f.median && f.median <= f.hi);
  assert.ok(f.ci[0] <= f.pos && f.ci[1] >= f.pos);
  assert.ok(f.badDD >= f.dd);
  assert.ok(
    foundry(START, 0, 15, "Momentum", 0.0025).historical <= f.historical,
  );
  assert.equal(
    foundry(START, 0, 15, "Hold").sweep[0].ret,
    foundry(START, 0, 15, "Hold").sweep[2].ret,
  );
});
test("no future observation affects decision-time portfolio or order preview", () => {
  const s = account();
  const expected = projected(s, buy()).orders.at(-1).snap;
  const future = tape.at(START + 1),
    prior = future.prices;
  try {
    future.prices = prior.map((x) => x * 4);
    assert.deepEqual(projected(s, buy()).orders.at(-1).snap, expected);
  } finally {
    future.prices = prior;
  }
});
test("filter probability, reproducibility and independent synthetic calibration", () => {
  for (const seed of [13, 23, 33, 43]) {
    const a = makeTape(seed),
      b = makeTape(seed);
    assert.deepEqual(a.at(220), b.at(220));
    near(
      a.at(220).prob.reduce((a, b) => a + b),
      1,
    );
    const c = calibration(220, a);
    assert.ok(c.brier < 2 / 3);
    assert.equal(
      c.bins.reduce((n, x) => n + x[0], 0),
      120,
    );
  }
  near(corr([1, 2, 3], [6, 4, 2]), -1);
  near(mean([1, 2, 3]), 2);
  near(sd([1, 2, 3]), 1);
});
test("shadow and account history are sequential and reproducible on reload", () => {
  const s = account(),
    p = JSON.parse(JSON.stringify(s));
  place(s, buy());
  for (let i = 0; i < 12; i++) {
    advance(s);
    advance(p);
  }
  assert.deepEqual(s.shadow, p.shadow);
  assert.equal(s.history.length, 13);
  assert.ok(book(s.shadow).weights.every((x) => x >= 0));
  assert.ok(s.shadow.cash >= 0);
  assert.deepEqual(
    s.history.map((x) => x.shadow),
    p.history.map((x) => x.shadow),
  );
});
test("pending limit preview respects executable bound and reprices the hypothetical holding", () => {
  const s = account(),
    o = { ...buy(0, 10), type: "Limit", trigger: 10 };
  const next = projected(s, o);
  assert.equal(next.orders.at(-1).price, 10);
  assert.ok(book(next).equity < 1e6);
  assert.ok(Math.abs(book(next).equity - 1e6) < 1);
  assert.equal(s.scenarioPrices, undefined);
});
