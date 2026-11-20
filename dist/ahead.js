import { assets, tape, rng, mean } from "./market.js";
import { families, evidenceScore } from "./oracle.js";
import { quantile } from "./quant.js";

export function propose(event, universe, cutoff) {
  if (
    !event ||
    event.observed > cutoff ||
    !event.sources.some((r) => r.stance === "supports" && r.observed <= cutoff)
  )
    throw Error(
      "A proposal needs attributed supporting evidence visible at the cutoff.",
    );
  const f = families[event.family],
    metric =
      f.metric === "volatility"
        ? "mean absolute daily return"
        : "mean daily return",
    company = assets[f.asset].name,
    peer = assets[f.control].name;
  const expected = f.direction > 0 ? "increase" : "decrease";
  const vintage = universe
    .filter((e) => e.day <= cutoff)
    .map((e) => {
      const dates = e.sources
        .filter((r) => r.stance === "supports")
        .map((r) => r.observed);
      return { id: e.id, family: e.family, t: Math.min(...dates) };
    })
    .filter((e) => e.t + 5 <= cutoff && e.t >= 5);
  return {
    id: "H-" + event.id + "-D" + cutoff,
    event: event.id,
    family: event.family,
    asset: f.asset,
    cutoff,
    question:
      "Does " +
      company +
      " show a larger " +
      expected +
      " in " +
      metric +
      " than " +
      peer +
      " after a " +
      f.label.toLowerCase() +
      "?",
    null: "The expected paired pre/post difference, net of the sector peer, is zero.",
    alternative:
      "The paired effect for " +
      company +
      " shows a relative " +
      expected +
      " in " +
      metric +
      ".",
    independent: f.label,
    dependent: metric,
    control: peer,
    confounders:
      "Concurrent announcements, common factor shocks, different firm exposures and serial dependence.",
    falsify:
      "A significant opposite-signed effect rejects the proposed direction. Other insufficient evidence remains inconclusive.",
    generator: "Prespecified template",
    status: "PROPOSED",
    sources: structuredClone(event.sources),
    eri: evidenceScore(event),
    vintage,
    log: [{ status: "PROPOSED", day: cutoff }],
  };
}
function study(family, vintage, day, src = tape) {
  const f = families[family],
    relative = (t) => {
      const px = src.at(t).prices,
        p = src.at(t - 1).prices;
      const transform = (r) => (f.metric === "volatility" ? Math.abs(r) : r);
      return (
        transform(px[f.asset] / p[f.asset] - 1) -
        transform(px[f.control] / p[f.control] - 1)
      );
    };
  let end = -1;
  const sample = [];
  for (const e of vintage
    .filter((e) => e.family === family && e.t + 5 <= day)
    .sort((a, b) => a.t - b.t)) {
    if (e.t < 5 || e.t - 4 <= end) continue;
    const pre = mean(
      Array.from({ length: 5 }, (_, i) => relative(e.t - 4 + i)),
    );
    const post = mean(
      Array.from({ length: 5 }, (_, i) => relative(e.t + 1 + i)),
    );
    sample.push({ id: e.id, t: e.t, effect: post - pre });
    end = e.t + 5;
  }
  const selected = sample.slice(-48),
    ys = selected.map((s) => s.effect),
    n = ys.length,
    effect = mean(ys);
  if (n < 6) return { n, effect, p: 1, ci: null, sample: selected };
  const exact = n <= 13,
    count = exact ? 2 ** n : 4096,
    random = rng(7709),
    boots = [];
  let extreme = 0;
  for (let j = 0; j < count; j++) {
    let sum = 0;
    for (let i = 0; i < n; i++)
      sum += ys[i] * ((exact ? (j >> i) & 1 : random() < 0.5) ? 1 : -1);
    if (Math.abs(sum / n) >= Math.abs(effect) - 1e-14) extreme++;
  }
  for (let j = 0; j < 2000; j++)
    boots.push(mean(ys.map(() => ys[Math.floor(random() * n)])));
  return {
    n,
    effect,
    p: exact ? extreme / count : (extreme + 1) / (count + 1),
    ci: [quantile(boots, 0.025), quantile(boots, 0.975)],
    sample: selected,
  };
}
export function adjustBY(p) {
  const m = p.length,
    c = p.reduce((a, _, i) => a + 1 / (i + 1), 0),
    ix = p.map((_, i) => i).sort((a, b) => p[a] - p[b]),
    out = Array(m);
  let prev = 1;
  for (let j = m - 1; j >= 0; j--) {
    prev = Math.min(prev, (p[ix[j]] * m * c) / (j + 1));
    out[ix[j]] = prev;
  }
  return out;
}
export function evaluate(h, src = tape) {
  const keys = Object.keys(families),
    all = keys.map((key) => study(key, h.vintage, h.cutoff, src)),
    idx = keys.indexOf(h.family);
  const result = all[idx],
    q = adjustBY(all.map((r) => r.p))[idx],
    status =
      result.n < 6 || q > 0.05
        ? "INCONCLUSIVE"
        : result.effect * families[h.family].direction > 0
          ? "SUPPORTED"
          : "REJECTED";
  return {
    ...result,
    q,
    status,
    familyTests: keys.map((key, j) => ({ key, n: all[j].n, p: all[j].p })),
    cutoff: h.cutoff,
  };
}
export function testHypothesis(h, day) {
  if (h.status !== "PROPOSED")
    throw Error("This proposal already has an audit decision.");
  const result = evaluate(h);
  h.result = result;
  h.log.push({ status: "TESTING", day }, { status: result.status, day });
  h.status = result.status;
}
export function experimentSnapshot(h) {
  if (!h.result || h.status === "INVALIDATED")
    throw Error("Test an active hypothesis before opening an experiment.");
  return {
    id: h.id,
    event: h.event,
    asset: h.asset,
    cutoff: h.cutoff,
    status: h.status,
    eri: h.eri.value,
    effect: h.result.effect,
    q: h.result.q,
    origins: [...new Set(h.sources.map((r) => r.origin))],
  };
}
