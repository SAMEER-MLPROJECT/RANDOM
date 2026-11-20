import { assets, tape, sd, mean } from "./market.js";
import {
  families,
  channels,
  entityEdges,
  evidenceScore,
  eventsAt,
} from "./oracle.js";
import { graphIntel, fiveRegimes, allocationStudy } from "./graph.js";
import { day, pct, hex, icon, number, money, signed, chart } from "./ui.js";
import { book } from "./quant.js";
import { comparison } from "./ledger.js";
export const researchState = (s) =>
  (s.research ??= {
    channels: Object.keys(channels),
    imports: [],
    registry: [],
    active: null,
  });
export function feed(s) {
  const r = researchState(s);
  return eventsAt(s.d, r.channels, r.imports);
}
const button = (act, label, cls = "btn", id = "") =>
  '<button class="' +
  cls +
  '" data-act="' +
  act +
  '" data-id="' +
  hex(id) +
  '">' +
  label +
  "</button>";
const detail = (label, body) =>
  "<details><summary>" + label + "</summary>" + body + "</details>";
const kv = (k, v) =>
  '<div class="kv"><span>' + k + "</span><b>" + v + "</b></div>";
const head = (label, action = "") =>
  '<div class="cardhead"><h2>' + label + "</h2>" + action + "</div>";
const card = (label, body, action = "") =>
  '<article class="panel">' +
  head(label, action) +
  '<div class="pad">' +
  body +
  "</div></article>";
const tag = (x) => '<span class="labtag">' + hex(x) + "</span>";
const anchor = (route, label) =>
  '<a href="#' + route + '" class="textlink">' + label + "</a>";
const histNote =
  '<p class="note">These fictional disclosures and public-signal fixtures are generated independently of market returns. Evidence quality measures provenance. Price effects require a separate test.</p>';
