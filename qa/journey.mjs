import { JSDOM } from "jsdom";
import { readFile } from "node:fs/promises";
import { strict as assert } from "node:assert";

const path = new URL("../dist/", import.meta.url);
const html = await readFile(new URL("index.html", path), "utf8");
for (const width of [1440, 390]) {
  const dom = new JSDOM(html, {
    url: "https://quantara.example/",
    pretendToBeVisual: true,
  });
  const w = dom.window;
  Object.defineProperty(w, "innerWidth", { value: width });
  for (const k of [
    "window",
    "document",
    "location",
    "localStorage",
    "navigator",
  ])
    Object.defineProperty(globalThis, k, {
      configurable: true,
      value: k === "window" ? w : w[k],
    });
  w.scrollTo = () => {};
  w.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  w.HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  const sel = (q) => {
    const el = w.document.querySelector(q);
    assert.ok(el, "Missing " + q);
    return el;
  };
  const click = async (q) => {
    sel(q).click();
    await new Promise((r) => setTimeout(r, 5));
  };
  const action = (a) => click('[data-act="' + a + '"]');
  const input = (id, v, ev = "change") => {
    const x = sel("#" + id);
    x.value = v;
    x.dispatchEvent(new w.Event(ev, { bubbles: true }));
  };
  const nav = async (id) => {
    w.location.hash = id;
    await new Promise((r) => setTimeout(r, 10));
    assert.ok(!w.document.body.textContent.includes("undefined"));
  };
  const state = () => JSON.parse(w.localStorage.getItem("quantara.account.v1"));
  await import(new URL("app.js", path).href + "?width=" + width);
  assert.ok(sel("dialog").open);
  assert.equal(sel("#dialog-title").textContent, "Start with the presentation");
  const intro = sel(".presentation-intro");
  assert.equal(intro.querySelector("a.primary").getAttribute("href"), "./presentation/QUANTARA.pdf");
  assert.equal(intro.querySelector("a[download]").getAttribute("href"), "./presentation/QUANTARA.pptx");
  assert.equal(intro.querySelector(".project-resources a[target]").href, "https://github.com/SAMEER-MLPROJECT/RANDOM#readme");
  await click('.presentation-intro button[data-act="dismiss"]');
  assert.equal(sel("dialog").open, false);
  assert.equal(sel("h1").textContent, "Command centre");
  assert.equal(state().cash, 1e6);
  await action("range");
  input("series", "Portfolio equity");
  assert.equal(
    sel(".chartfoot").textContent.includes("Actual portfolio"),
    true,
  );
  if (width < 600) {
    await action("menu");
    assert.ok(sel(".side").classList.contains("shown"));
  }
  await nav("market");
  assert.equal(sel("dialog").open, false);
  assert.equal(sel('footer a[download]').getAttribute("href"), "./presentation/QUANTARA.pptx");
  input("search", "kora", "input");
  assert.equal(w.document.querySelectorAll("#marketrows tbody tr").length, 1);
  await action("watch");
  assert.equal(state().watch.includes(1), false);
  await action("asset");
  assert.equal(sel("#instrument").value, "1");
  input("quantity", "3", "input");
  assert.ok(sel("#impacts").textContent.includes("Projected"));
  await action("review");
  assert.equal(sel("dialog").open, true);
  await action("confirm");
  assert.equal(state().pos[1].q, 3);
  assert.ok(state().cash < 1e6);
  await action("advance");
  await click('[data-side="Sell"]');
  await action("review");
  await action("confirm");
  assert.equal(state().pos[1].q, 0);
  await nav("autopsy");
  assert.ok(w.document.body.textContent.includes("Hindsight utility regret"));
  assert.ok(w.document.body.textContent.includes("Stay in cash"));
  await nav("portfolio");
  input("scenario", "-30");
  assert.ok(w.document.body.textContent.includes("Shadow portfolio"));
  await nav("rift");
  await action("weights");
  await action("saveweights");
  assert.equal(sel("dialog").open, false);
  await nav("foundry");
  input("foundType", "Mean reversion");
  await action("run");
  assert.equal(state().runs[0].type, "Mean reversion");
  assert.ok(sel(".hist"));
  await nav("terminal");
  await click('[data-side="Buy"]');
  input("otype", "Limit");
  input("trigger", "1", "input");
  await action("review");
  await action("confirm");
  assert.equal(state().orders.at(-1).status, "Open");
  await action("cancel");
  assert.equal(state().orders.at(-1).status, "Cancelled");
  const snap = state();
  const persisted = w.localStorage.getItem("quantara.account.v1");
  const fresh = new JSDOM(html, {
    url: "https://quantara.example/#terminal",
    pretendToBeVisual: true,
  });
  for (const k of [
    "window",
    "document",
    "location",
    "localStorage",
    "navigator",
  ])
    Object.defineProperty(globalThis, k, {
      configurable: true,
      value: k === "window" ? fresh.window : fresh.window[k],
    });
  fresh.window.localStorage.setItem("quantara.account.v1", persisted);
  fresh.window.HTMLDialogElement.prototype.showModal = w.HTMLDialogElement.prototype.showModal;
  fresh.window.HTMLDialogElement.prototype.close = w.HTMLDialogElement.prototype.close;
  await import(new URL("app.js", path).href + "?reload=" + width);
  assert.ok(fresh.window.document.querySelector("dialog").open);
  assert.deepEqual(
    JSON.parse(fresh.window.localStorage.getItem("quantara.account.v1")),
    snap,
  );
  assert.ok(fresh.window.document.querySelector("#ledger"));
  fresh.window.close();
  for (const k of [
    "window",
    "document",
    "location",
    "localStorage",
    "navigator",
  ])
    Object.defineProperty(globalThis, k, {
      configurable: true,
      value: k === "window" ? w : w[k],
    });
  await action("guide");
  await action("resetask");
  await action("reset");
  assert.equal(state().cash, 1e6);
  assert.equal(state().orders.length, 0);
  console.log(width + "px DOM interaction journey passed");
  dom.window.close();
}
