/**
 * Build a ~2.5 minute product demo video from app screenshots + title cards.
 * Prefer live screenshots when the app is up; otherwise reuse pitch/screenshots.
 *
 * Run: node pitch/build-demo-video.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEMO = path.join(__dirname, "demo");
const SHOTS = path.join(__dirname, "screenshots");
const BASE = process.env.PITCH_BASE_URL || "http://localhost:3001";
const W = 1280;
const H = 720;

fs.mkdirSync(DEMO, { recursive: true });

function run(cmd, args) {
  execFileSync(cmd, args, { stdio: "inherit" });
}

function hasPlaywrightChrome() {
  try {
    // Will throw if browser missing when we launch — probe via CLI
    const out = execFileSync("npx", ["playwright", "install", "--dry-run", "chromium"], {
      encoding: "utf8",
      cwd: path.join(__dirname, ".."),
    });
    return !/Download/i.test(out);
  } catch {
    return false;
  }
}

async function tryCaptureLive() {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: W, height: H },
      deviceScaleFactor: 1,
    });
    const save = async (name, url, after) => {
      await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
      if (after) await after(page);
      await page.waitForTimeout(800);
      const p = path.join(DEMO, name);
      await page.screenshot({ path: p, fullPage: false });
      console.log("captured", p);
      return p;
    };

    await save("frame-landing.png", `${BASE}/`);
    await save("frame-login.png", `${BASE}/login`);

    await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    const guest = page.getByRole("button", { name: /guest|訪客|访客/i }).first();
    if (await guest.count()) {
      await guest.click();
      await page.waitForURL(/dashboard|practice/, { timeout: 15000 }).catch(() => {});
    } else {
      await page.evaluate(async () => {
        await fetch("/api/auth/guest", { method: "POST" });
      });
    }
    await save("frame-dashboard.png", `${BASE}/dashboard`);
    await save("frame-practice.png", `${BASE}/practice`);

    // Open first reading paper if possible
    const paper = page
      .locator("a")
      .filter({ hasText: /Reading|Paper|閱讀/i })
      .first();
    if (await paper.count()) {
      await paper.click();
      await page.waitForTimeout(1500);
      await page.screenshot({
        path: path.join(DEMO, "frame-practice-detail.png"),
        fullPage: false,
      });
      console.log("captured frame-practice-detail.png");
    }

    await browser.close();
    return true;
  } catch (err) {
    console.warn("Live capture skipped:", err.message);
    return false;
  }
}

function copyFallback(name, dest) {
  const src = path.join(SHOTS, name);
  if (!fs.existsSync(src)) throw new Error(`Missing ${src}`);
  fs.copyFileSync(src, dest);
  console.log("fallback", dest);
}

function makeTitleCard(file, line1, line2) {
  run("ffmpeg", [
    "-y",
    "-f",
    "lavfi",
    "-i",
    `color=c=0x07070D:s=${W}x${H}:d=1`,
    "-vf",
    [
      `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${line1}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-30`,
      `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='${line2}':fontsize=28:fontcolor=0xA78BFA:x=(w-text_w)/2:y=(h-text_h)/2+40`,
    ].join(","),
    "-frames:v",
    "1",
    "-update",
    "1",
    file,
  ]);
}

function clipFromImage(img, out, seconds, caption) {
  const cap = caption
    .replace(/:/g, "\\:")
    .replace(/'/g, "")
    .replace(/—/g, "-")
    .replace(/·/g, "-");
  const frames = Math.round(seconds * 25);
  // Scale first, then slow zoom, then caption bar with fixed pixel sizes.
  run("ffmpeg", [
    "-y",
    "-loop",
    "1",
    "-i",
    img,
    "-vf",
    [
      `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}`,
      `zoompan=z='min(1.06\\,zoom+0.00035)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=25`,
      `drawbox=x=0:y=630:w=${W}:h=90:color=black@0.55:t=fill`,
      `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='${cap}':fontsize=24:fontcolor=white:x=36:y=658`,
    ].join(","),
    "-frames:v",
    String(frames),
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-an",
    out,
  ]);
}

function titleClip(img, out, seconds) {
  run("ffmpeg", [
    "-y",
    "-loop",
    "1",
    "-i",
    img,
    "-t",
    String(seconds),
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-an",
    out,
  ]);
}

// --- main ---
const live = await tryCaptureLive();
if (!live) {
  copyFallback("01-landing.png", path.join(DEMO, "frame-landing.png"));
  copyFallback("02-login.png", path.join(DEMO, "frame-login.png"));
  copyFallback("03-dashboard.png", path.join(DEMO, "frame-dashboard.png"));
  copyFallback("04-practice.png", path.join(DEMO, "frame-practice.png"));
}

const titleIn = path.join(DEMO, "card-title.png");
const titleOut = path.join(DEMO, "card-end.png");
makeTitleCard(titleIn, "DSE English Coach", "Product Demo  ·  Presented by Hassan");
makeTitleCard(titleOut, "Thank you", "Presented by Hassan  ·  Hong Kong");

const clips = [];
const plan = [
  [titleIn, 8, null, true],
  [path.join(DEMO, "frame-landing.png"), 28, "1. Homepage - for DSE English students in Hong Kong", false],
  [path.join(DEMO, "frame-login.png"), 22, "2. Easy login - or continue as guest to try", false],
  [path.join(DEMO, "frame-dashboard.png"), 35, "3. Student dashboard - progress, weak areas, exam modes", false],
  [path.join(DEMO, "frame-practice.png"), 35, "4. Practice library - Reading, Writing, Listening, Speaking", false],
];

const detail = path.join(DEMO, "frame-practice-detail.png");
if (fs.existsSync(detail)) {
  plan.push([detail, 30, "5. Inside a practice paper - read, answer, get feedback", false]);
}
plan.push([titleOut, 10, null, true]);

plan.forEach((item, i) => {
  const [img, secs, caption, isTitle] = item;
  const out = path.join(DEMO, `clip-${String(i).padStart(2, "0")}.mp4`);
  if (isTitle) titleClip(img, out, secs);
  else clipFromImage(img, out, secs, caption);
  clips.push(out);
});

const listFile = path.join(DEMO, "concat.txt");
fs.writeFileSync(listFile, clips.map((c) => `file '${c}'`).join("\n"));

const mp4Path = path.join(DEMO, "hassan-dse-demo.mp4");
run("ffmpeg", [
  "-y",
  "-f",
  "concat",
  "-safe",
  "0",
  "-i",
  listFile,
  "-c:v",
  "libx264",
  "-pix_fmt",
  "yuv420p",
  "-movflags",
  "+faststart",
  mp4Path,
]);

const coverPath = path.join(DEMO, "demo-cover.png");
run("ffmpeg", ["-y", "-ss", "00:00:10", "-i", mp4Path, "-frames:v", "1", coverPath]);

const dur = execFileSync(
  "ffprobe",
  ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", mp4Path],
  { encoding: "utf8" },
).trim();
console.log(`\nDemo video: ${mp4Path}`);
console.log(`Cover: ${coverPath}`);
console.log(`Duration: ${Number(dur).toFixed(1)} seconds (~${(Number(dur) / 60).toFixed(1)} min)`);
console.log("hasPlaywrightChrome probe skipped after launch attempt");
void hasPlaywrightChrome;
