import test from "node:test";
import assert from "node:assert/strict";
import data from "../dist/graph-data.js";
import { assets } from "../dist/market.js";
import {
  adjustedRand,
  allocationStudy,
  cappedUtility,
  fiveRegimes,
  graphIntel,
  regimeFilter,
} from "../dist/graph.js";

const near = (a, b, eps = 1e-9) =>
  assert.ok(Math.abs(a - b) <= eps, `${a} differs from ${b}`);
test("five-state filter reads only observed prices and preserves probability mass", () => {
  const requested = [],
    source = {
      at: (d) => {
        requested.push(d);
        return { idx: 100 + Math.cos(d / 2) };
      },
    },
    filter = regimeFilter(source);
  const first = filter(90);
  assert.equal(Math.max(...requested), 90);
  assert.equal(first.prob.length, 5);
  near(
    first.prob.reduce((a, b) => a + b),
    1,
  );
  assert.ok(first.prob.every((x) => x >= 0));
  filter(105);
  assert.deepEqual(filter(90), first);
  assert.equal(filter(0).calibration.coverage, null);
  assert.deepEqual(fiveRegimes(180).calibration, {
    n: 120,
    target: 0.9,
    coverage: 0.9,
    stateLabels: false,
  });
});
test("graph partitions match NetworkX, weighted centrality bounds and label-invariant stability", () => {
  const g = graphIntel(180);
  assert.equal(g.method, "NetworkX Louvain");
  assert.deepEqual(g.groups, [0, 1, 2, 0, 4, 5, 6, 7]);
  near(g.stability, 0.4716981132075472);
  for (const x of g.centrality) assert.ok(x >= 0 && x <= 1);
  assert.ok(g.edges.every((e) => e.weight >= 0.52));
  near(adjustedRand([0, 0, 1, 2], [8, 8, 2, 5]), 1);
  near(adjustedRand([0, 0, 0], [5, 5, 5]), 1);
  const fallback = graphIntel(546);
  assert.equal(fallback.method, "Exact modularity");
  assert.ok(
    fallback.groups.every(
      (x) => Number.isInteger(x) && x >= 0 && x < assets.length,
    ),
  );
});
test("isolation forest is unavailable in-sample and scores match Python", () => {
  assert.equal(graphIntel(data.trainEnd).scores.length, 0);
  const g = graphIntel(180);
  assert.equal(g.scores.length, 28);
  g.scores.forEach((x, i) => near(x.score, data.refScores[i], 2e-8));
  assert.equal(g.anomalies.length, 15);
  assert.ok(g.anomalies.every((x) => x.score > g.forestThreshold));
});
test("capped distribution solves joint downside objective with fractional tail mass", () => {
  const returns = [-0.1, -0.05, 0.2],
    caps = [0.03, 0.5, 0.7];
  const x = cappedUtility(returns, caps);
  near(x.worstMean, -0.1 * 0.03 - 0.05 * 0.5 + 0.2 * 0.47);
  near(x.robustES, (0.1 * 0.03 + 0.05 * 0.02) / 0.05);
  near(x.utility, x.worstMean - 0.25 * x.robustES);
  assert.throws(() => cappedUtility([0.01, 0.02], [0.4, 0.4]));
});
test("candidate risk budgets, selection and ambiguity-set dominance reconcile", () => {
  for (const d of [180, 201, 546]) {
    const s = allocationStudy(d);
    assert.equal(s.candidates.length, 3);
    for (const c of s.candidates) {
      near(
        c.weights.reduce((a, b) => a + b),
        s.exposure,
      );
      assert.ok(c.weights.every((w) => w >= 0));
      assert.ok(c.robustES >= c.nominalES - 1e-12);
      assert.ok(s.best.utility >= c.utility);
    }
  }
  const cash = allocationStudy(180, 0);
  cash.candidates.forEach((c) => {
    near(c.robustES, 0);
    near(c.worstMean, 0);
  });
  assert.throws(() => allocationStudy(180, 1.1));
});
