import { channels, families } from "../dist/oracle.js";
import { assets } from "../dist/market.js";

// Only server-configured, licensed normalized sources are addressable by the client.
export function createAdapters(
  env = process.env,
  request = fetch,
  clock = Date.now,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
) {
  const cache = new Map(),
    pending = new Map(),
    cooldown = new Map();
  function checkedURL(raw) {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password)
      throw Error("Use an HTTPS provider endpoint.");
    return url;
  }
  async function query(key, url, init, ttl, limit) {
    const cached = cache.get(key);
    if (cached && cached.expires > clock()) return cached.value;
    if (pending.has(key)) return pending.get(key);
    if ((cooldown.get(key) || 0) > clock())
      throw Error("Provider rate limit. Try again later.");
    const job = (async () => {
      for (let attempt = 0; attempt < 2; attempt++) {
        const res = await request(checkedURL(url), {
          ...init,
          redirect: "error",
          signal: AbortSignal.timeout(4500),
        });
        if (res.status === 429) {
          const delay = Number(res.headers.get("retry-after")) || 60;
          cooldown.set(key, clock() + Math.max(1, delay) * 1000);
          throw Error("Provider rate limit. Try again later.");
        }
        if (res.status >= 500 && attempt === 0) {
          await sleep(150);
          continue;
        }
        if (!res.ok) throw Error("Provider unavailable.");
        const reader = res.body.getReader(),
          parts = [];
        let size = 0;
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.length;
            if (size > limit) {
              await reader.cancel();
              throw Error("Provider response exceeds size limit.");
            }
            parts.push(value);
          }
        } finally {
          reader.releaseLock();
        }
        const value = JSON.parse(Buffer.concat(parts).toString("utf8"));
        cache.set(key, { value, expires: clock() + ttl });
        return value;
      }
    })();
    pending.set(key, job);
    try {
      return await job;
    } finally {
      pending.delete(key);
    }
  }
  return {
    async feed(channel) {
      if (!Object.hasOwn(channels, channel)) throw Error("Unknown source.");
      const prefix = "QUANTARA_" + channel.toUpperCase(),
        url = env[prefix + "_URL"];
      if (!url || !env[prefix + "_LICENSE"])
        throw Error("Configure an authorized fictional feed URL and license.");
      const rows = await query(
        channel,
        url,
        { headers: { Accept: "application/json" } },
        60000,
        250000,
      );
      if (
        !Array.isArray(rows) ||
        !rows.length ||
        rows.length > 100 ||
        rows.some((r) => r.channel !== channel)
      )
        throw Error("Unexpected source schema.");
      return { rows, license: env[prefix + "_LICENSE"] };
    },
    async question(family) {
      if (!Object.hasOwn(families, family))
        throw Error("Unknown study family.");
      const url = env.QUANTARA_MODEL_URL,
        model = env.QUANTARA_MODEL_NAME;
      if (!url || !model) throw Error("Language model unconfigured.");
      const f = families[family];
      const payload = {
        model,
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "Write one falsifiable research question, ending with a question mark, about the given fictional event and matched peer. Use the specified endpoint and five-session pre/post window. Do not report findings, significance or recommendations.",
          },
          {
            role: "user",
            content: JSON.stringify({
              event: f.label,
              issuer: assets[f.asset].name,
              peer: assets[f.control].name,
              endpoint: f.metric,
              expectedDirection: f.direction,
            }),
          },
        ],
      };
      const headers = { "Content-Type": "application/json" };
      if (env.QUANTARA_MODEL_KEY)
        headers.Authorization = "Bearer " + env.QUANTARA_MODEL_KEY;
      const result = await query(
        "model-" + family,
        url,
        { method: "POST", headers, body: JSON.stringify(payload) },
        300000,
        30000,
      );
      const q = result?.choices?.[0]?.message?.content?.trim();
      if (
        typeof q !== "string" ||
        q.length < 12 ||
        q.length > 500 ||
        !q.endsWith("?") ||
        /significan|proven|guaranteed|p.value/i.test(q)
      )
        throw Error("Invalid model proposal.");
      return { question: q };
    },
  };
}
