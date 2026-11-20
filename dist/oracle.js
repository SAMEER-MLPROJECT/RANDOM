// All connectors return publication records. Raw records and model outputs remain distinct.
import { assets, tape, mean } from "./market.js";

export const channels = {
  corporate: "Corporate disclosures",
  social: "Public discussion",
  infrastructure: "Infrastructure notices",
  logistics: "Logistics & environment",
  market: "Market tape",
};
export const families = {
  supply: {
    label: "Supplier disruption",
    asset: 0,
    control: 3,
    pattern: /shipment delay|supplier disruption/i,
    trigger: "shipment delay",
    metric: "volatility",
    direction: 1,
  },
  earnings: {
    label: "Earnings surprise",
    asset: 1,
    control: 6,
    pattern: /earnings surprise|earnings exceeded/i,
    trigger: "earnings exceeded expectations",
    metric: "return",
    direction: 1,
  },
  operations: {
    label: "Operational interruption",
    asset: 2,
    control: 7,
    pattern: /operational interruption|plant outage/i,
    trigger: "plant outage",
    metric: "return",
    direction: -1,
  },
};
const catalogue = Object.entries(families);
const edges = [
  ["Lumen Components", "supplies", "Vyra Systems"],
  ["Vyra Devices", "subsidiary of", "Vyra Systems"],
  ["Arclight Labs", "competes with", "Vyra Systems"],
  ["Kora Financial", "competes with", "Meridian Bank"],
  ["Kora Leasing", "subsidiary of", "Kora Financial"],
  ["Orbiton Energy", "delivers to", "Vela Motors"],
  ["Orbiton Energy", "competes with", "Solenne Power"],
];
export const entityEdges = edges;
const aliases = assets
  .flatMap((a) => [
    [a.name, a.i, 1],
    [a.sym, a.i, 1],
  ])
  .concat([
    ["Lumen Components", 0, 0.9],
    ["Vyra Devices", 0, 0.96],
    ["Kora Leasing", 1, 0.96],
  ]);
