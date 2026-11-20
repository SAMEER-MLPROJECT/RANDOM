import { assets, tape } from "./market.js";
export const money = (v, n = 2) =>
  "₹" +
  v.toLocaleString("en-IN", {
    minimumFractionDigits: n,
    maximumFractionDigits: n,
  });
export const number = (v, n = 2) =>
  v.toLocaleString("en-IN", {
    maximumFractionDigits: n,
    minimumFractionDigits: n,
  });
export const pct = (v, n = 2) => (100 * v).toFixed(n) + "%",
  signed = (v, n = 2) => (v > 0 ? "+" : "") + pct(v, n);
export const day = (d) =>
  new Date(tape.at(d).date + "T00:00Z").toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
const icons = {
  command:
    '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  market: '<path d="M3 20h18M5 16v-5m5 5V6m5 10v-7m5 7V3"/>',
  terminal: '<path d="M5 3v18m0-14h3v7H2V7h3m9-4v18m0-11h3v7h-6v-7h3m6-7v18"/>',
  portfolio:
    '<rect x="3" y="7" width="18" height="14" rx="3"/><path d="M8 7V4h8v3M3 12q9 6 18 0m-9 1v3"/>',
  rift: '<path d="M12 2l8.7 5v10L12 22l-8.7-5V7zM12 2v20M3.3 7l17.4 10m0-10L3.3 17"/>',
  foundry: '<path d="M9 3h6m-5 0v7L4 19q-1 2 2 2h12q3 0 2-2l-6-9V3M7 15h10"/>',
  autopsy: '<path d="M3 12h4l2-6 4 12 3-8 2 2h3"/>',
  wallet:
    '<path d="M20 8H5a2 2 0 010-4h12v4M3 6v12a2 2 0 002 2h15V8m0 4h-5v4h5"/>',
  coins:
    '<ellipse cx="10" cy="6" rx="7" ry="3"/><path d="M3 6v5c0 4 14 4 14 0V6M3 11v5c0 3 9 4 13 1m4-6v7c0 2-4 3-7 3"/>',
  pnl: '<path d="M3 17l6-6 4 4 7-10m-6 0h6v6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  next: '<path d="M5 5l10 7-10 7zM19 5v14"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  search: '<circle cx="10" cy="10" r="6"/><path d="M15 15l6 6"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9z"/>',
  menu: '<path d="M3 5h18M3 12h18M3 19h18"/>',
  reset: '<path d="M3 10a9 9 0 119 11M3 3v7h7"/>',
  shield:
    '<path d="M12 2l8 4v6c0 5-4 8-8 10-4-2-8-5-8-10V6z"/><path d="m8 12 3 3 5-6"/>',
  chart: '<path d="M3 20V4m0 16h18M6 15l4-5 3 2 6-7"/>',
  radar:
    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="m12 12 8-8"/>',
  book: '<path d="M3 4q5-2 9 1 4-3 9-1v15q-5-2-9 1-4-3-9-1zM12 5v15"/>',
  close: '<path d="m5 5 14 14m0-14L5 19"/>',
  layers: '<path d="m12 3 10 5-10 5L2 8zM3 12l9 5 9-5M3 16l9 5 9-5"/>',
  pulse: '<path d="M2 12h5l3-8 4 16 3-8h5"/>',
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v5m10-5v5M3 11h18"/>',
};
export const icon = (k, size = 18) =>
  '<svg aria-hidden="true" width="' +
  size +
  '" height="' +
  size +
  '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">' +
  (icons[k] || icons.chart) +
  "</svg>";
export const logo =
  '<svg aria-hidden="true" viewBox="0 0 42 42" width="36" height="36"><path fill="#68edb3" d="M17 3h14l8 13-8 14-6-9 4-6-3-5h-7L10 26l4 6h7l-3-5 5-8 13 20H12L3 26z"/></svg>';
