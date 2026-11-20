import {
  assets,
  tape,
  START,
  names,
  round,
  network,
  returns,
  calibration,
  mean,
} from "./market.js";
import {
  book,
  risk,
  clusters,
  indexScore,
  dimensions,
  foundry,
  drawdown,
} from "./quant.js";
import {
  account,
  place,
  projected,
  cancel,
  advance,
  quote,
  comparison,
  record,
} from "./ledger.js";
import {
  icon,
  logo,
  money,
  number,
  pct,
  signed,
  day,
  hex,
  badgeAsset,
  spark,
  chart,
  terrain,
} from "./ui.js";
const key = "quantara.account.v1",
  app = document.querySelector("#app"),
  modal = document.querySelector("#modal");
function load() {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : account();
}
let s = load();
if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(s));
const pages = {
  command: "Command centre",
  market: "Market intelligence",
  terminal: "Trading terminal",
  portfolio: "Portfolio lab",
  rift: "RIFT laboratory",
  foundry: "Strategy foundry",
  autopsy: "Trade autopsy",
};
let page = pages[location.hash.slice(1)] ? location.hash.slice(1) : "command",
  i = 0,
  range = 63,
  tab = "index",
  ledgerTab = "Positions",
  chartRange = 21,
  search = "",
  sector = "All sectors",
  side = "Buy",
  orderType = "Market",
  quantity = "10",
  trigger = "",
  reportNo = 0,
  scenario = -10,
  foundType = "Momentum",
  look = 15,
  extra = 0,
  foundAsset = 0,
  menu = false,
  confirmOrder = null;
let rev = 0;
const current = () => tape.at(s.d),
  price = () => current().prices[i],
  regime = () => current().prob.indexOf(Math.max(...current().prob)),
  empty = (h, p) =>
    '<div class="empty"><strong>' + h + "</strong><span>" + p + "</span></div>";
const btn = (action, label, style = "btn", extra = "") =>
  '<button class="' +
  style +
  '" data-act="' +
  action +
  '" ' +
  extra +
  ">" +
  label +
  "</button>";
const link = (dest, label) =>
  '<a class="textlink" href="#' + dest + '">' + label + "</a>";
const title = (label, action = "") =>
  '<div class="cardhead"><h2>' + label + "</h2>" + action + "</div>";
const opt = (values, sel) =>
  values
    .map(
      (x) =>
        "<option " +
        (String(x) === String(sel) ? "selected" : "") +
        ">" +
        hex(x) +
        "</option>",
    )
    .join("");
const assetOpt = (sel) =>
  assets
    .map(
      (a, k) =>
        '<option value="' +
        k +
        '" ' +
        (k === sel ? "selected" : "") +
        ">" +
        a.sym +
        " · " +
        a.name +
        "</option>",
    )
    .join("");
const kpi = (label, value, foot, ic, accent = "") =>
  '<article class="kpi"><div class="kpih"><span>' +
  label +
  "</span><i>" +
  icon(ic, 17) +
  '</i></div><strong class="' +
  accent +
  '">' +
  value +
  "</strong><small>" +
  foot +
  "</small></article>";
const kv = (a, b) =>
  '<div class="kv"><span>' + a + "</span><b>" + b + "</b></div>";
