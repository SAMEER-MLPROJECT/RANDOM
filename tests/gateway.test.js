import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";

test(
  "loopback gateway serves the application and rejects cross-origin requests",
  { timeout: 10000 },
  async (t) => {
    const child = spawn(process.execPath, ["server/local.mjs"], {
      env: { ...process.env, PORT: "0", QUANTARA_MODEL_URL: "" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const closed = once(child, "exit");
    t.after(async () => {
      child.kill();
      await closed;
    });
    const banner = String((await once(child.stdout, "data"))[0]);
    const origin = banner.match(/http:\/\/127\.0\.0\.1:\d+/)[0];
    const page = await fetch(origin);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /QUANTARA/);
    for (const [name, type] of [
      ["QUANTARA.pdf", "application/pdf"],
      ["QUANTARA.pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
      ["cover.webp", "image/webp"],
    ]) {
      const resource = await fetch(origin + "/presentation/" + name, { method: "HEAD" });
      assert.equal(resource.status, 200, name);
      assert.equal(resource.headers.get("content-type"), type, name);
    }
    const options = {
      method: "POST",
      headers: {
        Origin: "https://elsewhere.example",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ family: "supply" }),
    };
    assert.equal((await fetch(origin + "/api/question", options)).status, 403);
    options.headers.Origin = origin;
    assert.equal((await fetch(origin + "/api/question", options)).status, 503);
  },
);
