// Independent matched-model check of posterior reliability on labelled synthetic paths.
import { regimeFilter } from "../dist/graph.js";
import { rng } from "../dist/market.js";

const counts = Array.from({ length: 5 }, () => ({ n: 0, hit: 0, sum: 0 }));
let brier = 0,
  total = 0,
  hits = 0,
  intervals = 0;
for (let seed = 100; seed < 120; seed++) {
  const next = rng(seed),
    normal = () =>
      Math.sqrt(-2 * Math.log(next())) * Math.cos(2 * Math.PI * next());
  const rows = [{ idx: 1000 }];
  let hidden = Math.floor(5 * next()),
    last = 0;
  const model = regimeFilter({ at: (k) => rows[k] });
  for (let t = 1; t <= 400; t++) {
    if (next() >= 0.94) {
      const k = Math.floor(next() * 4);
      hidden = k + (k >= hidden ? 1 : 0);
    }
    const mu = [0.0022, -0.0026, -0.55 * last, 0, 0][hidden];
    last = mu + [0.005, 0.006, 0.0055, 0.017, 0.0025][hidden] * normal();
    rows.push({ idx: rows.at(-1).idx * (1 + last) });
    const estimate = model(t),
      p = estimate.prob;
    if (t <= 100) continue;
    const best = p.indexOf(Math.max(...p)),
      ok = Number(best === hidden),
      bin = Math.min(4, Math.floor(p[best] * 5));
    counts[bin].n++;
    counts[bin].hit += ok;
    counts[bin].sum += p[best];
    hits += ok;
    brier += p.reduce((s, x, i) => s + (x - Number(i === hidden)) ** 2, 0);
    total++;
    // Nonoverlapping 120-session windows test predictive coverage.
    if (t === 240 || t === 360) intervals += estimate.calibration.coverage;
  }
}
console.log(
  JSON.stringify(
    {
      labelledObservations: total,
      brier: brier / total,
      topStateAccuracy: hits / total,
      nominal90Coverage: intervals / 40,
      confidenceBins: counts.map(({ n, hit, sum }) => ({
        n,
        confidence: n ? sum / n : null,
        observed: n ? hit / n : null,
      })),
    },
    null,
    2,
  ),
);