const direction = (v) => (v > 0 ? "up" : v < 0 ? "down" : "");
function toast(msg) {
  const el = document.querySelector("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove("show"), 3800);
}
async function change(fn, msg) {
  const run = () => {
    const draft = load();
    fn(draft);
    localStorage.setItem(key, JSON.stringify(draft));
    s = draft;
    rev++;
    render();
    if (msg) toast(msg);
  };
  try {
    if (navigator.locks) await navigator.locks.request(key, run);
    else run();
  } catch (e) {
    toast(e.message);
  }
}
window.addEventListener("storage", (e) => {
  if (e.key === key) {
    s = load();
    rev++;
    if (modal.open) modal.close();
    render();
  }
});
function nav(id) {
  return (
    '<a class="nav ' +
    (page === id ? "active" : "") +
    '" href="#' +
    id +
    '" ' +
    (page === id ? 'aria-current="page"' : "") +
    ">" +
    icon(id) +
    "<span>" +
    pages[id] +
    "</span></a>"
  );
}
function shell(content) {
  const group = ["rift", "foundry", "autopsy"].includes(page)
    ? "Intelligence"
    : "Workspace";
  return (
    '<aside class="side ' +
    (menu ? "shown" : "") +
    '"><a href="#command" class="brand">' +
    logo +
    '<span>QUANTARA</span></a><div class="navgroup"><div class="eyebrow">Workspace</div>' +
    ["command", "market", "terminal", "portfolio"].map(nav).join("") +
    '</div><div class="navgroup"><div class="eyebrow">Intelligence</div>' +
    ["rift", "foundry", "autopsy"].map(nav).join("") +
    '</div><div class="sidebottom">' +
    btn("guide", icon("book") + " Simulation guide", "quiet") +
    '<div class="sideacct"><span class="avatar">Q</span><div><b>Paper account</b><small>Local workspace</small></div></div></div></aside>' +
    (menu ? btn("menu", "", "scrim", 'aria-label="Close navigation"') : "") +
    '<div class="canvas"><header><div class="breadcrumb">' +
    btn(
      "menu",
      icon("menu"),
      "mobile iconbtn",
      'aria-label="Open navigation"',
    ) +
    icon("layers", 17) +
    "<span>" +
    group +
    '</span><span class="slash">/</span><b>' +
    pages[page] +
    '</b></div><div class="header-meta"><span class="signal"></span> Simulation active <span class="divider"></span><span class="header-account">Paper account</span><span class="miniavatar">Q</span></div></header><main id="main">' +
    content +
    "<footer><span>" +
    logo +
    " QUANTARA</span>Fictional market data · Virtual capital only</footer></main></div>"
  );
}
const desc = {
  command:
    "Your portfolio, market regime and decision intelligence at a glance.",
  market: "Explore fictional instruments and their changing relationships.",
  terminal:
    "Simulate an order and inspect its portfolio impact before execution.",
  portfolio: "Review your positions, risk exposures and shadow strategy.",
  rift: "Inspect the models behind your simulated decisions.",
  foundry: "Test strategies across resampled market paths and trading costs.",
  autopsy: "Revisit closed trades alongside the choices available at entry.",
};
function heading(actions = "") {
  return (
    '<section class="pagehead"><div><div class="pagekicker"><i></i>' +
    (["rift", "foundry", "autopsy"].includes(page)
      ? "Decision intelligence"
      : "Trading workspace") +
    "</div><h1>" +
    pages[page] +
    "</h1><p>" +
    desc[page] +
    '</p></div><div class="actions">' +
    actions +
    "</div></section>"
  );
}
function simulationBand() {
  return (
    '<div class="session"><span>' +
    icon("calendar", 15) +
    " Sim. date <b>" +
    day(s.d) +
    "</b></span>" +
    btn("advance", icon("next", 14) + " Advance session", "subtle") +
    "</div>"
  );
}
function regimeCard() {
  const probs = current().prob,
    j = regime();
  return (
    '<article class="panel regime">' +
    title(
      icon("radar") + " Regime monitor",
      '<span class="engineTag">RIFT</span>',
    ) +
    '<div class="regbody"><div class="eyebrow">Dominant regime</div><div class="regname">' +
    names[j] +
    "</div>" +
    terrain() +
    '<div class="probset">' +
    probs
      .map(
        (p, k) =>
          '<div class="prob"><div><span><i class="dot c' +
          k +
          '"></i>' +
          names[k] +
          "</span><b>" +
          pct(p, 1) +
          '</b></div><div class="track"><i class="c' +
          k +
          '" style="width:' +
          pct(p) +
          '"></i></div></div>',
      )
      .join("") +
    '</div></div><div class="cardfoot">' +
    link("rift", "Explore RIFT laboratory") +
    "</div></article>"
  );
}
function pulseCard() {
  const eq = tab === "equity",
    hist = s.history.slice(-range),
    rows = eq ? hist.map((h) => tape.at(h.d)) : tape.window(s.d, range),
    v = eq ? hist.map((h) => h.equity) : rows.map((r) => r.idx),
    delta = v.at(-1) / v[0] - 1;
  return (
    '<article class="panel pulse">' +
    title(
      icon("pulse") + " Market pulse",
      '<div class="segments">' +
        [
          [21, "1M"],
          [63, "3M"],
          [126, "6M"],
        ]
          .map(([k, l]) =>
            btn(
              "range",
              l,
              range === k ? "sel" : "",
              'data-value="' + k + '" aria-pressed="' + (range === k) + '"',
            ),
          )
          .join("") +
        "</div>",
    ) +
    '<div class="pulseinner"><div class="chartlegend"><span class="linekey"></span><select aria-label="Chart series" id="series">' +
    opt(
      ["QX Composite", "Portfolio equity"],
      eq ? "Portfolio equity" : "QX Composite",
    ) +
    '</select></div><div class="quote">' +
    (eq ? money(v.at(-1), 0) : number(v.at(-1))) +
    ' <span class="gain ' +
    direction(delta) +
    '">' +
    signed(delta) +
    "</span></div>" +
    chart(rows, v, {
      title: eq ? "Portfolio equity" : "QX Composite fictional market index",
    }) +
    '</div><div class="chartfoot"><span class="dot c0"></span>' +
    (eq ? "Actual portfolio" : "Simulated market index") +
    '<span class="right">' +
    rows.length +
    " daily closes</span></div></article>"
  );
}
function assetTable(ids, watch = false) {
  if (!ids.length)
    return empty(
      watch ? "Your watchlist is empty" : "No matching instruments",
      watch
        ? "Star an instrument in Market intelligence to follow it here."
        : "Try a different search or sector.",
    );
  return (
    '<div class="tablewrap"><table><thead><tr><th>Instrument</th><th>Last price</th><th>Day change</th><th>21 sessions</th><th><span class="sr">Watch</span></th></tr></thead><tbody>' +
    ids
      .map((k) => {
        const a = assets[k],
          v = current().prices[k],
          z = v / tape.at(s.d - 1).prices[k] - 1;
        return (
          "<tr><td>" +
          btn(
            "asset",
            badgeAsset(k) +
              "<span><b>" +
              a.sym +
              "</b><small>" +
              a.name +
              "</small></span>",
            "asset",
            'data-i="' + k + '"',
          ) +
          "</td><td>" +
          money(v) +
          '</td><td class="' +
          direction(z) +
          '">' +
          signed(z) +
          "</td><td>" +
          spark(
            tape.window(s.d, 21).map((r) => r.prices[k]),
            z >= 0 ? "#65d9a6" : "#e9959e",
          ) +
          "</td><td>" +
          btn(
            "watch",
            icon("star", 16),
            "star " + (s.watch.includes(k) ? "on" : ""),
            'data-i="' +
              k +
              '" aria-label="' +
              (s.watch.includes(k) ? "Unwatch " : "Watch ") +
              a.sym +
              '" aria-pressed="' +
              s.watch.includes(k) +
              '"',
          ) +
          "</td></tr>"
        );
      })
      .join("") +
    "</tbody></table></div>"
  );
}
function alertCard() {
  const b = book(s),
    r = risk(b.weights, s.d),
    large = Math.max(...b.weights);
  return (
    '<article class="panel">' +
    title(
      icon("shield") + " Risk overview",
      link("portfolio", "Portfolio lab"),
    ) +
    '<div class="pad">' +
    kv("Market exposure", pct(b.exposure)) +
    kv("Robust daily shortfall", pct(r.rob)) +
    kv("Largest position", pct(large)) +
    '<p class="note">' +
    (b.exposure < 0.000001
      ? "Your capital is held in cash. Preview a simulated trade to see how portfolio risk changes."
      : large > 0.25
        ? "One instrument exceeds 25% of portfolio equity. Review its dependency cluster before increasing exposure."
        : "Position sizes are within the illustrative 25% concentration threshold.") +
    "</p></div></article>"
  );
}
function command() {
  const b = book(s),
    score = indexScore(s),
    daily = b.equity - (s.history.at(-2)?.equity ?? 1000000);
  return (
    heading(btn("trade", icon("plus", 16) + " Place trade", "primary")) +
    simulationBand() +
    '<div class="kpis">' +
    kpi(
      "Portfolio value",
      money(b.equity, 0),
      "Starting capital " + money(1000000, 0),
      "wallet",
    ) +
    kpi(
      "Available cash",
      money(s.cash, 0),
      pct(s.cash / b.equity, 1) + " of portfolio",
      "coins",
    ) +
    kpi(
      "Daily P&L",
      (daily > 0 ? "+" : "") + money(daily, 2),
      '<span class="' +
        direction(b.equity - 1000000) +
        '">' +
        signed(b.equity / 1e6 - 1) +
        "</span> all time",
      "pnl",
    ) +
    kpi(
      "RIFT Intelligence Index",
      score.value === null
        ? "— <em>/ 100</em>"
        : number(score.value, 0) + " <em>/ 100</em>",
      score.value === null
        ? "Awaiting first decision"
        : pct(score.coverage, 0) + " evidence coverage",
      "rift",
      "mint",
    ) +
    '</div><div class="dashgrid">' +
    pulseCard() +
    regimeCard() +
    '<article class="panel">' +
    title(icon("star") + " Watchlist", link("market", "View markets")) +
    assetTable(s.watch, true) +
    "</article>" +
    alertCard() +
    "</div>"
  );
}
function graphCard() {
  const { edges, group } = network(s.d),
    pos = assets.map((a, k) => [
      180 + 117 * Math.cos((k * Math.PI) / 4 - 0.38),
      99 + 74 * Math.sin((k * Math.PI) / 4 - 0.38),
    ]),
    cols = [
      "#6ee1b1",
      "#9db6ff",
      "#e6a875",
      "#ad91dd",
      "#7fcbeb",
      "#e89fab",
      "#c0ca7c",
      "#84c8b4",
    ];
  const strongest = [...edges].sort(
    (a, b) => Math.abs(b.delta) - Math.abs(a.delta),
  )[0];
  return (
    '<article class="panel">' +
    title(icon("rift") + " Dependency network") +
    '<div class="pad"><svg class="network" role="img" aria-label="Rolling correlation network" viewBox="0 0 360 205">' +
    edges
      .filter((e) => e.weight >= 0.52)
      .map(
        (e) =>
          '<line x1="' +
          pos[e.i][0] +
          '" y1="' +
          pos[e.i][1] +
          '" x2="' +
          pos[e.j][0] +
          '" y2="' +
          pos[e.j][1] +
          '" stroke="#57bfa1" stroke-opacity="' +
          e.weight +
          '" stroke-width="' +
          e.weight * 3 +
          '"><title>' +
          assets[e.i].sym +
          " / " +
          assets[e.j].sym +
          " " +
          number(e.weight) +
          "</title></line>",
      )
      .join("") +
    assets
      .map(
        (a, k) =>
          '<g><circle cx="' +
          pos[k][0] +
          '" cy="' +
          pos[k][1] +
          '" r="14" fill="#202b2b" stroke="' +
          cols[group[k]] +
          '"/><text x="' +
          pos[k][0] +
          '" y="' +
          (pos[k][1] + 4) +
          '" text-anchor="middle">' +
          a.sym +
          "</text></g>",
      )
      .join("") +
    "</svg>" +
    kv("45-session clusters", new Set(group).size) +
    kv(
      "Largest correlation shift",
      assets[strongest.i].sym +
        " / " +
        assets[strongest.j].sym +
        " " +
        (strongest.delta > 0 ? "+" : "") +
        number(strongest.delta),
    ) +
    kv(
      "Flagged relationship shifts",
      edges.filter((e) => Math.abs(e.shiftZ) > 2).length + " / " + edges.length,
    ) +
    '<p class="note">Anomaly flags use an absolute Fisher-transformed correlation shift above two standard errors. Pairwise dependence makes this a screening heuristic.</p><p class="note">Links join pairs with correlation ≥ 0.52. Connected nodes share a cluster. Shifts compare adjacent 45-session windows.</p></div></article>'
  );
}
function filteredIds() {
  return assets
    .filter(
      (a) =>
        (sector === "All sectors" || a.sector === sector) &&
        (a.sym + " " + a.name).toLowerCase().includes(search.toLowerCase()),
    )
    .map((a) => a.i);
}
function market() {
  const sectors = [...new Set(assets.map((a) => a.sector))];
  return (
    heading() +
    simulationBand() +
    '<article class="panel">' +
    title(
      icon("market") + " Instrument explorer",
      '<span class="muted">8 fictional instruments</span>',
    ) +
    '<div class="filters"><label class="search">' +
    icon("search") +
    '<input id="search" aria-label="Search instruments" placeholder="Search name or symbol" value="' +
    hex(search) +
    '"></label><select id="sector" aria-label="Filter by sector">' +
    opt(["All sectors", ...sectors], sector) +
    '</select></div><div id="marketrows">' +
    assetTable(filteredIds()) +
    '</div></article><div class="twocol">' +
    graphCard() +
    '<article class="panel">' +
    title("Sector movements") +
    '<div class="pad">' +
    sectors
      .map((sec) => {
        const change = mean(
          assets
            .filter((a) => a.sector === sec)
            .map(
              (a) => current().prices[a.i] / tape.at(s.d - 1).prices[a.i] - 1,
            ),
        );
        return kv(
          sec,
          '<span class="' +
            direction(change) +
            '">' +
            signed(change) +
            "</span>",
        );
      })
      .join("") +
    '<p class="note">Equal-weight daily return across fictional instruments in each sector.</p></div></article></div>'
  );
}
function orderInput() {
  return {
    i,
    side,
    type: orderType,
    q: Number(quantity),
    trigger: orderType === "Market" ? null : Number(trigger),
  };
}
function impacts() {
  const o = orderInput();
  try {
    const p = projected(s, o),
      b = book(s),
      a = book(p),
      r = risk(b.weights, s.d),
      rr = risk(a.weights, s.d),
      c = clusters(s, i),
      cc = clusters(p, i),
      pre = indexScore(s),
      post = indexScore(p);
    const rows = [
      ["Instrument allocation", pct(b.weights[i]), pct(a.weights[i])],
      [assets[i].sector + " exposure", pct(c.sector), pct(cc.sector)],
      ["Cluster exposure", pct(c.cluster), pct(cc.cluster)],
      ["Annualized volatility", pct(r.vol), pct(rr.vol)],
      ["Daily CVaR · 95%", pct(r.es), pct(rr.es)],
      ["Robust daily CVaR", pct(r.rob), pct(rr.rob)],
      [
        "RIFT Index",
        pre.value == null ? "—" : number(pre.value, 1),
        post.value == null ? "—" : number(post.value, 1),
      ],
    ];
    return (
      '<table class="impact"><thead><tr><th>Measure</th><th>Current</th><th>Projected</th></tr></thead><tbody>' +
      rows
        .map(
          (x) => "<tr>" + x.map((v) => "<td>" + v + "</td>").join("") + "</tr>",
        )
        .join("") +
      '</tbody></table><p class="note">A ' +
      o.side.toLowerCase() +
      " changes exposure to " +
      assets[i].sym +
      " and its cluster (" +
      cc.related.join(", ") +
      "). Estimates reuse the last 120 daily returns. Pending previews reprice the selected instrument to its trigger scenario and respect the execution limit.</p>"
    );
  } catch (e) {
    return '<p class="note error">' + hex(e.message) + "</p>";
  }
}
function holdings() {
  const b = book(s),
    ids = assets.filter((a) => s.pos[a.i].q);
  return !ids.length
    ? empty(
        "No open positions",
        "Filled buy orders appear here with average cost and marked P&L.",
      )
    : '<div class="tablewrap"><table><thead><tr><th>Instrument</th><th>Qty</th><th>Avg. cost</th><th>Market value</th><th>Unrealized P&L</th></tr></thead><tbody>' +
        ids
          .map((a) => {
            const p = s.pos[a.i],
              v = b.values[a.i];
            return (
              "<tr><td>" +
              btn("asset", a.sym, "textlink", 'data-i="' + a.i + '"') +
              "</td><td>" +
              p.q +
              "</td><td>" +
              money(p.basis / p.q) +
              "</td><td>" +
              money(v) +
              '</td><td class="' +
              direction(v - p.basis) +
              '">' +
              money(v - p.basis) +
              "</td></tr>"
            );
          })
          .join("") +
        "</tbody></table></div>";
}
function orders() {
  return !s.orders.length
    ? empty("No simulated orders", "Submit an order to start your ledger.")
    : '<div class="tablewrap"><table><thead><tr><th>Order</th><th>Submitted</th><th>Instrument</th><th>Side / qty</th><th>Type</th><th>Fill / trigger</th><th>Status</th></tr></thead><tbody>' +
        [...s.orders]
          .reverse()
          .map(
            (o) =>
              "<tr><td>#" +
              o.id +
              "</td><td>" +
              day(o.created) +
              "</td><td>" +
              assets[o.i].sym +
              "</td><td>" +
              o.side +
              " · " +
              o.q +
              "</td><td>" +
              o.type +
              "</td><td>" +
              (o.price ? money(o.price) : money(o.trigger)) +
              "</td><td>" +
              o.status +
              (o.reason ? " · " + hex(o.reason) : "") +
              (o.status === "Open"
                ? " " +
                  btn("cancel", "Cancel", "textlink", 'data-id="' + o.id + '"')
                : "") +
              "</td></tr>",
          )
          .join("") +
        "</tbody></table></div>";
}
function terminal() {
  const a = assets[i],
    rows = tape.window(s.d, chartRange);
  return (
    heading() +
    simulationBand() +
    '<div class="tradegrid"><article class="panel">' +
    title(
      icon("terminal") + " Price history",
      '<div class="segments">' +
        [21, 63, 126]
          .map((x, n) =>
            btn(
              "chartRange",
              ["1M", "3M", "6M"][n],
              x === chartRange ? "sel" : "",
              'data-value="' + x + '"',
            ),
          )
          .join("") +
        "</div>",
    ) +
    '<div class="pad"><label class="field">Instrument<select id="instrument">' +
    assetOpt(i) +
    '</select></label><div class="quote">' +
    money(price()) +
    ' <span class="gain ' +
    direction(price() - tape.at(s.d - 1).prices[i]) +
    '">' +
    signed(price() / tape.at(s.d - 1).prices[i] - 1) +
    "</span></div>" +
    chart(
      rows,
      rows.map((r) => r.prices[i]),
      { bars: rows.map((r) => r.bars[i]), title: a.name + " daily candles" },
    ) +
    '<div class="note">' +
    a.sector +
    ' · Fictional daily OHLC</div></div></article><article class="panel">' +
    title("Order ticket") +
    '<div class="pad"><div class="segwide">' +
    ["Buy", "Sell"]
      .map((x) =>
        btn("side", x, x === side ? "sel" : "", 'data-side="' + x + '"'),
      )
      .join("") +
    '</div><label class="field">Order type<select id="otype">' +
    opt(["Market", "Limit", "Stop-loss"], orderType) +
    '</select></label><label class="field">Quantity<input id="quantity" type="number" step="1" min="1" value="' +
    hex(quantity) +
    '"></label>' +
    (orderType === "Market"
      ? ""
      : '<label class="field">' +
        (orderType === "Limit" ? "Limit" : "Stop trigger") +
        ' price (₹)<input id="trigger" type="number" min=".01" step=".01" value="' +
        hex(trigger) +
        '"></label>') +
    kv("Available cash", money(s.cash)) +
    btn("review", "Review " + side.toLowerCase() + " order", "primary full") +
    '</div></article></div><div class="twocol"><article class="panel">' +
    title("Decision impact preview") +
    '<div class="pad" id="impacts">' +
    impacts() +
    '</div></article><article class="panel">' +
    title(
      "Account ledger",
      '<select id="ledger" aria-label="Ledger view">' +
        opt(["Positions", "Orders"], ledgerTab) +
        "</select>",
    ) +
    (ledgerTab === "Positions" ? holdings() : orders()) +
    "</article></div>"
  );
}
function riskTable() {
  const r = risk(book(s).weights, s.d);
  return (
    kv("Annualized volatility", pct(r.vol)) +
    kv("Historical daily VaR · 95%", pct(r.var)) +
    kv("Historical daily CVaR · 95%", pct(r.es)) +
    kv("Robust daily CVaR · 95%", pct(r.rob)) +
    kv("Equity maximum drawdown", pct(comparison(s, "equity").dd)) +
    kv("Equity-weight concentration (HHI)", number(r.hhi, 4))
  );
}
function stress() {
  const b = book(s),
    ret = (b.exposure * scenario) / 100;
  return (
    kv("Projected equity", money(b.equity * (1 + ret))) +
    kv("Portfolio impact", signed(ret))
  );
}
function portfolio() {
  const b = book(s),
    real = s.reports.reduce((a, r) => a + r.pnl, 0),
    unreal = b.values.reduce((a, v, i) => a + v - s.pos[i].basis, 0),
    a = comparison(s, "equity"),
    h = comparison(s, "shadow"),
    shadow = book(s.shadow, s.d),
    g = network(s.d).group;
  const comp = (l, x, y) =>
    "<tr><td>" + l + "</td><td>" + x + "</td><td>" + y + "</td></tr>";
  return (
    heading(btn("trade", icon("plus", 16) + " Place trade", "primary")) +
    simulationBand() +
    '<div class="kpis">' +
    kpi(
      "Portfolio value",
      money(b.equity, 0),
      "Marked at simulated close",
      "portfolio",
    ) +
    kpi("Realized P&L", money(real), "After fees and slippage", "coins") +
    kpi("Unrealized P&L", money(unreal), "Against fee-inclusive cost", "pnl") +
    kpi("Cumulative return", signed(a.ret), "Since initialization", "chart") +
    '</div><article class="panel">' +
    title("Open holdings") +
    holdings() +
    '</article><div class="twocol"><article class="panel">' +
    title("Allocation & exposure") +
    '<div class="pad">' +
    kv("Cash", pct(s.cash / b.equity)) +
    [...new Set(assets.map((a) => a.sector))]
      .map((sec) =>
        kv(
          sec,
          pct(
            b.weights.reduce(
              (t, w, k) => t + (assets[k].sector === sec ? w : 0),
              0,
            ),
          ),
        ),
      )
      .join("") +
    [...new Set(g)]
      .map((id) =>
        kv(
          "Cluster · " +
            assets
              .filter((a) => g[a.i] === id)
              .map((a) => a.sym)
              .join(" / "),
          pct(b.weights.reduce((v, w, k) => v + (g[k] === id ? w : 0), 0)),
        ),
      )
      .join("") +
    '</div></article><article class="panel">' +
    title("Portfolio risk") +
    '<div class="pad">' +
    riskTable() +
    '<label class="field">Parallel price shock<select id="scenario">' +
    opt([-30, -20, -10, -5, 5, 10, 20], scenario) +
    '</select></label><div id="stress">' +
    stress() +
    '</div><p class="note">All held instruments move by the selected percentage. Cash is unchanged.</p></div></article><article class="panel">' +
    title("Shadow portfolio") +
    '<div class="pad"><table class="impact"><thead><tr><th>Measure</th><th>Actual</th><th>Shadow</th></tr></thead><tbody>' +
    comp("Return", signed(a.ret), signed(h.ret)) +
    comp("Max. drawdown", pct(a.dd), pct(h.dd)) +
    comp(
      "Annualized Sharpe",
      a.sharpe == null ? "—" : number(a.sharpe),
      h.sharpe == null ? "—" : number(h.sharpe),
    ) +
    comp("Exposure", pct(b.exposure), pct(shadow.exposure)) +
    comp(
      "Concentration",
      number(risk(b.weights, s.d).hhi, 3),
      number(risk(shadow.weights, s.d).hhi, 3),
    ) +
    names
      .map((n, j) => {
        const t = s.history
          .slice(1)
          .map((x, k) => [x, s.history[k]])
          .filter(([, prev]) => prev.regime === j);
        return comp(
          n + " avg. return",
          ...["equity", "shadow"].map((key) =>
            t.length
              ? signed(mean(t.map(([x, prev]) => x[key] / prev[key] - 1)))
              : "—",
          ),
        );
      })
      .join("") +
    "</tbody></table>" +
    kv("Shadow minus actual equity", money(shadow.equity - b.equity)) +
    '<p class="note">Every five sessions the shadow strategy spreads 20–70% exposure by inverse trailing volatility. Its exposure rises with the filtered bullish probability. Both ledgers pay trading costs.</p></div></article><article class="panel">' +
    title("Account history") +
    orders() +
    "</article></div>"
  );
}
function rift() {
  const score = indexScore(s),
    cal = calibration(s.d),
    history = s.history.filter((h) => h.rii != null);
  return (
    heading() +
    simulationBand() +
    '<div class="twocol">' +
    regimeCard() +
    graphCard() +
    '<article class="panel">' +
    title("Tail risk laboratory") +
    '<div class="pad">' +
    riskTable() +
    '<p class="note">Nominal expected shortfall averages the worst 5% of 120 fixed-weight portfolio returns. The robust model lets each observed day receive up to twice its original probability, equivalent to averaging the worst 2.5%. Unseen crashes require separate stress scenarios.</p>' +
    link("portfolio", "Run a portfolio stress test") +
    '</div></article><article class="panel">' +
    title("Regime calibration") +
    '<div class="pad">' +
    kv("Multiclass Brier score", number(cal.brier, 3)) +
    kv("Uniform baseline", number(2 / 3, 3)) +
    kv("Dominant-state changes", cal.changes + " / " + (cal.n - 1)) +
    '<table class="impact"><thead><tr><th>Confidence</th><th>Days</th><th>Avg. belief</th><th>Hit rate</th></tr></thead><tbody>' +
    cal.bins
      .map(
        ([n, p, a], i) =>
          "<tr><td>" +
          ["Below 60%", "60–80%", "80–100%"][i] +
          "</td><td>" +
          n +
          "</td><td>" +
          (n ? pct(p / n, 1) : "—") +
          "</td><td>" +
          (n ? pct(a / n, 1) : "—") +
          "</td></tr>",
      )
      .join("") +
    '</tbody></table><p class="note">A three-state hidden Markov filter combines the previous posterior and today’s index return. Posterior probability describes the current state. Synthetic state labels are used only for evaluation.</p></div></article></div><article class="panel spaced">' +
    title(
      "RIFT Intelligence Index",
      btn("weights", "Edit weights", "btn small"),
    ) +
    '<div class="pad">' +
    kv(
      "Current score",
      score.value === null
        ? "Awaiting evidence"
        : number(score.value, 1) + " / 100",
    ) +
    kv("Weighted coverage", pct(score.coverage, 0)) +
    kv("Decision sample", score.entries + " recent buys") +
    dimensions
      .map((x, j) =>
        kv(
          x + " · " + s.weights[j] + "%",
          score.parts[j] == null ? "No evidence" : number(score.parts[j], 1),
        ),
      )
      .join("") +
    (history.length > 1
      ? chart(
          history.map((h) => tape.at(h.d)),
          history.map((h) => h.rii),
          { title: "RIFT score history" },
        )
      : '<p class="note">Score evolution appears after two scored sessions.</p>') +
    '<p class="note">Available components are renormalized to their active weights. Resilience falls to zero at 40% annual volatility and robustness at 6% robust daily shortfall. Regime consistency measures adherence to a regime-dependent exposure budget. Decision quality also considers concentration. Strategy stability uses the last Foundry run. Small samples and overlapping components limit reliability.</p>' +
    link("foundry", "Open Strategy foundry") +
    "</div></article>"
  );
}
function histogram(v) {
  const min = Math.min(...v),
    span = Math.max(...v) - min || 0.0001,
    bins = Array(20).fill(0);
  v.forEach((x) => bins[Math.min(19, Math.floor(((x - min) / span) * 20))]++);
  return (
    '<div class="hist" role="img" aria-label="Distribution of simulated returns">' +
    bins
      .map(
        (n, k) =>
          '<i style="height:' +
          Math.max(1, (n / Math.max(...bins)) * 100) +
          "%;background:" +
          (min + (span * (k + 0.5)) / 20 < 0 ? "#ac737e" : "#65c99c") +
          '"><title>' +
          n +
          " paths</title></i>",
      )
      .join("") +
    '</div><div class="histlabels"><span>' +
    signed(min) +
    "</span><span>" +
    signed(min + span) +
    "</span></div>"
  );
}
function strategy() {
  const f = s.foundry;
  return (
    heading() +
    simulationBand() +
    '<div class="tradegrid"><article class="panel">' +
    title(
      "Return distribution",
      f ? '<span class="engineTag">' + f.paths + " paths</span>" : "",
    ) +
    '<div class="pad">' +
    (f
      ? '<div class="eyebrow">Median path return</div><div class="quote">' +
        signed(f.median) +
        "</div>" +
        histogram(f.rets) +
        '<p class="note">' +
        assets[f.i].sym +
        " · " +
        f.type +
        " · " +
        f.look +
        "-session lookback · " +
        day(f.d) +
        "</p>"
      : empty(
          "Run your first experiment",
          "Select an instrument, a trading rule and its lookback to generate 300 reproducible paths.",
        )) +
    '</div></article><article class="panel">' +
    title("Experiment settings") +
    '<div class="pad"><label class="field">Instrument<select id="foundAsset">' +
    assetOpt(foundAsset) +
    '</select></label><label class="field">Strategy<select id="foundType">' +
    opt(["Momentum", "Mean reversion", "Hold"], foundType) +
    '</select></label><label class="field">Lookback (sessions)<select id="look">' +
    opt([5, 10, 15, 20, 30], look) +
    '</select></label><label class="field">Additional cost per turn (bps)<select id="extra">' +
    opt([0, 5, 10, 25], extra) +
    "</select></label>" +
    btn("run", "Run experiment", "primary full") +
    "</div></article></div>" +
    (f
      ? '<div class="twocol"><article class="panel">' +
        title("Robustness results") +
        '<div class="pad">' +
        kv("Historical net return", signed(f.historical)) +
        kv("Positive paths", pct(f.pos, 1)) +
        kv("95% Wilson interval", pct(f.ci[0], 1) + " – " + pct(f.ci[1], 1)) +
        kv("5th–95th return percentile", signed(f.lo) + " to " + signed(f.hi)) +
        kv("Median / 95th drawdown", pct(f.dd) + " / " + pct(f.badDD)) +
        kv("Historical Sharpe", number(f.sharpe)) +
        kv("Strategy stability", number(f.stability, 1) + " / 100") +
        '</div></article><article class="panel">' +
        title("Parameter sensitivity") +
        '<div class="pad">' +
        f.sweep
          .map((x) => kv(x.k + "-session lookback", signed(x.ret)))
          .join("") +
        '<p class="note">Signals use data through the current close and earn the next close-to-close return. Fixed five-day blocks preserve short-range dependence. The Wilson interval measures Monte Carlo sampling error in positive-path frequency.</p></div></article></div>'
      : "") +
    (s.runs.length
      ? '<article class="panel spaced">' +
        title("Experiment comparison") +
        '<div class="tablewrap"><table><thead><tr><th>Strategy</th><th>Symbol</th><th>Lookback</th><th>Cost add-on</th><th>Sim. date</th><th>Median</th><th>Lower tail</th></tr></thead><tbody>' +
        s.runs
          .map(
            (x) =>
              "<tr><td>" +
              x.type +
              "</td><td>" +
              assets[x.i].sym +
              "</td><td>" +
              x.look +
              "</td><td>" +
              x.extra * 10000 +
              " bps</td><td>" +
              day(x.d) +
              "</td><td>" +
              signed(x.median) +
              "</td><td>" +
              signed(x.lo) +
              "</td></tr>",
          )
          .join("") +
        "</tbody></table></div></article>"
      : "")
  );
}
function autopsy() {
  const r = s.reports[reportNo] || s.reports[0];
  return (
    heading(btn("trade", icon("plus", 16) + " Place trade", "primary")) +
    simulationBand() +
    (r
      ? '<article class="panel">' +
        title(
          "Closing report",
          '<select aria-label="Choose closed trade" id="report">' +
            s.reports
              .map(
                (x, k) =>
                  '<option value="' +
                  k +
                  '" ' +
                  (r === x ? "selected" : "") +
                  ">#" +
                  x.order +
                  " · " +
                  assets[x.i].sym +
                  "</option>",
              )
              .join("") +
            "</select>",
        ) +
        '<div class="pad"><div class="quote">' +
        assets[r.i].sym +
        " <em>" +
        r.q +
        " shares closed</em></div>" +
        kv("First entry / exit", day(r.first) + " / " + day(r.day)) +
        kv(
          "Weighted entry / exit price",
          money(r.entry) + " / " + money(r.exit),
        ) +
        kv("Realized P&L", money(r.pnl)) +
        kv("Fees / slippage", money(r.fees) + " / " + money(r.slip)) +
        kv("Original decision score", number(r.quality, 1) + " / 100") +
        kv("Decision first assessed", day(r.decisionDay ?? r.first)) +
        kv(
          "Fill-time risk score",
          number(r.entryQuality ?? r.quality, 1) + " / 100",
        ) +
        kv("Robust daily shortfall at entry", pct(r.risk)) +
        kv("Entry cluster membership", r.related.join(", ")) +
        kv(
          "Entry regime mix",
          r.prob.map((p, k) => names[k] + " " + pct(p, 0)).join(" · "),
        ) +
        '</div></article><article class="panel spaced">' +
        title("Counterfactual outcomes") +
        '<div class="pad">' +
        r.alternatives
          .map((a) => {
            const max = Math.max(
              1,
              ...r.alternatives.map((x) => Math.abs(x.pnl)),
            );
            return (
              '<div class="counter">' +
              kv(a.name, money(a.pnl)) +
              '<div class="track"><i style="width:' +
              pct(Math.abs(a.pnl) / max) +
              ";background:" +
              (a.pnl < 0 ? "#d48d98" : "#62dba6") +
              '"></i></div></div>'
            );
          })
          .join("") +
        kv("Hindsight utility regret", money(r.regret)) +
        '<p class="note">Utility is net P&L minus half of any loss. Regret compares realized utility with the highest alternative utility. The original score uses the exposure budget, robust downside and concentration available at submission. A favourable outcome alone cannot establish a repeatable edge.</p></div></article>'
      : '<article class="panel">' +
        title(icon("autopsy") + " Closed trades") +
        empty(
          "Your first Trade Autopsy starts with a closed position",
          "Buy a fictional instrument, advance a session and sell some or all of the position. The report compares your outcome with alternative decisions.",
        ) +
        '<div class="emptyaction">' +
        btn("trade", "Open trading terminal", "btn") +
        "</div></article>")
  );
}
function render() {
  document.title = "QUANTARA · " + pages[page];
  app.innerHTML = shell(
    { command, market, terminal, portfolio, rift, foundry: strategy, autopsy }[
      page
    ](),
  );
}
function go(id) {
  menu = false;
  if (location.hash === "#" + id) {
    page = id;
    render();
  } else location.hash = id;
}
window.addEventListener("hashchange", () => {
  page = pages[location.hash.slice(1)] ? location.hash.slice(1) : "command";
  menu = false;
  render();
  window.scrollTo(0, 0);
});
function dialog(h, body) {
  modal.innerHTML =
    '<div class="dialoghead"><h2>' +
    h +
    "</h2>" +
    btn("dismiss", icon("close"), "iconbtn", 'aria-label="Close dialog"') +
    '</div><div class="pad">' +
    body +
    "</div>";
  if (!modal.open) modal.showModal();
}
function review() {
  try {
    const o = orderInput(),
      p = projected(s, o),
      filled = p.orders.at(-1);
    confirmOrder = { o, rev };
    dialog(
      "Confirm simulated order",
      kv("Instrument", assets[i].sym + " · " + assets[i].name) +
        kv("Order", side + " " + o.q + " · " + orderType) +
        (orderType !== "Market"
          ? kv("Trigger / limit", money(o.trigger))
          : "") +
        kv("Estimated fill", money(filled.price)) +
        kv("Estimated fee", money(filled.fee)) +
        kv(
          "Estimated cash " + (side === "Buy" ? "debit" : "credit"),
          money(side === "Buy" ? filled.cost : filled.net),
        ) +
        '<p class="note">Uses virtual capital. Pending orders are revalidated at each simulated close.</p>' +
        btn("confirm", "Confirm paper " + side.toLowerCase(), "primary full"),
    );
  } catch (e) {
    toast(e.message);
  }
}
document.addEventListener("click", async (e) => {
  const el = e.target.closest("[data-act]");
  if (!el) return;
  const act = el.dataset.act;
  if (act === "menu") {
    menu = !menu;
    render();
  }
  if (act === "advance")
    await change(advance, "Advanced one simulated session");
  if (act === "trade") {
    side = "Buy";
    go("terminal");
  }
  if (act === "asset") {
    i = Number(el.dataset.i);
    trigger = String(price());
    go("terminal");
  }
  if (act === "range") {
    range = Number(el.dataset.value);
    render();
  }
  if (act === "chartRange") {
    chartRange = Number(el.dataset.value);
    render();
  }
  if (act === "watch") {
    const k = Number(el.dataset.i);
    await change((d) => {
      d.watch = d.watch.includes(k)
        ? d.watch.filter((x) => x !== k)
        : [...d.watch, k];
    });
  }
  if (act === "side") {
    side = el.dataset.side;
    render();
  }
  if (act === "review") review();
  if (act === "confirm") {
    const c = confirmOrder;
    if (!c) return;
    confirmOrder = null;
    modal.close();
    if (c.rev !== rev) {
      toast("Account changed. Review the order again.");
      return;
    }
    await change((d) => {
      if (d.d !== s.d || d.seq !== s.seq)
        throw Error("Account changed. Review again.");
      const o = place(d, c.o);
      ledgerTab = o.status === "Open" ? "Orders" : "Positions";
      toast(
        o.status === "Open" ? "Conditional order placed" : "Paper order filled",
      );
    });
  }
  if (act === "cancel")
    await change((d) => cancel(d, Number(el.dataset.id)), "Order cancelled");
  if (act === "dismiss") modal.close();
  if (act === "guide")
    dialog(
      "Simulation guide",
      '<p>Start with ₹10,00,000 in virtual cash. Explore the fictional market, review an order and confirm its impact.</p><ol><li>Choose an instrument in the trading terminal.</li><li>Review and confirm a paper buy. Advance a session to move prices and process pending orders.</li><li>Sell the position and open Trade autopsy to compare alternative decisions.</li></ol><p class="note">Your ledger is saved in this browser. Each session is one fictional weekday close. Slippage is 3 bps and fees are 5 bps per side.</p>' +
        (location.hostname.endsWith(".chatgpt.site")
          ? '<p><a class="textlink" href="./quantara-source.zip" download>Download project source &amp; README</a></p>'
          : "") +
        btn("resetask", icon("reset", 16) + " Reset simulation", "btn"),
    );
  if (act === "resetask")
    dialog(
      "Reset this simulation?",
      '<p>This clears your orders, holdings, reports and experiments in this browser and restores ₹10,00,000 in virtual cash.</p><div class="actions">' +
        btn("dismiss", "Keep account", "btn") +
        btn("reset", "Reset account", "danger") +
        "</div>",
    );
  if (act === "reset") {
    modal.close();
    await change((d) => Object.assign(d, account()), "Virtual account reset");
    reportNo = 0;
    go("command");
  }
  if (act === "run")
    await change((d) => {
      const f = foundry(d.d, foundAsset, look, foundType, extra / 10000);
      d.foundry = f;
      const { rets, ...summary } = f;
      d.runs.unshift(summary);
      d.runs = d.runs.slice(0, 20);
      record(d);
    }, "300 simulation paths completed");
  if (act === "weights")
    dialog(
      "Index weights",
      '<p class="note">Set nonnegative weights summing to 100. Missing components are excluded until evidence becomes available.</p>' +
        dimensions
          .map(
            (x, j) =>
              '<label class="field">' +
              x +
              ' (%)<input type="number" min="0" max="100" data-weight value="' +
              s.weights[j] +
              '"></label>',
          )
          .join("") +
        btn("saveweights", "Save weights", "primary full"),
    );
  if (act === "saveweights") {
    const w = [...modal.querySelectorAll("[data-weight]")].map(
      (x) => x.valueAsNumber,
    );
    if (
      w.some((x) => !Number.isFinite(x) || x < 0 || x > 100) ||
      Math.abs(w.reduce((a, b) => a + b) - 100) > 0.0001
    ) {
      toast("Weights must be nonnegative and sum to 100.");
      return;
    }
    modal.close();
    await change((d) => {
      d.weights = w;
      record(d);
    }, "Index weights updated");
  }
});
document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.id === "search") {
    search = t.value;
    document.querySelector("#marketrows").innerHTML = assetTable(filteredIds());
  }
  if (t.id === "quantity" || t.id === "trigger") {
    if (t.id === "quantity") quantity = t.value;
    else trigger = t.value;
    document.querySelector("#impacts").innerHTML = impacts();
  }
});
document.addEventListener("change", (e) => {
  const t = e.target;
  switch (t.id) {
    case "series":
      tab = t.value === "Portfolio equity" ? "equity" : "index";
      break;
    case "sector":
      sector = t.value;
      break;
    case "instrument":
      i = +t.value;
      trigger = String(price());
      break;
    case "otype":
      orderType = t.value;
      if (!trigger) trigger = String(price());
      break;
    case "ledger":
      ledgerTab = t.value;
      break;
    case "scenario":
      scenario = +t.value;
      break;
    case "foundAsset":
      foundAsset = +t.value;
      break;
    case "foundType":
      foundType = t.value;
      break;
    case "look":
      look = +t.value;
      break;
    case "extra":
      extra = +t.value;
      break;
    case "report":
      reportNo = +t.value;
      break;
    default:
      return;
  }
  render();
});
function inspect(plot, n) {
  const rows = JSON.parse(plot.dataset.series),
    k = Math.min(rows.length - 1, Math.max(0, n)),
    tip = plot.querySelector("output");
  plot.dataset.idx = k;
  tip.textContent = rows[k].join(" · ");
  tip.style.left =
    Math.max(3, Math.min(68, (k / Math.max(1, rows.length - 1)) * 90)) + "%";
  tip.hidden = false;
}
document.addEventListener("pointermove", (e) => {
  const plot = e.target.closest(".plot");
  if (plot) {
    const b = plot.getBoundingClientRect(),
      n = JSON.parse(plot.dataset.series).length;
    inspect(
      plot,
      Math.round(((e.clientX - b.left) / (b.width * 0.91)) * (n - 1)),
    );
  }
});
document.addEventListener("pointerout", (e) => {
  const p = e.target.closest(".plot");
  if (p && !p.contains(e.relatedTarget))
    p.querySelector("output").hidden = true;
});
document.addEventListener("keydown", (e) => {
  const p = e.target.closest(".plot");
  if (p && ["ArrowLeft", "ArrowRight"].includes(e.key)) {
    e.preventDefault();
    inspect(p, Number(p.dataset.idx || 0) + (e.key === "ArrowLeft" ? -1 : 1));
  }
  if (e.key === "Escape" && menu) {
    menu = false;
    render();
  }
});
render();
