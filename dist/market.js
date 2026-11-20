export const assets = [
  ["VYRA", "Vyra Systems", "Technology", 1840, "#9f83f6"],
  ["KORA", "Kora Financial", "Finance", 1260, "#58b0ed"],
  ["ORBN", "Orbiton Energy", "Energy", 890, "#eb9974"],
  ["ARCL", "Arclight Labs", "Technology", 2120, "#5dc9bb"],
  ["VELA", "Vela Motors", "Industrials", 738, "#cca66f"],
  ["NVIA", "Novia Health", "Healthcare", 1630, "#d48caf"],
  ["MERA", "Meridian Bank", "Finance", 960, "#86a6f4"],
  ["SOLN", "Solenne Power", "Energy", 1130, "#c3cd7e"],
].map(([sym, name, sector, base, color], i) => ({
  sym,
  name,
  sector,
  base,
  color,
  i,
}));
export const START = 180,
  names = ["Bullish trend", "Bearish trend", "High volatility"];
export const mean = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
export const sd = (a) =>
  Math.sqrt(
    a.reduce((s, x) => s + (x - meanFast(a)) ** 2, 0) /
      Math.max(1, a.length - 1),
  );
const means = new WeakMap();
function meanFast(a) {
  if (!means.has(a)) means.set(a, mean(a));
  return means.get(a);
}
export const round = (x) => Math.round((x + Number.EPSILON) * 100) / 100;
export function rng(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return (seed + 0.5) / 4294967296;
  };
}
const transition = [
  [0.967, 0.02, 0.013],
  [0.04, 0.94, 0.02],
  [0.055, 0.035, 0.91],
];
const mu = [0.0022, -0.0026, 0],
  sigma = [0.005, 0.006, 0.017];
export function makeTape(seed = 27041) {
  const random = rng(seed),
    normal = () =>
      Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random());
  let latent = 0,
    prob = [1 / 3, 1 / 3, 1 / 3],
    date = new Date("2025-03-14T00:00:00Z");
  const rows = [
    {
      date: date.toISOString().slice(0, 10),
      idx: 1000,
      prices: assets.map((a) => a.base),
      bars: assets.map((a) => [a.base, a.base, a.base, a.base]),
      prob: [...prob],
      latent,
    },
  ];
  function at(d) {
    if (!Number.isInteger(d) || d < 0) throw Error("Invalid session");
    while (rows.length <= d) {
      const prev = rows.at(-1),
        u = random(),
        t = transition[latent];
      latent = u < t[0] ? 0 : u < t[0] + t[1] ? 1 : 2;
      const ret = mu[latent] + sigma[latent] * normal(),
        sector = Object.fromEntries(
          [...new Set(assets.map((a) => a.sector))].map((s) => [
            s,
            0.006 * normal(),
          ]),
        );
      const bars = assets.map((a, i) => {
        const old = prev.prices[i],
          o = Math.max(0.01, round(old * (1 + 0.0015 * normal()))),
          c = Math.max(
            0.01,
            round(old * (1 + ret + sector[a.sector] + 0.006 * normal())),
          );
        return [
          o,
          round(Math.max(o, c) * (1 + 0.003 * random())),
          Math.max(0.01, round(Math.min(o, c) * (1 - 0.003 * random()))),
          c,
        ];
      });
      const posterior = mu.map(
        (m, j) =>
          (prob.reduce((v, p, i) => v + p * transition[i][j], 0) *
            Math.exp(-0.5 * ((ret - m) / sigma[j]) ** 2)) /
          sigma[j],
      );
      const total = posterior.reduce((a, b) => a + b);
      prob = posterior.map((p) => p / total);
      do {
        date.setUTCDate(date.getUTCDate() + 1);
      } while ([0, 6].includes(date.getUTCDay()));
      rows.push({
        date: date.toISOString().slice(0, 10),
        idx: prev.idx * (1 + ret),
        bars,
        prices: bars.map((b) => b[3]),
        prob: [...prob],
        latent,
      });
    }
    return rows[d];
  }
  return {
    at,
    window: (d, n) => {
      at(d);
      return rows.slice(Math.max(0, d - n + 1), d + 1);
    },
  };
}
export const tape = makeTape();
export function returns(d, n = 120) {
  const rows = tape.window(d, n + 1);
  return rows
    .slice(1)
    .map((r, k) => r.prices.map((p, i) => p / rows[k].prices[i] - 1));
}
export function corr(a, b) {
  const ma = mean(a),
    mb = mean(b);
  let v = 0,
    x = 0,
    y = 0;
  for (let i = 0; i < a.length; i++) {
    v += (a[i] - ma) * (b[i] - mb);
    x += (a[i] - ma) ** 2;
    y += (b[i] - mb) ** 2;
  }
  return x * y ? v / Math.sqrt(x * y) : 0;
}
export function network(d) {
  const rets = returns(d, 90),
    columns = assets.map((a) => rets.map((r) => r[a.i])),
    edges = [],
    group = assets.map((a) => a.i);
  for (let i = 0; i < assets.length; i++)
    for (let j = i + 1; j < assets.length; j++) {
      const a = columns[i],
        b = columns[j],
        weight = corr(a.slice(-45), b.slice(-45)),
        prior = corr(a.slice(0, -45), b.slice(0, -45));
      const fisher = (x) =>
        Math.atanh(Math.max(-0.999999, Math.min(0.999999, x)));
      const shiftZ = (fisher(weight) - fisher(prior)) / Math.sqrt(2 / (45 - 3));
      edges.push({ i, j, weight, delta: weight - prior, shiftZ });
      if (weight >= 0.52) {
        const old = group[j],
          next = group[i];
        group.forEach((g, k) => {
          if (g === old) group[k] = next;
        });
      }
    }
  return { edges, group };
}
export function calibration(d, src = tape) {
  const r = src.window(d, 120),
    bins = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
  let brier = 0,
    changes = 0,
    last;
  for (const row of r) {
    const p = row.prob,
      j = p.indexOf(Math.max(...p)),
      k = p[j] < 0.6 ? 0 : p[j] < 0.8 ? 1 : 2;
    bins[k][0]++;
    bins[k][1] += p[j];
    bins[k][2] += Number(j === row.latent);
    brier += p.reduce((s, v, i) => s + (v - Number(i === row.latent)) ** 2, 0);
    if (last != null && last !== j) changes++;
    last = j;
  }
  return { brier: brier / r.length, changes, bins, n: r.length };
}
