import { JSDOM } from "jsdom";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const root = new URL("../dist/", import.meta.url);
for (const width of [390, 1440]) {
  const dom = new JSDOM(await readFile(new URL("index.html", root), "utf8"), {
      url: "https://quantara.example",
      pretendToBeVisual: true,
    }),
    w = dom.window;
  for (const k of [
    "window",
    "document",
    "location",
    "localStorage",
    "navigator",
  ])
    Object.defineProperty(globalThis, k, {
      value: k === "window" ? w : w[k],
      configurable: true,
    });
  Object.defineProperty(w, "innerWidth", { value: width });
  w.scrollTo = () => {};
  w.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  w.HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  await import(new URL("app.js", root).href + "?research=" + width);
  const el = (q) => {
      const x = document.querySelector(q);
      assert.ok(x, q);
      return x;
    },
    wait = () => new Promise((r) => setTimeout(r, 10)),
    click = async (q) => {
      el(q).click();
      await wait();
    },
    act = (a) => click('[data-act="' + a + '"]'),
    go = async (key) => {
      w.location.hash = key;
      await wait();
    },
    state = () => JSON.parse(w.localStorage.getItem("quantara.account.v1"));
  if (width === 390) await act("menu");
  await click('a.nav[href="#oracle"]');
  await act("source-settings");
  await click('[data-channel="social"]');
  await act("save-channels");
  assert.equal(state().research.channels.length, 4);
  await act("propose");
  assert.equal(w.location.hash, "#hypothesis");
  assert.ok(el("main").textContent.includes("PROPOSED"));
  await act("test-hypothesis");
  assert.equal(state().research.registry[0].status, "INCONCLUSIVE");
  await act("experiment");
  assert.ok(el(".study-banner").textContent.includes("supply-180"));
  await act("review");
  await act("confirm");
  await act("advance");
  await click('[data-side="Sell"]');
  await act("review");
  await act("confirm");
  await go("autopsy");
  assert.ok(el("main").textContent.includes("H-supply-180-D180"));
  assert.ok(state().reports[0].experiments.length);
  await go("shadow");
  assert.ok(el("main").textContent.includes("Actual and shadow"));
  await go("rift");
  assert.ok(el("main").textContent.includes("NetworkX Louvain"));
  assert.ok(el("main").textContent.includes("Five-state"));
  await go("hypothesis");
  await act("invalidate");
  el("#withdraw-reason").value = "Control exposure questioned";
  await act("confirm-withdraw");
  assert.equal(state().research.registry[0].status, "INVALIDATED");
  assert.equal(state().reports[0].experiments[0].status, "INCONCLUSIVE");
  await act("guide");
  await act("resetask");
  await act("reset");
  assert.equal(state().orders.length, 0);
  assert.equal(state().research?.registry?.length ?? 0, 0);
  console.log(width + "px research-to-trade DOM journey passed");
  w.close();
}
