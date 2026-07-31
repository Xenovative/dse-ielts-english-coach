import { readFileSync, writeFileSync } from "node:fs";

const raw = readFileSync(".env", "utf8");
const env = {};
for (const line of raw.split(/\r?\n/)) {
  if (!line || line.trim().startsWith("#") || !line.includes("=")) continue;
  const i = line.indexOf("=");
  const key = line.slice(0, i).trim();
  let value = line.slice(i + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  env[key] = value;
}

const lines = [
  "APP_PORT=3010",
  `JWT_SECRET=${env.JWT_SECRET || ""}`,
  `SESSION_TTL_SECONDS=${env.SESSION_TTL_SECONDS || "604800"}`,
  `AI_PROVIDER=${env.AI_PROVIDER || "openrouter"}`,
  `OPENROUTER_API_KEY=${env.OPENROUTER_API_KEY || ""}`,
  `OPENROUTER_MODEL=${env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct"}`,
  `OPENROUTER_BASE_URL=${env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1"}`,
  "OPENROUTER_SITE_URL=http://72.60.107.155:3010",
  `OPENROUTER_APP_NAME=${env.OPENROUTER_APP_NAME || "DSE IELTS English Coach"}`,
  `GROQ_API_KEY=${env.GROQ_API_KEY || ""}`,
  `OPENAI_API_KEY=${env.OPENAI_API_KEY || ""}`,
  "STT_PROVIDER=mock",
  `AI_TIMEOUT_MS=${env.AI_TIMEOUT_MS || "35000"}`,
  `RATE_LIMIT_WINDOW_MS=${env.RATE_LIMIT_WINDOW_MS || "60000"}`,
  `RATE_LIMIT_MAX=${env.RATE_LIMIT_MAX || "60"}`,
];

writeFileSync(".vps.env", lines.join("\n") + "\n");
console.log("Wrote .vps.env with", lines.length, "keys (secrets not printed)");
console.log(
  "OPENROUTER_API_KEY set:",
  Boolean(env.OPENROUTER_API_KEY && env.OPENROUTER_API_KEY.length > 8),
);
