/**
 * Capture product screenshots for the pitch deck.
 * Requires the app running on http://localhost:3001
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "screenshots");
const BASE = process.env.PITCH_BASE_URL || "http://localhost:3001";

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1.5,
});

async function shot(name, url, waitMs = 800) {
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(waitMs);
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log("saved", file);
  return file;
}

await shot("01-landing", `${BASE}/`);
await shot("02-login", `${BASE}/login`);

// Guest login → dashboard
await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 60000 });
const guest = page.getByRole("button", { name: /guest|訪客|访客/i });
if (await guest.count()) {
  await guest.first().click();
} else {
  // Fallback: call guest API then navigate
  await page.evaluate(async () => {
    await fetch("/api/auth/guest", { method: "POST" });
  });
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
}
await page.waitForURL(/dashboard|practice/, { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(1200);
await page.screenshot({
  path: path.join(OUT, "03-dashboard.png"),
  fullPage: false,
});
console.log("saved", path.join(OUT, "03-dashboard.png"));

await shot("04-practice", `${BASE}/practice`, 1200);

await browser.close();
console.log("done");
