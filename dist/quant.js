import { graphIntel } from "./graph.js";
import {
  assets,
  tape,
  returns,
  network,
  mean,
  sd,
  rng,
  round,
} from "./market.js";
export const clamp = (x) => Math.max(0, Math.min(100, x));
export const quantile = (a, p) => {
  const s = [...a].sort((x, y) => x - y),
    k = (s.length - 1) * p,
    i = Math.floor(k);
  return s[i] + (s[Math.ceil(k)] - s[i]) * (k - i);
};
export function tail(loss, frac = 0.05) {
  const a = [...loss].sort((x, y) => y - x),
    mass = a.length * frac;
  let sum = 0;
  for (let i = 0; i < Math.ceil(mass); i++) sum += a[i] * Math.min(1, mass - i);
  return sum / mass;
}
export function drawdown(values) {
  let peak = values[0],
    dd = 0;
  for (const x of values) {
    peak = Math.max(x, peak);
    dd = Math.max(dd, 1 - x / peak);
  }
  return dd;
}
export function risk(weights, d) {
  const r = returns(d).map((row) =>
      row.reduce((s, x, i) => s + x * weights[i], 0),
    ),
    loss = r.map((x) => -x);
  return {
    vol: sd(r) * Math.sqrt(252),
    var: Math.max(
      0,
      [...loss].sort((a, b) => a - b)[Math.ceil(0.95 * loss.length) - 1],
    ),
    es: Math.max(0, tail(loss)),
    rob: Math.max(0, tail(loss, 0.05 / 2)),
    hhi: weights.reduce((s, w) => s + w * w, 0),
    n: r.length,
  };
}
export function book(s, d = s.d) {
  const px = s.scenarioPrices ?? tape.at(d).prices,
    values = assets.map((a, i) => s.pos[i].q * px[i]),
    equity = s.cash + values.reduce((a, b) => a + b, 0);
  return {
    values,
    equity,
    weights: values.map((v) => v / equity),
    exposure: 1 - s.cash / equity,
  };
}
export const dimensions = [
  "Regime consistency",
  "Portfolio resilience",
  "Distributional robustness",
  "Decision quality",
  "Strategy stability",
];
export function indexScore(s) {
  const b = book(s),
    r = risk(b.weights, s.d),
    entries = s.orders.filter((o) => o.side === "Buy" && o.snap).slice(-20);
  const parts = [
    entries.length
      ? mean(entries.map((o) => (o.thesis ?? o.snap).align))
      : null,
    b.exposure > 1e-8 ? clamp(100 * (1 - r.vol / 0.4)) : null,
    b.exposure > 1e-8 ? clamp(100 * (1 - r.rob / 0.06)) : null,
    entries.length
      ? mean(entries.map((o) => (o.thesis ?? o.snap).quality))
      : null,
    s.foundry?.stability ?? null,
  ];
  const max = s.weights.reduce((a, b) => a + b, 0),
    available = parts.reduce(
      (a, x, i) => a + (x === null ? 0 : s.weights[i]),
      0,
    );
  return {
    parts,
    value: available
      ? parts.reduce((a, x, i) => a + (x ?? 0) * s.weights[i], 0) / available
      : null,
    coverage: available / max,
    entries: entries.length,
  };
}
export function clusters(s, i) {
  const b = book(s),
    g = graphIntel(s.d).groups;
  return {
    sector: b.weights.reduce(
      (t, w, k) => t + (assets[k].sector === assets[i].sector ? w : 0),
      0,
    ),
    cluster: b.weights.reduce((t, w, k) => t + (g[k] === g[i] ? w : 0), 0),
    related: assets.filter((a) => g[a.i] === g[i]).map((a) => a.sym),
  };
}
export function decision(s, i) {
  const b = book(s),
    riskNow = risk(b.weights, s.d),
    prob = tape.at(s.d).prob,
    cap = 0.25 + 0.6 * prob[0],
    align = clamp(100 * (1 - Math.max(0, b.exposure - cap))),
    quality = clamp(
      0.4 * align +
        0.3 * clamp(100 * (1 - riskNow.rob / 0.06)) +
        0.3 * clamp(100 * (1 - Math.max(0, b.weights[i] - 0.2) / 0.8)),
    );
  return {
    align,
    quality,
    prob: [...prob],
    related: clusters(s, i).related,
    rob: riskNow.rob,
    allocation: b.weights[i],
    day: s.d,
  };
}
function strategySeries(d, i, look, type, extra) {
  const rows = tape.window(d, 159),
    out = [];
  let held = 0;
  for (let k = Math.max(look, rows.length - 121); k < rows.length - 1; k++) {
    const p = rows[k].prices[i],
      m = mean(rows.slice(k - look + 1, k + 1).map((r) => r.prices[i]));
    const w = type === "Hold" ? 1 : Number(type === "Momentum" ? p > m : p < m);
    out.push(
      w * (rows[k + 1].prices[i] / p - 1) -
        Math.abs(w - held) * (0.0005 + 0.0003 + extra),
    );
    held = w;
  }
  if (out.length) out[out.length - 1] -= held * (0.0008 + extra);
  return out.slice(-120);
}
function pathStats(r) {
  let eq = 1,
    peak = 1,
    dd = 0;
  for (const x of r) {
    eq *= 1 + x;
    peak = Math.max(peak, eq);
    dd = Math.max(dd, 1 - eq / peak);
  }
  return { ret: eq - 1, dd };
}
export function foundry(d, i, look, type, extra = 0) {
  const series = strategySeries(d, i, look, type, extra),
    n = series.length,
    paths = 300,
    rand = rng(8472 + d * 13 + i),
    rets = [],
    dds = [];
  for (let j = 0; j < paths; j++) {
    const res = [];
    while (res.length < n) {
      const k = Math.floor(rand() * n);
      for (let b = 0; b < 5 && res.length < n; b++)
        res.push(series[(k + b) % n]);
    }
    const p = pathStats(res);
    rets.push(p.ret);
    dds.push(p.dd);
  }
  const pos = rets.filter((x) => x > 0).length / paths,
    z = 1.96,
    den = 1 + (z * z) / paths,
    mid = (pos + (z * z) / (2 * paths)) / den,
    half =
      (z * Math.sqrt((pos * (1 - pos)) / paths + (z * z) / (4 * paths ** 2))) /
      den;
  const sweep = [Math.max(2, look - 3), look, look + 3].map((k) => ({
    k,
    ret: pathStats(strategySeries(d, i, k, type, extra)).ret,
  }));
  return {
    d,
    i,
    look,
    type,
    extra,
    n,
    paths,
    pos,
    ci: [mid - half, mid + half],
    lo: quantile(rets, 0.05),
    hi: quantile(rets, 0.95),
    median: quantile(rets, 0.5),
    dd: quantile(dds, 0.5),
    badDD: quantile(dds, 0.95),
    sharpe: sd(series) ? (mean(series) / sd(series)) * Math.sqrt(252) : 0,
    sweep,
    stability: clamp(
      100 *
        pos *
        (1 -
          Math.min(
            1,
            Math.max(...sweep.map((x) => x.ret)) -
              Math.min(...sweep.map((x) => x.ret)),
          )),
    ),
    historical: pathStats(series).ret,
    rets: rets.map((x) => round(x * 10000) / 10000),
  };
}
