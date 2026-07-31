/**
 * Record a ~2–3 minute product demo for the showcase deck.
 * Requires app at http://localhost:3001
 *
 * Run: node pitch/record-demo.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "demo");
const BASE = process.env.PITCH_BASE_URL || "http://localhost:3001";

fs.mkdirSync(OUT_DIR, { recursive: true });

// Clean previous recordings in this dir
for (const f of fs.readdirSync(OUT_DIR)) {
  if (f.endsWith(".webm") || f.endsWith(".mp4")) {
    fs.unlinkSync(path.join(OUT_DIR, f));
  }
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
  recordVideo: {
    dir: OUT_DIR,
    size: { width: 1280, height: 720 },
  },
});
const page = await context.newPage();

async function pause(ms) {
  await page.waitForTimeout(ms);
}

async function clickText(re, opts = {}) {
  const loc = page.getByText(re).first();
  await loc.waitFor({ state: "visible", timeout: opts.timeout ?? 15000 });
  await loc.click();
}

console.log("Recording demo from", BASE);

// 1) Landing (~25s)
await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 60000 });
await pause(6000);
await page.mouse.move(200, 300);
await pause(3000);
await page.mouse.wheel(0, 200);
await pause(4000);
await page.mouse.move(400, 500);
await pause(3000);

// 2) Go to login (~15s)
const getStarted = page.getByRole("link", { name: /get started|開始|开始/i }).first();
if (await getStarted.count()) {
  await getStarted.click();
} else {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
}
await pause(5000);

// 3) Guest login (~15s)
const guest = page.getByRole("button", { name: /guest|訪客|访客/i }).first();
if (await guest.count()) {
  await guest.click();
} else {
  await page.evaluate(async () => {
    await fetch("/api/auth/guest", { method: "POST" });
  });
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
}
await page.waitForURL(/dashboard|practice/, { timeout: 20000 }).catch(() => {});
await pause(6000);

// 4) Dashboard explore (~45s)
await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
await pause(6000);
await page.mouse.move(600, 400);
await pause(3000);
await page.mouse.wheel(0, 350);
await pause(4000);
await page.mouse.wheel(0, 350);
await pause(4000);
await page.mouse.move(800, 350);
await pause(3000);

// Click HKDSE exam card if present
const dse = page.getByRole("link", { name: /HKDSE|DSE/i }).first();
if (await dse.count()) {
  await dse.click();
  await pause(4000);
} else {
  await page.goto(`${BASE}/practice?mode=DSE`, { waitUntil: "networkidle" });
  await pause(3500);
}

// 5) Practice library (~40s)
await page.goto(`${BASE}/practice`, { waitUntil: "networkidle" });
await pause(5000);
const readingFilter = page.getByRole("button", { name: /^Reading$|^閱讀$|^阅读$/i }).first();
if (await readingFilter.count()) {
  await readingFilter.click();
  await pause(3500);
}
await page.mouse.wheel(0, 200);
await pause(4000);

// Open first practice card / link
const paper = page
  .locator('a[href*="paper"], a[href*="practice"]')
  .filter({ hasText: /Reading|Paper|閱讀|阅读/i })
  .first();
if (await paper.count()) {
  await paper.click();
} else {
  // Try any practice start
  const any = page.locator("a").filter({ hasText: /DSE|IELTS|Paper|Reading/i }).first();
  if (await any.count()) await any.click();
}
await pause(6000);

// 6) Inside practice — scroll & interact (~55s)
await page.mouse.wheel(0, 300);
await pause(4000);
await page.mouse.wheel(0, 400);
await pause(4000);

// Try answering a few MC / TF options if present
const options = page.locator('button, label, [role="radio"]').filter({
  hasText: /True|False|Not Given|A\.|B\.|C\.|D\.|正確|錯誤/i,
});
const optCount = await options.count();
for (let i = 0; i < Math.min(optCount, 4); i++) {
  try {
    await options.nth(i).click({ timeout: 2000 });
    await pause(1500);
  } catch {
    /* ignore */
  }
}
await page.mouse.wheel(0, 400);
await pause(3000);

// Look for submit
const submit = page.getByRole("button", { name: /submit|提交|交卷/i }).first();
if (await submit.count()) {
  await submit.scrollIntoViewIfNeeded().catch(() => {});
  await pause(2000);
  await submit.click().catch(() => {});
  await pause(5000);
}

// 7) Results / back to dashboard (~25s)
await page.goto(`${BASE}/results`, { waitUntil: "networkidle" }).catch(() => {});
await pause(5000);
await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
await pause(7000);

const video = page.video();
await context.close();
await browser.close();

const webmPath = await video.path();
console.log("Raw video:", webmPath);

const mp4Path = path.join(OUT_DIR, "hassan-dse-demo.mp4");
const coverPath = path.join(OUT_DIR, "demo-cover.png");

// Convert to H.264 mp4 for PowerPoint / LibreOffice
execFileSync(
  "ffmpeg",
  [
    "-y",
    "-i",
    webmPath,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-an",
    mp4Path,
  ],
  { stdio: "inherit" },
);

// Cover frame ~2s in
execFileSync(
  "ffmpeg",
  ["-y", "-ss", "00:00:02", "-i", mp4Path, "-frames:v", "1", coverPath],
  { stdio: "inherit" },
);

const probe = execFileSync(
  "ffprobe",
  ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", mp4Path],
  { encoding: "utf8" },
).trim();
console.log(`Wrote ${mp4Path}`);
console.log(`Cover ${coverPath}`);
console.log(`Duration ~${Number(probe).toFixed(1)}s`);
