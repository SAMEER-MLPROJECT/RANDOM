import { assets, tape, START, round, returns, sd, mean } from "./market.js";
import { book, indexScore, decision, drawdown } from "./quant.js";
const capital = 1000000;
const positions = () => assets.map(() => ({ q: 0, basis: 0, lots: [] }));
export function account() {
  const s = {
    version: 1,
    d: START,
    cash: capital,
    pos: positions(),
    orders: [],
    reports: [],
    watch: [0, 1, 2, 3],
    weights: [20, 25, 25, 20, 10],
    foundry: null,
    runs: [],
    shadow: { cash: capital, pos: positions() },
    history: [],
    seq: 0,
  };
  rebalance(s);
  record(s);
  return s;
}
export function quote(side, q, raw) {
  const price = Math.max(0.01, round(raw * (side === "Buy" ? 1.0003 : 0.9997))),
    gross = round(q * price),
    fee = round(gross * 0.0005);
  return {
    price,
    gross,
    fee,
    cost: round(gross + fee),
    net: round(gross - fee),
    slip: round(Math.abs(raw - price) * q),
  };
}
function validate(s, o) {
  if (
    !assets[o.i] ||
    !["Buy", "Sell"].includes(o.side) ||
    !["Market", "Limit", "Stop-loss"].includes(o.type)
  )
    throw Error("Choose an instrument, side and order type.");
  if (!Number.isSafeInteger(o.q) || o.q < 1 || o.q > 10000000)
    throw Error("Enter a whole quantity between 1 and 10,000,000.");
  if (
    o.type !== "Market" &&
    (!Number.isFinite(o.trigger) ||
      o.trigger < 0.01 ||
      o.trigger !== round(o.trigger))
  )
    throw Error("Enter a positive trigger price with up to two decimals.");
  if (o.side === "Sell" && s.pos[o.i].q < o.q)
    throw Error("Quantity exceeds your open position.");
}
function eligible(s, o) {
  const p = tape.at(s.d).prices[o.i];
  if (o.type === "Market") return true;
  if (o.type === "Limit") {
    const x = quote(o.side, o.q, p).price;
    return o.side === "Buy" ? x <= o.trigger : x >= o.trigger;
  }
  return o.side === "Buy" ? p >= o.trigger : p <= o.trigger;
}
function conditionalReference(o) {
  if (o.type === "Limit")
    return o.trigger / (o.side === "Buy" ? 1.0003 : 0.9997);
  return o.trigger;
}
function closeReport(s, o, lots, basis) {
  const alternatives = [
    { name: "Actual size", pnl: round(o.net - basis) },
    { name: "Half-size entry", pnl: 0 },
    { name: "One session later", pnl: 0 },
    { name: "One session earlier exit", pnl: 0 },
    { name: "Stay in cash", pnl: 0 },
  ];
  for (const l of lots) {
    const k = l.q,
      p0 = tape.at(l.day).prices[o.i],
      p1 = tape.at(s.d).prices[o.i];
    const halfShare = Math.floor(o.q / 2) / o.q;
    alternatives[1].pnl += ((o.net * k) / o.q - l.basis) * halfShare;
    if (l.day < s.d)
      alternatives[2].pnl +=
        quote("Sell", k, p1).net -
        quote("Buy", k, tape.at(l.day + 1).prices[o.i]).cost;
    const priorExit = Math.max(l.day, s.d - 1);
    alternatives[3].pnl +=
      quote("Sell", k, tape.at(priorExit).prices[o.i]).net - l.basis;
  }
  const weighted = (fn) => lots.reduce((a, l) => a + (l.q / o.q) * fn(l), 0),
    end = o.net,
    actual = alternatives[0].pnl;
  for (const a of alternatives) {
    a.pnl = round(a.pnl);
    a.utility = a.pnl - 0.5 * Math.max(0, -a.pnl);
  }
  return {
    experiments: [
      ...new Map(
        lots
          .filter((l) => l.experiment)
          .map((l) => [l.experiment.id, l.experiment]),
      ).values(),
    ],
    allocation: weighted((l) => l.snap.allocation),
    decisionDay: Math.min(...lots.map((l) => l.thesis?.day ?? l.day)),
    entryQuality: weighted((l) => l.snap.quality),
    order: o.id,
    i: o.i,
    q: o.q,
    day: s.d,
    first: Math.min(...lots.map((l) => l.day)),
    exit: o.price,
    entry: weighted((l) => l.price),
    fees: round(o.fee + lots.reduce((a, l) => a + l.fee, 0)),
    slip: round(o.slip + lots.reduce((a, l) => a + l.slip, 0)),
    basis,
    proceeds: end,
    pnl: actual,
    alternatives,
    regret: round(
      Math.max(...alternatives.map((a) => a.utility)) - alternatives[0].utility,
    ),
    quality: weighted((l) => l.thesis?.quality ?? l.snap.quality),
    prob: [0, 1, 2].map((i) => weighted((l) => l.snap.prob[i])),
    risk: weighted((l) => l.snap.rob),
    related: [...new Set(lots.flatMap((l) => l.snap.related))],
  };
}
function applyFill(s, o, raw, analytics = true) {
  validate(s, o);
  const x = quote(o.side, o.q, raw),
    p = s.pos[o.i];
  if (o.side === "Buy" && x.cost > s.cash)
    throw Error("Insufficient virtual cash for this fill.");
  Object.assign(o, x, { filled: s.d, status: "Filled" });
  if (o.side === "Buy") {
    s.cash = round(s.cash - x.cost);
    p.q += o.q;
    p.basis = round(p.basis + x.cost);
    if (analytics) {
      o.snap = decision(s, o.i);
      p.lots.push({
        day: s.d,
        q: o.q,
        price: x.price,
        basis: x.cost,
        fee: x.fee,
        slip: x.slip,
        ...(o.experiment ? { experiment: structuredClone(o.experiment) } : {}),
        snap: o.snap,
        thesis: o.thesis ?? o.snap,
      });
    }
  } else {
    const fraction = o.q / p.q,
      basis = round(p.basis * fraction);
    if (analytics) {
      const lots = p.lots.map((l) => ({
        ...l,
        q: l.q * fraction,
        basis: l.basis * fraction,
        fee: l.fee * fraction,
        slip: l.slip * fraction,
      }));
      s.reports.unshift(closeReport(s, o, lots, basis));
      p.lots =
        fraction === 1
          ? []
          : p.lots.map((l) => ({
              ...l,
              q: l.q * (1 - fraction),
              basis: l.basis * (1 - fraction),
              fee: l.fee * (1 - fraction),
              slip: l.slip * (1 - fraction),
            }));
    }
    p.q -= o.q;
    p.basis = round(p.basis - basis);
    s.cash = round(s.cash + x.net);
  }
}
export function place(s, input) {
  validate(s, input);
  const o = { ...input, id: s.seq + 1, created: s.d, status: "Open" },
    p = tape.at(s.d).prices[o.i];
  if (eligible(s, o)) applyFill(s, o, p);
  else if (
    o.side === "Buy" &&
    quote("Buy", o.q, conditionalReference(o)).cost > s.cash
  )
    throw Error("Order value exceeds available virtual cash.");
  if (o.status === "Open" && o.side === "Buy")
    o.thesis = projected(s, o).orders.at(-1).snap;
  s.seq++;
  s.orders.push(o);
  record(s);
  return o;
}
export function projected(s, o) {
  validate(s, o);
  const next = structuredClone(s),
    order = { ...o, id: s.seq + 1 };
  const immediate = eligible(s, o);
  const reference = immediate
    ? tape.at(s.d).prices[o.i]
    : conditionalReference(o);
  if (!immediate) {
    next.scenarioPrices = [...tape.at(s.d).prices];
    next.scenarioPrices[o.i] = reference;
  }
  applyFill(next, order, reference);
  next.orders.push(order);
  return next;
}
export function cancel(s, id) {
  const o = s.orders.find((o) => o.id === id && o.status === "Open");
  if (!o) throw Error("This order is no longer open.");
  o.status = "Cancelled";
  o.ended = s.d;
}
function rebalance(s) {
  const h = s.shadow;
  h.d = s.d;
  const b = book(h),
    p = tape.at(s.d),
    rets = returns(s.d, 30),
    inv = assets.map((a) => 1 / Math.max(0.001, sd(rets.map((r) => r[a.i])))),
    total = inv.reduce((a, b) => a + b);
  const exposure = 0.2 + 0.5 * p.prob[0],
    target = inv.map((v, i) =>
      Math.floor((b.equity * exposure * v) / total / p.prices[i]),
    ),
    deltas = target.map((q, i) => q - h.pos[i].q);
  for (const side of ["Sell", "Buy"])
    deltas.forEach((v, i) => {
      if ((side === "Buy" && v > 0) || (side === "Sell" && v < 0))
        applyFill(
          h,
          { i, side, q: Math.abs(v), type: "Market" },
          p.prices[i],
          false,
        );
    });
}
export function record(s) {
  let a = book(s),
    h = book(s.shadow, s.d),
    point = {
      d: s.d,
      equity: a.equity,
      shadow: h.equity,
      rii: indexScore(s).value,
      exposure: a.exposure,
      shadowExp: h.exposure,
      regime: tape.at(s.d).prob.indexOf(Math.max(...tape.at(s.d).prob)),
    };
  if (s.history.at(-1)?.d === s.d) s.history[s.history.length - 1] = point;
  else s.history.push(point);
}
export function advance(s) {
  s.d++;
  tape.at(s.d);
  for (const o of s.orders.filter(
    (o) => o.status === "Open" && eligible(s, o),
  )) {
    try {
      applyFill(s, o, tape.at(s.d).prices[o.i]);
    } catch (e) {
      o.status = "Rejected";
      o.reason = e.message;
      o.ended = s.d;
    }
  }
  s.shadow.d = s.d;
  if ((s.d - START) % 5 === 0) rebalance(s);
  record(s);
}
export function comparison(s, key) {
  const a = [capital, ...s.history.map((h) => h[key])],
    r = a.slice(1).map((v, i) => v / a[i] - 1);
  return {
    ret: a.at(-1) / capital - 1,
    dd: drawdown(a),
    sharpe:
      r.length >= 5 && sd(r) > 0 ? (mean(r) / sd(r)) * Math.sqrt(252) : null,
  };
}
