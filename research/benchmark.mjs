// Fixed synthetic benchmark. Run from a clean checkout with Node.js 24+.
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { cpus } from "node:os";
import { assets, tape, mean, sd, returns, rng } from "../dist/market.js";
import { fiveRegimes, graphIntel } from "../dist/graph.js";
import { tail, drawdown, quantile } from "../dist/quant.js";
import { quote } from "../dist/ledger.js";
import { eventsAt, evidenceScore } from "../dist/oracle.js";

const horizon = 5;
const days = (start, count) =>
  Array.from({ length: count }, (_, i) => start + i * horizon);
const train = days(150, 58); // Last training outcome is known at close 440.
const test = days(445, 60);
const symbols = assets.map((a) => a.i);
const conditions = ["A", "B", "C", "D"];
const threshold = 0.5;
const rate = 0.35;
const epochs = 140;
const ridge = 0.08;
const capital = 1_000_000;

function sig(x) {
  return 1 / (1 + Math.exp(-x));
}
function dot(a, b) {
  return a.reduce((sum, x, j) => sum + x * b[j], 0);
}

// The whole-share estimate holds position size fixed across the binary labels.
function outcome(d, i) {
  const buy = quote("Buy", 10, tape.at(d).prices[i]);
  const sell = quote("Sell", 10, tape.at(d + horizon).prices[i]);
  return Number(sell.net > buy.cost);
}

function sourceFeatures(events, i, day, reliable) {
  const features = [0, 0, 0, 0];
  for (const event of events) {
    if (event.asset !== i || event.day > day || event.day <= day - 18) continue;
    const family = ["supply", "earnings", "operations"].indexOf(event.family);
    if (family < 0) continue;
    // Same event family channels in C/D. D applies source reliability once.
    const social = event.sources.filter((r) => r.channel === "social");
    const signed = social.reduce(
      (n, r) =>
        n + (r.stance === "supports" ? 1 : r.stance === "contradicts" ? -1 : 0),
      0,
    );
    const polarity = event.family === "earnings" ? 1 : -1;
    const decay = 1 - (day - event.day) / 18;
    features[3] += (decay * polarity * signed) / (social.length || 1);
    const raw = event.sources.length;
    const weight = reliable ? evidenceScore(event).value / 100 : raw;
    features[family] += weight * (1 - (day - event.day) / 18);
  }
  return features;
}
function features(condition, day) {
  const row = tape.at(day);
  const past = tape.at(day - 20);
  const useRisk = condition === "B" || condition === "D";
  const useEvents = condition === "C" || condition === "D";
  const events = useEvents
    ? eventsAt(day, condition === "C" ? ["social", "corporate"] : undefined)
    : [];
  const changes = useRisk ? returns(day, 120) : [];
  const columns = useRisk ? symbols.map((i) => changes.map((r) => r[i])) : [];
  const regime = condition === "D" ? fiveRegimes(day).prob : [];
  const graph = condition === "D" ? graphIntel(day) : null;
  return symbols.map((i) => {
    const x = [Math.log(row.prices[i] / past.prices[i])];
    if (useRisk) {
      const r = columns[i];
      x.push(
        sd(r),
        tail(
          r.map((v) => -v),
          0.05,
        ),
      );
    }
    if (useEvents) {
      x.push(...sourceFeatures(events, i, day, condition === "D"));
    }
    if (condition === "D") {
      x.push(
        ...regime,
        tail(
          columns[i].map((v) => -v),
          0.025,
        ),
        graph.centrality[i],
      );
    }
    assert.ok(x.every(Number.isFinite));
    return x;
  });
}
function fit(rows, labels) {
  const mu = rows[0].map((_, j) => mean(rows.map((row) => row[j])));
  const scale = mu.map((_, j) => sd(rows.map((row) => row[j])) || 1);
  const transform = (x) => [1, ...x.map((v, j) => (v - mu[j]) / scale[j])];
  const x = rows.map(transform),
    beta = Array(x[0].length).fill(0);
  for (let epoch = 0; epoch < epochs; epoch++) {
    const gradient = beta.map((v, j) => (j ? ridge * v : 0));
    x.forEach((v, k) => {
      const error = sig(dot(beta, v)) - labels[k];
      for (let j = 0; j < v.length; j++)
        gradient[j] += (error * v[j]) / x.length;
    });
    for (let j = 0; j < beta.length; j++) beta[j] -= rate * gradient[j];
  }
  return (x) => sig(dot(beta, transform(x)));
}

