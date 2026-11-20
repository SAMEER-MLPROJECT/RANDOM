import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createAdapters } from "./adapters.mjs";
const adapters = createAdapters(),
  root = fileURLToPath(new URL("../dist/", import.meta.url)),
  port = Number(process.env.PORT || 8000);
const types = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".zip": "application/zip",
  ".pdf": "application/pdf",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".webp": "image/webp",
};
const server = createServer(async (req, res) => {
  const json = (code, data) => {
    res.writeHead(code, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(data));
  };
  const actualPort = server.address().port;
  const allowed = [`127.0.0.1:${actualPort}`, `localhost:${actualPort}`];
  if (!allowed.includes(req.headers.host)) {
    json(403, { error: "Local host required." });
    return;
  }
  try {
    const path = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    if (path.startsWith("/api/")) {
      if (
        req.method !== "POST" ||
        req.headers.origin !== "http://" + req.headers.host ||
        !req.headers["content-type"]?.startsWith("application/json")
      )
        return json(403, { error: "Use the local workspace." });
      let raw = "";
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > 2048)
          return json(413, { error: "Request too large." });
      }
      const param = JSON.parse(raw);
      if (path === "/api/question")
        return json(200, await adapters.question(param.family));
      if (path === "/api/feed")
        return json(200, await adapters.feed(param.channel));
      return json(404, { error: "Unknown route." });
    }
    if (req.method !== "GET" && req.method !== "HEAD")
      return json(405, { error: "Method unavailable." });
    const file = resolve(root, "." + (path === "/" ? "/index.html" : path));
    if (!file.startsWith(resolve(root) + sep))
      return json(404, { error: "Unknown file." });
    const data = await readFile(file);
    res.writeHead(200, {
      "Content-Type": types[extname(file)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(req.method === "HEAD" ? undefined : data);
  } catch (err) {
    if (req.url?.startsWith("/api/"))
      return json(503, {
        error:
          "Configured provider unavailable. The offline demo remains available.",
      });
    json(404, { error: "File unavailable." });
  }
}).listen(port, "127.0.0.1", () =>
  console.log(
    "QUANTARA is running at http://127.0.0.1:" + server.address().port,
  ),
);