export const hex = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function badgeAsset(i) {
  const a = assets[i];
  return (
    '<span class="assetmark" style="--col:' +
    a.color +
    '">' +
    ["◈", "≋", "◎", "⌁", "⟐", "✣", "▥", "◒"][i] +
    "</span>"
  );
}
export function spark(data, color = "var(--green)") {
  let lo = Math.min(...data),
    hi = Math.max(...data);
  return (
    '<svg aria-hidden="true" class="spark" viewBox="0 0 90 23" preserveAspectRatio="none"><path fill="none" stroke="' +
    color +
    '" stroke-width="1.5" d="' +
    data
      .map(
        (x, i) =>
          (i ? "L" : "M") +
          (1 + (i * 88) / (data.length - 1 || 1)).toFixed(1) +
          " " +
          (21 - (19 * (x - lo)) / (hi - lo || 1)).toFixed(1),
      )
      .join(" ") +
    '"/></svg>'
  );
}
export function chart(rows, values, opts = {}) {
  const W = 740,
    H = 210,
    l = 4,
    r = 66,
    t = 10,
    b = 25,
    x = (i) => l + ((W - l - r) * i) / (values.length - 1 || 1);
  let lo = Math.min(...(opts.bars ? opts.bars.map((b) => b[2]) : values)),
    hi = Math.max(...(opts.bars ? opts.bars.map((b) => b[1]) : values));
  const pad = (hi - lo) * 0.1 || Math.max(1, hi * 0.001);
  lo -= pad;
  hi += pad;
  const y = (v) => t + ((hi - v) / (hi - lo)) * (H - b - t),
    path = values
      .map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1))
      .join(" ");
  const grids = Array.from({ length: 5 }, (_, i) => {
    const yy = t + ((H - t - b) * i) / 4;
    return (
      '<path d="M' +
      l +
      " " +
      yy +
      "H" +
      (W - r) +
      '" stroke="#30393d" stroke-dasharray="3 5"/><text x="' +
      (W - 2) +
      '" y="' +
      (yy + 4) +
      '" text-anchor="end">' +
      (hi - ((hi - lo) * i) / 4).toLocaleString("en-IN", {
        maximumFractionDigits: hi >= 10000 ? 0 : 1,
      }) +
      "</text>"
    );
  }).join("");
  const ticks = [
    ...new Set(
      Array.from({ length: Math.min(rows.length, 6) }, (_, i) =>
        Math.round(
          ((rows.length - 1) * i) / (Math.min(rows.length, 6) - 1 || 1),
        ),
      ),
    ),
  ]
    .map(
      (i, j, arr) =>
        '<text x="' +
        x(i) +
        '" y="' +
        (H - 1) +
        '" text-anchor="' +
        (j === 0 ? "start" : j === arr.length - 1 ? "end" : "middle") +
        '">' +
        rows[i].date.slice(8) +
        " " +
        new Date(rows[i].date + "T00:00Z").toLocaleDateString("en-GB", {
          month: "short",
          timeZone: "UTC",
        }) +
        "</text>",
    )
    .join("");
  const last = values.length - 1;
  const candles = opts.bars
    ?.map(([o, h, low, c], i) => {
      const col = c >= o ? "#62e2a9" : "#eb8792",
        w = Math.max(1, Math.min(12, ((W - r) / values.length) * 0.58));
      return (
        '<path d="M' +
        x(i) +
        " " +
        y(h) +
        "V" +
        y(low) +
        '" stroke="' +
        col +
        '"/><rect x="' +
        (x(i) - w / 2) +
        '" y="' +
        Math.min(y(o), y(c)) +
        '" width="' +
        w +
        '" height="' +
        Math.max(1, Math.abs(y(o) - y(c))) +
        '" fill="' +
        col +
        '"/>'
      );
    })
    .join("");
  return (
    '<div class="plot" data-series="' +
    hex(JSON.stringify(rows.map((r, i) => [r.date, number(values[i], 2)]))) +
    '" tabindex="0" aria-label="Chart. Use left and right arrow keys to inspect values."><svg viewBox="0 0 ' +
    W +
    " " +
    H +
    '" preserveAspectRatio="none" role="img" aria-label="' +
    hex(opts.title || "Historical price") +
    '"><defs><linearGradient id="fillChart" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#4ee8a6" stop-opacity=".25"/><stop offset="1" stop-color="#4ee8a6" stop-opacity=".008"/></linearGradient></defs>' +
    grids +
    (candles ||
      '<path d="' +
        path +
        " L" +
        x(last) +
        " " +
        (H - b) +
        " H" +
        l +
        'Z" fill="url(#fillChart)"/><path d="' +
        path +
        '" fill="none" stroke="#64e6a8" stroke-width="2.3" vector-effect="non-scaling-stroke"/><circle cx="' +
        x(last) +
        '" cy="' +
        y(values[last]) +
        '" r="4" fill="#82f6bb"/>') +
    ticks +
    '</svg><output class="tip" hidden></output></div>'
  );
}
export function terrain() {
  let lines = "";
  const f = (x, z) => {
    const a = x / 110,
      h =
        19 * Math.exp(-((a - 0.64 + z * 0.11) ** 2) / 0.025) +
        10 * Math.exp(-((a - 0.28 - z * 0.03) ** 2) / 0.032);
    return [
      x * 2.7 - 5 + z * 30,
      47 + z * 15 - h * (0.45 + z * 0.8) - 8 * Math.sin(a * 8 + z * 3),
    ];
  };
  for (let j = 0; j <= 22; j++) {
    const z = j / 22;
    lines +=
      '<path d="' +
      Array.from({ length: 85 }, (_, i) => {
        const p = f((i * 110) / 84, z);
        return (i ? "L" : "M") + p.map((v) => v.toFixed(1)).join(" ");
      }).join(" ") +
      '" stroke-opacity="' +
      (0.18 + z * 0.56) +
      '"/>';
  }
  for (let i = 0; i <= 60; i++) {
    lines +=
      '<path d="' +
      Array.from(
        { length: 15 },
        (_, j) =>
          (j ? "L" : "M") +
          f((i * 110) / 60, j / 14)
            .map((v) => v.toFixed(1))
            .join(" "),
      ).join(" ") +
      '" stroke-opacity=".21"/>';
  }
  return (
    '<svg aria-hidden="true" class="terrain" viewBox="0 0 320 75" preserveAspectRatio="none" fill="none" stroke="#64e9ae" stroke-width=".7">' +
    lines +
    "</svg>"
  );
}