export function resolve(text) {
  const hits = aliases.filter(([alias]) =>
    new RegExp("\\b" + alias + "\\b", "i").test(text),
  );
  const ids = new Set(hits.map((h) => h[1]));
  if (ids.size !== 1) return null;
  const [alias, asset, confidence] = hits.sort((a, b) => b[2] - a[2])[0];
  return { asset, entity: assets[asset].sym, alias, confidence };
}
export function extract(doc) {
  if (
    !doc ||
    typeof doc !== "object" ||
    !Object.hasOwn(channels, doc.channel) ||
    !["id", "origin", "text"].every(
      (k) =>
        typeof doc[k] === "string" && doc[k].length > 0 && doc[k].length < 3500,
    )
  )
    throw Error("Invalid record identity, source or excerpt.");
  if (
    ![doc.day, doc.published, doc.observed].every(
      (v) => Number.isInteger(v) && v >= 1 && v <= 100000,
    ) ||
    doc.day > doc.published ||
    doc.published > doc.observed
  )
    throw Error("Dates must follow event, publication and observation order.");
  const entity = resolve(doc.text),
    matches = catalogue.filter(([, f]) => f.pattern.test(doc.text));
  if (!entity || matches.length !== 1 || matches[0][1].asset !== entity.asset)
    return null;
  const [family, f] = matches[0],
    stance = /denies|disputes|no evidence of/i.test(doc.text)
      ? "contradicts"
      : /context only/i.test(doc.text)
        ? "context"
        : "supports";
  return {
    id: doc.id,
    origin: doc.origin,
    channel: doc.channel,
    text: doc.text,
    day: doc.day,
    published: doc.published,
    observed: doc.observed,
    asset: entity.asset,
    entity: entity.entity,
    attribution: entity.confidence,
    extraction: entity.confidence * (stance === "context" ? 0.85 : 0.95),
    family,
    control: f.control,
    stance,
  };
}
const sourceNames = Object.keys(channels);
const authority = {
  corporate: 0.95,
  logistics: 0.8,
  social: 0.45,
  infrastructure: 0.75,
  market: 0.9,
};
export function evidenceScore(e) {
  const independent = new Map();
  for (const r of e.sources) {
    const old = independent.get(r.origin);
    if (!old || authority[r.channel] > authority[old.channel])
      independent.set(r.origin, r);
  }
  const rs = [...independent.values()],
    support = rs.filter((r) => r.stance === "supports"),
    contra = rs.filter((r) => r.stance === "contradicts").length;
  const quality = support.length
    ? mean(
        support.map(
          (r) =>
            (authority[r.channel] * r.attribution) /
            (1 + 0.15 * (r.observed - r.published)),
        ),
      )
    : 0;
  return {
    value: Math.round(
      100 *
        quality *
        (1 - Math.exp(-support.length)) *
        (support.length / (support.length + contra || 1)),
    ),
    independent: support.length,
    count: e.sources.length,
    conflicts: contra,
    origins: rs.length,
  };
}
const extracted = new Map();
export function fixtureRecords(d) {
  if (extracted.has(d)) return extracted.get(d);
  const [key, f] = catalogue[(d / 6) % 3],
    name = assets[f.asset].name,
    word = f.trigger,
    issuer = "filing-" + d;
  const rec = (channel, n, origin, delay, text) => ({
    channel,
    id: channel + "-" + d + "-" + n,
    origin,
    text,
    day: d,
    published: d + Math.min(delay, 1),
    observed: d + delay,
  });
  const age = d / 6,
    rows = [
      rec(
        "corporate",
        1,
        issuer,
        0,
        name + " reports " + word + " in its fictional operating update.",
      ),
      rec(
        "social",
        1,
        issuer,
        0,
        "A bulletin repeats the " + name + " announcement of " + word + ".",
      ),
      rec(
        "logistics",
        1,
        "bulletin-" + d,
        age % 2,
        key === "supply"
          ? "Lumen Components reports a shipment delay in its dispatch bulletin."
          : name +
              ": regional activity bulletin lists " +
              word +
              " as context only.",
      ),
      rec(
        "infrastructure",
        1,
        "vendor-status-" + d,
        1,
        name +
          " status provider lists a scheduled service change during the " +
          word +
          " window. Context only.",
      ),
      rec(
        "market",
        1,
        "market-close-" + d,
        0,
        name +
          " closed at ₹" +
          tape.at(d).prices[f.asset].toFixed(2) +
          " during the " +
          word +
          " window. Market context only.",
      ),
    ];
  if (age % 4 === 0)
    rows.push(
      rec(
        "social",
        2,
        "observer-" + d,
        1,
        "An independent fictional observer disputes the " +
          word +
          " at " +
          name +
          ".",
      ),
    );
  const result = rows.map(extract).filter(Boolean);
  extracted.set(d, result);
  return result;
}
export function eventsAt(day, enabled = sourceNames, imports = []) {
  const sources = new Set(enabled),
    groups = new Map();
  function add(r) {
    if (!r || r.observed > day || !sources.has(r.channel)) return;
    const id = r.family + "-" + r.day;
    let group = groups.get(id);
    if (!group) {
      group = {
        id,
        family: r.family,
        asset: r.asset,
        control: r.control,
        day: r.day,
        published: r.published,
        observed: r.observed,
        sources: [],
      };
      groups.set(id, group);
    }
    if (!group.sources.some((x) => x.id === r.id)) {
      group.sources.push(r);
      group.observed = Math.min(group.observed, r.observed);
      group.published = Math.min(group.published, r.published);
    }
  }
  for (let d = 6; d <= day; d += 6) for (const r of fixtureRecords(d)) add(r);
  for (const raw of imports) add(extract(raw));
  return [...groups.values()]
    .filter((e) => e.sources.some((r) => r.stance !== "context"))
    .sort((a, b) => b.day - a.day || a.id.localeCompare(b.id));
}
export function importBatch(text, day, existing = []) {
  if (text.length > 250000) throw Error("Use a fixture under 250 KB.");
  const docs = JSON.parse(text);
  if (!Array.isArray(docs) || !docs.length || docs.length > 100)
    throw Error("Provide an array of 1–100 fictional records.");
  const known = new Map(existing.map((r) => [r.id, r])),
    next = [...existing];
  for (const doc of docs) {
    if (!extract(doc))
      throw Error("Unresolved entity or unsupported event classification.");
    if (doc.observed > day)
      throw Error(
        "The observation is later than the current simulated session.",
      );
    if (!doc.id.startsWith("local-") || !doc.origin.startsWith("local-"))
      throw Error("Use local- prefixes for imported record and origin IDs.");
    const normalized = Object.fromEntries(
      ["id", "origin", "text", "channel", "day", "published", "observed"].map(
        (k) => [k, doc[k]],
      ),
    );
    if (known.has(doc.id)) {
      if (JSON.stringify(known.get(doc.id)) !== JSON.stringify(normalized))
        throw Error("This record ID already has different evidence.");
      continue;
    }
    next.push(normalized);
    known.set(doc.id, normalized);
  }
  if (next.length > 400)
    throw Error("This workspace stores up to 400 imported observations.");
  return next;
}