export function spotlight(s) {
  const e = feed(s)[0];
  if (!e) return "";
  const er = evidenceScore(e);
  return (
    '<section class="spotlight"><div class="spot-main"><div class="pagekicker"><i></i>ORACLE · Research in focus</div><h2>' +
    families[e.family].label +
    " at " +
    assets[e.asset].name +
    '</h2><p>Inspect the disclosure, check independent evidence and test the effect against a sector peer.</p><a class="research-link" href="#oracle">' +
    icon("radar", 16) +
    ' Open intelligence terminal</a></div><div class="signal-chain" aria-label="Evidence path">' +
    [
      ["book", "Evidence", e.sources.length + " records"],
      ["rift", "Attribution", assets[e.asset].sym],
      ["foundry", "Hypothesis", "Matched peer"],
    ]
      .map(
        ([ic, a, b]) =>
          "<div><i>" +
          icon(ic, 21) +
          "</i><b>" +
          a +
          "</b><small>" +
          b +
          "</small></div>",
      )
      .join("") +
    "</div></section>"
  );
}
export function oracleView(s, id, filter = "all") {
  const events = feed(s),
    visible = events.filter((e) => filter === "all" || e.family === filter),
    selected = visible.find((e) => e.id === id) || visible[0];
  const options = Object.entries(families)
    .map(
      ([key, f]) =>
        '<option value="' +
        key +
        '" ' +
        (filter === key ? "selected" : "") +
        ">" +
        f.label +
        "</option>",
    )
    .join("");
  const rows =
    '<div class="feed-controls"><label>Event class <select id="eventFilter"><option value="all">All events</option>' +
    options +
    '</select></label></div><div class="event-scroll">' +
    visible
      .map((e) =>
        button(
          "select-event",
          "<small>" +
            day(e.day) +
            " · " +
            assets[e.asset].sym +
            "</small><strong>" +
            families[e.family].label +
            "</strong><span>" +
            e.sources.length +
            " source records</span>",
          "eventrow " + (selected === e ? "chosen" : ""),
          e.id,
        ),
      )
      .join("") +
    "</div>";
  if (!selected)
    return card(
      "Event stream",
      rows + "<p>No events match the active sources and filter.</p>",
      button("source-settings", "Configure sources", "btn small"),
    );
  const e = selected,
    f = families[e.family],
    er = evidenceScore(e);
  const evidence = e.sources
    .map(
      (r) =>
        '<div class="evidence"><div>' +
        tag(channels[r.channel]) +
        tag(r.stance) +
        "</div><p>" +
        hex(r.text) +
        "</p><small>Origin " +
        hex(r.origin) +
        " · Record " +
        hex(r.id) +
        "</small>" +
        detail(
          "Attribution & timestamps",
          kv("Published", day(r.published)) +
            kv("First observed", day(r.observed)) +
            kv("Event date", day(r.day)) +
            kv("Entity match", hex(r.entity) + " · " + pct(r.attribution, 0)) +
            kv("Extraction confidence", pct(r.extraction, 0)),
        ) +
        "</div>",
    )
    .join("");
  const social = e.sources.filter((r) => r.channel === "social"),
    direction = e.family === "earnings" ? 1 : -1;
  const polarity = social.map(
    (r) =>
      direction *
      (r.stance === "supports" ? 1 : r.stance === "contradicts" ? -1 : 0),
  );
  const socialCount = (start, end) =>
    events
      .flatMap((x) => x.sources)
      .filter(
        (r) =>
          r.channel === "social" && r.observed > start && r.observed <= end,
      ).length;
  const attention = detail(
    "Public attention & disagreement",
    kv("Event discussion records", social.length) +
      kv(
        "Mean directional polarity",
        polarity.length ? number(mean(polarity), 2) : "No observations",
      ) +
      kv(
        "Polarity dispersion",
        polarity.length > 1 ? number(sd(polarity), 2) : "Insufficient records",
      ) +
      kv(
        "Discussion count · last / prior 18 sessions",
        socialCount(s.d - 18, s.d) + " / " + socialCount(s.d - 36, s.d - 18),
      ) +
      "<p>Polarity maps a stance to the expected sign for the event class. Counts include repeated reports and describe this fictional stream.</p>",
  );
  const company = assets[e.asset].name;
  const graph = entityEdges
    .filter(([a, , b]) => a === company || b === company)
    .map(
      ([a, rel, b]) => "<li><b>" + a + "</b> " + rel + " <b>" + b + "</b></li>",
    )
    .join("");
  return (
    '<div class="research-layout"><article class="panel">' +
    head("Event stream", tag(visible.length + " events")) +
    rows +
    '</article><div class="research-stack">' +
    card(
      company + " · " + f.label,
      '<div class="evidence-score"><div><small>Evidence Reliability Index</small><strong>' +
        er.value +
        "<em> / 100</em></strong></div><div>" +
        kv("Supporting origins", er.independent) +
        kv("Contradicting origins", er.conflicts) +
        "</div></div>" +
        histNote +
        (e.sources.some((r) => r.stance === "supports")
          ? button("propose", "Propose hypothesis", "primary", e.id)
          : "<p>No supporting observation for a proposal.</p>") +
        (e.sources.some((r) => r.stance === "supports") &&
        ["localhost", "127.0.0.1"].includes(location.hostname)
          ? button("model-propose", "Use configured model", "btn small", e.id)
          : "") +
        detail(
          "How evidence is weighted",
          "<p>Group by original source. For supporting origins, average source authority × attribution / (1 + 0.15 × publication lag). Multiply by 1 − exp(−supporting origins) and the supporting fraction among directional origins. These weights are illustrative.</p>",
        ) +
        detail(
          "Entity relationships",
          "<ul>" +
            graph +
            "<li>" +
            company +
            " issues " +
            assets[e.asset].sym +
            " in " +
            assets[e.asset].sector +
            ".</li></ul><p>Fixture directory version 1 establishes these identities and links. Similar names alone cannot create a relationship.</p>",
        ),
      tag(e.id),
    ) +
    card(
      "Source evidence",
      attention + evidence,
      button("source-settings", "Configure sources", "btn small"),
    ) +
    "</div></div>"
  );
}
export function sourceControls(s) {
  const cfg = researchState(s);
  return (
    "<p>Enable individual fictional feeds. Changes affect new proposals. Saved proposals retain the evidence they used.</p>" +
    Object.entries(channels)
      .map(
        ([k, v]) =>
          '<label class="check"><input type="checkbox" data-channel="' +
          k +
          '" ' +
          (cfg.channels.includes(k) ? "checked" : "") +
          ">" +
          v +
          "</label>",
      )
      .join("") +
    button("save-channels", "Apply sources", "primary full") +
    (["localhost", "127.0.0.1"].includes(location.hostname)
      ? detail(
          "Sync a configured source",
          '<label class="field">Source<select id="sync-source">' +
            Object.entries(channels)
              .map(([k, v]) => '<option value="' + k + '">' + v + "</option>")
              .join("") +
            "</select></label>" +
            button("sync-source", "Sync fictional feed", "btn") +
            '<p id="sync-status" role="status"></p>',
        )
      : "") +
    detail(
      "Import a fictional source batch",
      '<p>Choose a local JSON array of fictional records you are authorized to use. Imported data stays in this browser. The <a href="./sample-observations.json" download>sample file</a> uses the expected schema.</p><input type="file" id="batch" aria-label="Import fictional JSON" accept="application/json,.json"><p id="import-status" role="status"></p>',
    )
  );
}
export function hypothesisView(s, id) {
  const reg = researchState(s).registry,
    h = reg.find((x) => x.id === id) || reg[0];
  if (!h)
    return card(
      "Hypothesis registry",
      '<div class="empty"><strong>No proposals yet</strong><span>Select a documented event in ORACLE to generate a falsifiable hypothesis.</span>' +
        anchor("oracle", "Open ORACLE terminal") +
        "</div>",
    );
  const result = h.result,
    rows = h.log
      .map(
        (r) =>
          "<li>Session " +
          r.day +
          " · " +
          hex(r.status) +
          (r.reason ? " · " + hex(r.reason) : "") +
          "</li>",
      )
      .join("");
  return (
    '<div class="research-layout"><article class="panel">' +
    head("Registry", tag(reg.length + " proposals")) +
    '<div class="event-scroll">' +
    reg
      .map((x) =>
        button(
          "select-hypothesis",
          "<small>" +
            day(x.cutoff) +
            "</small><strong>" +
            families[x.family].label +
            "</strong><span>" +
            hex(x.status) +
            "</span>",
          "eventrow " + (x.id === h.id ? "chosen" : ""),
          x.id,
        ),
      )
      .join("") +
    '</div></article><div class="research-stack">' +
    card(
      "Research question",
      tag(h.status) +
        "<h3>" +
        hex(h.question) +
        "</h3>" +
        kv("Observation cutoff", day(h.cutoff)) +
        kv("Proposal method", hex(h.generator)) +
        kv("Source event", hex(h.event)) +
        kv("Evidence reliability", h.eri.value + " / 100") +
        detail(
          "Study specification",
          "<p><b>Null.</b> " +
            h.null +
            "</p><p><b>Alternative.</b> " +
            h.alternative +
            "</p>" +
            kv("Exposure", h.independent) +
            kv("Outcome", h.dependent) +
            kv("Control", h.control) +
            kv("Window", "5 sessions before and after first support") +
            "<p>" +
            h.confounders +
            " " +
            h.falsify +
            "</p><p>At least six mature, non-overlapping event windows per family. All three families enter the correction together.</p>",
        ) +
        (h.modelQuestion
          ? '<p class="note">Model-suggested research question · ' +
            hex(h.modelQuestion) +
            "</p>"
          : ""),
    ) +
    card(
      "Statistical evidence",
      result
        ? '<div class="evidence-score"><div><small>Matched daily effect</small><strong>' +
            signed(result.effect, 3) +
            "</strong></div>" +
            tag(result.status) +
            "</div>" +
            kv("Mature cases", result.n) +
            kv(
              "95% bootstrap interval",
              result.ci
                ? result.ci.map((x) => signed(x, 3)).join(" to ")
                : "Insufficient observations",
            ) +
            kv(
              "Raw p / BY-adjusted q",
              number(result.p, 4) + " / " + number(result.q, 4),
            ) +
            '<p class="note">' +
            (result.status === "INCONCLUSIVE"
              ? "The sample does not establish the proposed direction. A paper experiment can still illustrate the risk of acting on uncertain evidence."
              : "This classification applies to historical synthetic cases at this cutoff.") +
            "</p>" +
            detail(
              "Method & observations",
              "<p>For each case subtract the peer’s response, then subtract the five-session baseline from the five-session follow-up. A two-sided paired sign-flip test assumes symmetric independent case effects. Bootstrap intervals resample cases. Benjamini–Yekutieli adjusts across the three prespecified outcomes. Retrospective tests across different cutoffs remain exploratory.</p>" +
                result.sample
                  .map((x) => kv(hex(x.id), signed(x.effect, 3)))
                  .join(""),
            ) +
            (h.status === "INVALIDATED"
              ? ""
              : button("experiment", "Open paper experiment", "primary", h.id))
        : "<p>Test the research question against comparable events whose outcomes were observable at the saved cutoff.</p>" +
            button("test-hypothesis", "Run statistical test", "primary", h.id),
    ) +
    card(
      "Audit trail",
      detail("Show recorded decisions", "<ul>" + rows + "</ul>") +
        detail(
          "Frozen source records",
          h.sources
            .map((x) => "<p>" + hex(x.id) + " · " + hex(x.text) + "</p>")
            .join(""),
        ) +
        (h.status === "INVALIDATED"
          ? ""
          : button("invalidate", "Withdraw proposal", "btn small", h.id)),
    ) +
    "</div></div>"
  );
}
export function graphResearch(s) {
  const g = graphIntel(s.d),
    f = fiveRegimes(s.d),
    a = allocationStudy(s.d);
  const central = assets
    .map((x) => [x.sym, g.centrality[x.i]])
    .sort((x, y) => y[1] - x[1]);
  return (
    '<div class="twocol">' +
    card(
      "Five-state regime analysis",
      f.names.map((n, i) => kv(n, pct(f.prob[i], 1))).join("") +
        '<p class="note">Auxiliary model on the same index. The nominal 90% one-step return interval covered ' +
        pct(f.calibration.coverage, 1) +
        " of " +
        f.calibration.n +
        " returns. Five-state labels are unavailable for state calibration.</p>",
    ) +
    card(
      "Community intelligence",
      kv("Partition", g.method) +
        kv("Communities", new Set(g.groups).size) +
        kv(
          "Adjusted Rand stability",
          g.stability === null ? "—" : number(g.stability, 3),
        ) +
        kv("Isolation Forest flags", g.anomalies.length + " / 28") +
        detail(
          "Inspect groups, centrality & anomalies",
          [...new Set(g.groups)]
            .map((id, j) =>
              kv(
                "Community " + (j + 1),
                assets
                  .filter((x) => g.groups[x.i] === id)
                  .map((x) => x.sym)
                  .join(" · "),
              ),
            )
            .join("") +
            central
              .map(([sym, c]) => kv(sym + " weighted centrality", number(c, 3)))
              .join("") +
            g.anomalies
              .map((e) =>
                kv(
                  assets[e.i].sym + " / " + assets[e.j].sym,
                  number(e.score, 3),
                ),
              )
              .join(""),
        ),
    ) +
    card(
      "Conditioned allocation experiment",
      kv("Risky exposure", pct(a.exposure, 0)) +
        kv("Highest worst-case utility", a.best.name) +
        detail(
          "Compare candidate allocations",
          a.candidates
            .map((c) =>
              kv(
                c.name,
                "ES " +
                  pct(c.nominalES) +
                  " · robust " +
                  pct(c.robustES) +
                  " · utility " +
                  signed(c.utility),
              ),
            )
            .join("") +
            "<p>Compare equal, inverse-volatility and community-balanced allocations at fixed exposure. Scenario probability caps use regime similarity and graph density. Objective equals worst mean return minus 0.25 × worst tail loss. Results apply to this finite candidate set.</p>",
        ),
    ) +
    "</div>"
  );
}
export function shadowView(s) {
  const b = book(s),
    hs = book(s.shadow, s.d),
    a = comparison(s, "equity"),
    h = comparison(s, "shadow"),
    series = s.history;
  const row = (k, x, y) =>
    "<tr><td>" + k + "</td><td>" + x + "</td><td>" + y + "</td></tr>";
  const intervalReturns = (key) =>
    series.slice(1).map((x, i) => x[key] / series[i][key] - 1);
  return (
    '<div class="twocol">' +
    card(
      "Reference account",
      '<div class="eyebrow">Shadow equity</div><div class="quote">' +
        money(hs.equity, 0) +
        "</div>" +
        chart(
          series.map((v) => tape.at(v.d)),
          series.map((v) => v.shadow),
          { title: "Shadow portfolio equity" },
        ) +
        '<p class="note">Uses the same simulated clock and trading costs as your portfolio. It rebalances every five sessions using only available returns and regime estimates.</p>',
    ) +
    card(
      "Actual and shadow",
      '<table class="impact"><thead><tr><th>Measure</th><th>Actual</th><th>Shadow</th></tr></thead><tbody>' +
        row("Return", signed(a.ret), signed(h.ret)) +
        row("Drawdown", pct(a.dd), pct(h.dd)) +
        row("Exposure", pct(b.exposure), pct(hs.exposure)) +
        row(
          "Sharpe",
          a.sharpe == null ? "—" : number(a.sharpe),
          h.sharpe == null ? "—" : number(h.sharpe),
        ) +
        row(
          "Annualized realized volatility",
          ...["equity", "shadow"].map((k) =>
            series.length >= 3
              ? pct(sd(intervalReturns(k)) * Math.sqrt(252))
              : "—",
          ),
        ) +
        "</tbody></table>" +
        kv("Shadow wealth advantage", money(hs.equity - b.equity)) +
        detail(
          "Regime sensitivity",
          ["Bullish", "Bearish", "High volatility"]
            .map((n, j) => {
              const matches = series
                .slice(1)
                .map((v, k) => [v, series[k]])
                .filter(([, prev]) => prev.regime === j);
              return kv(
                n + " · actual / shadow",
                matches.length
                  ? ["equity", "shadow"]
                      .map((key) =>
                        signed(
                          mean(matches.map(([x, p]) => x[key] / p[key] - 1)),
                        ),
                      )
                      .join(" / ")
                  : "No intervals",
              );
            })
            .join(""),
        ),
    ) +
    "</div>"
  );
}