function trade(probabilities, cutoff = threshold, extraBps = 0) {
  let cash = capital,
    costs = 0,
    fills = 0;
  const path = [capital],
    windows = [];
  for (const [k, d] of test.entries()) {
    const begin = cash;
    const chosen = symbols
      .filter((i) => probabilities[k][i] >= cutoff)
      .sort((a, b) => probabilities[k][b] - probabilities[k][a] || a - b)
      .slice(0, 2);
    const positions = [];
    for (const i of chosen) {
      const ref = tape.at(d).prices[i];
      const budget = (0.8 * begin) / chosen.length;
      const one = quote("Buy", 1, ref);
      let q = Math.floor(budget / (one.price * (1.0005 + extraBps / 10000)));
      if (q <= 0) continue;
      const x = quote("Buy", q, ref),
        surcharge = (x.gross * extraBps) / 10000;
      cash -= x.cost + surcharge;
      costs += x.fee + x.slip + surcharge;
      positions.push({ i, q });
      fills++;
    }
    assert.ok(cash >= 0);
    for (let step = 1; step < horizon; step++) {
      path.push(
        cash +
          positions.reduce(
            (sum, { i, q }) => sum + tape.at(d + step).prices[i] * q,
            0,
          ),
      );
    }
    for (const { i, q } of positions) {
      const x = quote("Sell", q, tape.at(d + horizon).prices[i]),
        surcharge = (x.gross * extraBps) / 10000;
      cash += x.net - surcharge;
      costs += x.fee + x.slip + surcharge;
      fills++;
    }
    path.push(cash);
    windows.push(cash / begin - 1);
  }
  const daily = path.slice(1).map((v, j) => v / path[j] - 1);
  return {
    net: cash / capital - 1,
    es: tail(daily.map((v) => -v)),
    dd: drawdown(path),
    windows,
    costs,
    fills,
  };
}
function experiment(condition) {
  const started = performance.now(),
    cpuStart = process.cpuUsage();
  const rows = train.flatMap((d) => features(condition, d));
  const labels = train.flatMap((d) => symbols.map((i) => outcome(d, i)));
  const predict = fit(rows, labels);
  const inferenceStart = performance.now();
  const probabilities = test.map((d) => features(condition, d).map(predict));
  const inferenceMs = performance.now() - inferenceStart;
  const observed = test.flatMap((d) => symbols.map((i) => outcome(d, i)));
  const predictions = probabilities.flat();
  const selected = predictions.filter((p) => p >= threshold).length;
  const correct = predictions.filter(
    (p, k) => p >= threshold && observed[k],
  ).length;
  const ece = [0, 1, 2, 3, 4].reduce((sum, b) => {
    const ids = predictions
      .map((p, k) => (Math.min(4, Math.floor(5 * p)) === b ? k : -1))
      .filter((k) => k >= 0);
    return (
      sum +
      Math.abs(ids.reduce((s, k) => s + predictions[k] - observed[k], 0)) /
        predictions.length
    );
  }, 0);
  const accuracy = {
    brier: mean(predictions.map((p, k) => (p - observed[k]) ** 2)),
    ece,
    forecastPrecision: selected ? correct / selected : null,
    selected,
    correct,
    prevalence: mean(observed),
  };
  const standard = trade(probabilities);
  const perturb = [
    trade(probabilities, 0.45).net,
    trade(probabilities, 0.55).net,
    trade(probabilities, threshold, 10).net,
  ];
  const cpu = process.cpuUsage(cpuStart);
  return {
    condition,
    cpuMs: (cpu.user + cpu.system) / 1000,
    columns: rows[0].length,
    ...accuracy,
    standard,
    perturb,
    ms: performance.now() - started,
    inferenceMs,
  };
}

