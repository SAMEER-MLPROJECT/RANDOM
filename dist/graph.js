import data from "./graph-data.js";
import { assets, mean, network, returns, sd, tape } from "./market.js";

const regimeNames = [
  "Bullish trend",
  "Bearish trend",
  "Mean reversion",
  "High volatility",
  "Low volatility",
];
const deviation = [0.005, 0.006, 0.0055, 0.017, 0.0025];
const drift = [0.0022, -0.0026, 0, 0, 0];
const size = assets.length;
const threshold = 0.52;

function normalCDF(z) {
  const a = Math.abs(z);
  const t = 1 / (1 + 0.2316419 * a);
  const p =
    t *
    (0.31938153 +
      t *
        (-0.356563782 +
          t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const survival = (Math.exp(-0.5 * a * a) / Math.sqrt(2 * Math.PI)) * p;
  return z < 0 ? survival : 1 - survival;
}

// This diagnostic retains the original three-state tape and archived decision snapshots.
export function regimeFilter(source) {
  const history = [{ prob: Array(5).fill(0.2), ret: 0, covered: 0 }];
  return function five(day) {
    if (!Number.isInteger(day) || day < 0)
      throw new RangeError("Invalid regime cutoff");
    while (history.length <= day) {
      const k = history.length;
      const prev = history[k - 1];
      const ret = source.at(k).idx / source.at(k - 1).idx - 1;
      const prior = prev.prob.map((p) => 0.94 * p + 0.015 * (1 - p));
      let predictiveCDF = 0;
      const logPosterior = deviation.map((s, j) => {
        const loc = j === 2 ? -0.55 * prev.ret : drift[j];
        const z = (ret - loc) / s;
        predictiveCDF += prior[j] * normalCDF(z);
        return Math.log(prior[j]) - Math.log(s) - 0.5 * z * z;
      });
      const max = Math.max(...logPosterior);
      const unscaled = logPosterior.map((x) => Math.exp(x - max));
      const norm = unscaled.reduce((s, x) => s + x, 0);
      history.push({
        prob: unscaled.map((x) => x / norm),
        ret,
        covered:
          prev.covered + Number(predictiveCDF >= 0.05 && predictiveCDF <= 0.95),
      });
    }
    const state = history[day],
      n = Math.min(day, 120);
    return {
      names: [...regimeNames],
      prob: [...state.prob],
      calibration: {
        n,
        target: 0.9,
        coverage: n ? (state.covered - history[day - n].covered) / n : null,
        stateLabels: false,
      },
    };
  };
}
export const fiveRegimes = regimeFilter(tape);

function externalPath(n) {
  if (n <= 2) return n === 2 ? 1 : 0;
  return 2 * (Math.log(n - 1) + 0.5772156649015329) - (2 * (n - 1)) / n;
}
function scorePair(features) {
  // scikit-learn scores use float32 features, averaged isolation depths, and c(n).
  const f = features.map(Math.fround);
  const length = mean(
    data.trees.map((tree) => {
      let k = 0,
        depth = 0;
      while (tree[k][0] !== -1) {
        const [left, right, index, split] = tree[k];
        k = f[index] <= split ? left : right;
        depth++;
      }
      return depth + externalPath(tree[k][4]);
    }),
  );
  return 2 ** (-length / externalPath(data.samples));
}

const pairCount = (n) => (n * (n - 1)) / 2;
export function adjustedRand(a, b) {
  let sameA = 0,
    sameB = 0,
    sameBoth = 0;
  for (let i = 0; i < a.length; i++)
    for (let j = i + 1; j < a.length; j++) {
      const x = a[i] === a[j],
        y = b[i] === b[j];
      sameA += Number(x);
      sameB += Number(y);
      sameBoth += Number(x && y);
    }
  const expected = (sameA * sameB) / pairCount(a.length);
  const denom = (sameA + sameB) / 2 - expected;
  return denom === 0 ? 1 : (sameBoth - expected) / denom;
}

function exactGroups(edges) {
  // Only eight assets. Enumerate unique set partitions to maximize modularity beyond the export horizon.
  const degrees = Array(size).fill(0),
    adj = Array.from({ length: size }, () => Array(size).fill(0));
  let total = 0;
  for (const { i, j, weight } of edges) {
    degrees[i] += weight;
    degrees[j] += weight;
    adj[i][j] = weight;
    total += weight;
  }
  if (!total) return assets.map((a) => a.i);
  const gain = adj.map((row, i) =>
    row.map((w, j) => w - (degrees[i] * degrees[j]) / (2 * total)),
  );
  let bestValue = -Infinity,
    best = [];
  const group = [0];
  function visit(node, hi, value) {
    if (node === size) {
      if (value > bestValue + 1e-12) {
        bestValue = value;
        best = [...group];
      }
      return;
    }
    for (let label = 0; label <= hi + 1; label++) {
      let extra = 0;
      for (let j = 0; j < node; j++)
        if (label === group[j]) extra += gain[j][node];
      group[node] = label;
      visit(node + 1, Math.max(label, hi), value + extra);
    }
  }
  visit(1, 0, 0);
  return best.map((label) => best.indexOf(label));
}
function partition(day, edges) {
  if (day >= data.first && day <= data.last)
    return [...data.groups[day - data.first]];
  return exactGroups(
    edges || network(day).edges.filter((e) => e.weight >= threshold),
  );
}
const graphs = new Map();
export function graphIntel(day) {
  if (!Number.isInteger(day) || day < 90)
    throw new RangeError("Graph requires 90 observed closes");
  if (graphs.has(day)) return graphs.get(day);
  const pairs = network(day).edges,
    edges = pairs.filter((e) => e.weight >= threshold);
  const groups = partition(day, edges),
    centrality = assets.map(
      (a) =>
        edges.reduce(
          (t, e) => t + (e.i === a.i || e.j === a.i ? e.weight : 0),
          0,
        ) /
        (size - 1),
    );
  const scores =
    day > data.trainEnd
      ? pairs.map((e) => ({
          i: e.i,
          j: e.j,
          score: scorePair([e.weight, e.weight - e.delta, e.delta, e.shiftZ]),
        }))
      : [];
  const anomalies = scores
    .filter((e) => e.score > data.cutoff)
    .sort((a, b) => b.score - a.score);
  const result = {
    groups,
    centrality,
    edges,
    stability: day >= 135 ? adjustedRand(groups, partition(day - 45)) : null,
    cutoff: day,
    method:
      day >= data.first && day <= data.last
        ? "NetworkX Louvain"
        : "Exact modularity",
    scores,
    anomalies,
    forestThreshold: data.cutoff,
    forestTrainedThrough: data.trainEnd,
  };
  if (graphs.size >= 256) graphs.delete(graphs.keys().next().value);
  graphs.set(day, result);
  return result;
}

export function cappedUtility(scenarioReturns, caps, lambda = 0.25) {
  if (
    caps.length !== scenarioReturns.length ||
    !caps.length ||
    caps.some((x) => !Number.isFinite(x) || x < 0) ||
    caps.reduce((s, x) => s + x, 0) < 1 - 1e-10
  )
    throw new RangeError("Infeasible probability caps");
  const sorted = scenarioReturns
    .map((ret, i) => ({ ret, cap: caps[i] }))
    .sort((a, b) => a.ret - b.ret);
  let remaining = 1,
    tailMass = 0.05,
    worstMean = 0,
    es = 0;
  for (const { ret, cap } of sorted) {
    const mass = Math.min(remaining, cap),
      t = Math.min(tailMass, mass);
    worstMean += mass * ret;
    es -= (t * ret) / 0.05;
    remaining -= mass;
    tailMass -= t;
    if (remaining <= 0) break;
  }
  return { worstMean, robustES: es, utility: worstMean - lambda * es };
}

export function allocationStudy(day, exposure = 0.6) {
  if (!Number.isFinite(exposure) || exposure < 0 || exposure > 1)
    throw new RangeError("Exposure must lie between zero and one");
  const graph = graphIntel(day),
    r = returns(day, 120),
    n = r.length;
  const now = fiveRegimes(day).prob;
  const density = graph.edges.length / pairCount(size);
  const kappa = 1 + now[3] + density;
  const affinity = r.map((row, j) => {
    // State at session open, before the aligned close-to-close return.
    const p = fiveRegimes(day - n + j).prob;
    return 0.5 + p.reduce((sum, x, i) => sum + x * now[i], 0);
  });
  const norm = affinity.reduce((a, b) => a + b);
  const caps = affinity.map((x) => Math.max(1 / n, (kappa * x) / norm));
  const inv = assets.map(
    (a) => 1 / Math.max(0.0001, sd(r.map((row) => row[a.i]))),
  );
  const total = inv.reduce((a, b) => a + b),
    labels = graph.groups,
    groups = new Set(labels);
  const weights = [
    ["Equal weight", assets.map(() => exposure / size)],
    ["Inverse volatility", inv.map((x) => (exposure * x) / total)],
    [
      "Community balanced",
      inv.map(
        (x, i) =>
          ((exposure / groups.size) * x) /
          inv.reduce((v, w, k) => v + (labels[k] === labels[i] ? w : 0), 0),
      ),
    ],
  ];
  const candidates = weights.map(([name, w]) => {
    const series = r.map((row) => row.reduce((v, x, k) => v + x * w[k], 0));
    const nominalES = cappedUtility(series, Array(n).fill(1 / n)).robustES;
    return { name, weights: w, nominalES, ...cappedUtility(series, caps) };
  });
  return {
    kappa,
    density,
    exposure,
    lambda: 0.25,
    n,
    candidates,
    best: candidates.reduce((a, b) => (b.utility > a.utility ? b : a)),
  };
}
