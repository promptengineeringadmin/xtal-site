import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local
try {
  const envPath = path.resolve(__dirname, "../.env.local");
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1);
    if (!process.env[key]) process.env[key] = val;
  }
} catch {}

const { Redis } = await import("@upstash/redis");
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL.trim(),
  token: process.env.UPSTASH_REDIS_REST_TOKEN.trim(),
});

await redis.set("admin:settings:willow:snippet_enabled", true);
await redis.set("admin:settings:willow:snippet_search_selector", '#search_field, input[placeholder*="Search"]');

const enabled = await redis.get("admin:settings:willow:snippet_enabled");
const selector = await redis.get("admin:settings:willow:snippet_search_selector");
console.log("snippet_enabled:", enabled);
console.log("snippet_search_selector:", selector);
console.log("Done!");