// Sign flips preserve contemporaneous dependence across arms. Recompute the
// entire p-value family in each injection world to retain the selection step.
const contrasts = [
  [1, 0],
  [2, 0],
  [3, 0],
  [3, 1],
  [3, 2],
];
const blockCount = 10,
  blockLength = test.length / blockCount;
const masks = Array.from({ length: 2 ** blockCount }, (_, m) =>
  Array.from({ length: blockCount }, (_, j) => (m & (1 << j) ? 1 : -1)),
);
function tests(blocks) {
  const ps = blocks.map((values) => {
    const obs = values.reduce((a, b) => a + b, 0);
    return (
      masks.filter((signs) => dot(signs, values) >= obs - 1e-12).length /
      masks.length
    );
  });
  const sorted = ps.map((p, i) => ({ p, i })).sort((a, b) => a.p - b.p);
  const q = ps.slice();
  let ceiling = 1;
  for (let j = sorted.length - 1; j >= 0; j--) {
    ceiling = Math.min(ceiling, (sorted[j].p * ps.length) / (j + 1));
    q[sorted[j].i] = ceiling;
  }
  return { p: ps, q };
}
function inference(results) {
  const blocks = contrasts.map(([a, b]) =>
    Array.from({ length: blockCount }, (_, k) => {
      const span = Array.from(
        { length: blockLength },
        (_, j) => k * blockLength + j,
      );
      return mean(
        span.map(
          (i) =>
            results[a].standard.windows[i] - results[b].standard.windows[i],
        ),
      );
    }),
  );
  const observed = tests(blocks);
  const random = rng(91586);
  const boot = blocks.map(() => []);
  for (let k = 0; k < 2000; k++) {
    const sampled = Array.from({ length: blockCount }, () =>
      Math.floor(random() * blockCount),
    );
    blocks.forEach((v, j) => boot[j].push(mean(sampled.map((b) => v[b]))));
  }
  // Synthetic sensitivity check. The same additive shift lifts D relative to
  // A, B and C, preserving the identities between their block contrasts.
  const uplift = Math.sqrt(mean(blocks[2].map((v) => v * v)));
  const diagnostics = [0, uplift].map((shift) => {
    let fdp = 0,
      precision = 0,
      power = 0,
      withCalls = 0;
    const n = 64;
    for (let k = 0; k < n; k++) {
      const signs = masks[(k * 317 + 199) % masks.length];
      const sample = blocks.map((v, c) =>
        v.map((x, b) => x * signs[b] + (c >= 2 ? shift : 0)),
      );
      const calls = tests(sample)
        .q.map((q, i) => (q <= 0.05 ? i : -1))
        .filter((i) => i >= 0);
      const hits = calls.filter((i) => shift > 0 && i >= 2).length;
      if (calls.length) {
        fdp += 1 - hits / calls.length;
        precision += hits / calls.length;
        withCalls++;
      }
      power += hits / 3;
    }
    return {
      shift,
      worlds: n,
      withCalls,
      fdr: fdp / n,
      precision: withCalls ? precision / withCalls : null,
      power: shift ? power / n : null,
    };
  });
  return {
    contrasts: contrasts.map(([a, b], i) => ({
      comparison: conditions[a] + "−" + conditions[b],
      effect: mean(blocks[i]),
      interval: [quantile(boot[i], 0.025), quantile(boot[i], 0.975)],
      p: observed.p[i],
      q: observed.q[i],
    })),
    diagnostics,
  };
}

assert.ok(train.at(-1) + horizon < test[0]);
tape.at(test.at(-1) + horizon); // Equal warm market-data access across conditions.
const results = conditions.map(experiment);
const { contrasts: paired, diagnostics } = inference(results);
const metadata = {
  seed: 27041,
  train: [train[0], train.at(-1)],
  test: [test[0], test.at(-1)],
  lastOutcome: test.at(-1) + horizon,
  trainRows: train.length * 8,
  testRows: test.length * 8,
  node: process.version,
  platform: process.platform,
  arch: process.arch,
  cpu: cpus()[0]?.model,
};
console.log(
  JSON.stringify(
    {
      metadata,
      results: results.map(({ standard, ...rest }) => {
        const { windows, ...summary } = standard;
        return { ...rest, standard: summary };
      }),
      paired,
      diagnostics,
    },
    null,
    2,
  ),
);
