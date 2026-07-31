/**
 * Corporate showcase deck for Hassan — MNC audience in Hong Kong.
 * DSE English first. Soft close. No investment ask.
 * Run: npm run pitch:showcase
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PptxGenJS from "pptxgenjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "Hassan-DSE-English-Coach-Showcase.pptx");
const SHOTS = path.join(__dirname, "screenshots");
const DEMO_MP4 = path.join(__dirname, "demo", "hassan-dse-demo.mp4");
const DEMO_COVER = path.join(__dirname, "demo", "demo-cover.png");

const C = {
  bg: "07070D",
  card: "12121C",
  border: "2A2A3D",
  muted: "9B9BB0",
  dim: "C8C8D8",
  brand: "8B5CF6",
  brandSoft: "A78BFA",
  accent: "22D3EE",
  white: "FFFFFF",
};

const FONT = "Calibri";
const GAP = 0.12;
const TOTAL = 11;

function shot(name) {
  const p = path.join(SHOTS, name);
  return fs.existsSync(p) ? p : null;
}

function asDataUrl(filePath, mime) {
  if (!fs.existsSync(filePath)) return null;
  const b64 = fs.readFileSync(filePath).toString("base64");
  return `data:${mime};base64,${b64}`;
}

function bg(slide) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: "100%",
    h: "100%",
    fill: { color: C.bg },
  });
  slide.addShape(pptx.ShapeType.ellipse, {
    x: 7.4,
    y: -1.4,
    w: 4.2,
    h: 4.2,
    fill: { color: C.brand, transparency: 90 },
  });
}

function foot(slide, n) {
  slide.addText("DSE English Coach  ·  Presented by Hassan  ·  Confidential", {
    x: 0.5,
    y: 5.22,
    w: 7.8,
    h: 0.22,
    fontSize: 10,
    fontFace: FONT,
    color: C.muted,
  });
  slide.addText(`${n} / ${TOTAL}`, {
    x: 8.5,
    y: 5.22,
    w: 1,
    h: 0.22,
    fontSize: 10,
    fontFace: FONT,
    color: C.muted,
    align: "right",
  });
}

function label(slide, en, zh) {
  slide.addText(en, {
    x: 0.5,
    y: 0.22,
    w: 9,
    h: 0.2,
    fontSize: 11,
    fontFace: FONT,
    color: C.brandSoft,
    bold: true,
  });
  slide.addText(zh, {
    x: 0.5,
    y: 0.42,
    w: 9,
    h: 0.2,
    fontSize: 10,
    fontFace: FONT,
    color: C.muted,
  });
}

function heading(slide, en, zh) {
  slide.addText(en, {
    x: 0.5,
    y: 0.68,
    w: 9,
    h: 0.38,
    fontSize: 24,
    fontFace: FONT,
    color: C.white,
    bold: true,
  });
  slide.addText(zh, {
    x: 0.5,
    y: 0.68 + 0.38 + GAP,
    w: 9,
    h: 0.28,
    fontSize: 12,
    fontFace: FONT,
    color: C.muted,
  });
}

function card(slide, x, y, w, h) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    fill: { color: C.card },
    rectRadius: 0.1,
    line: { color: C.border, width: 1 },
  });
}

const pptx = new PptxGenJS();
pptx.defineLayout({ name: "WIDE", width: 10, height: 5.625 });
pptx.layout = "WIDE";
pptx.author = "Hassan";
pptx.title = "DSE English Coach — Showcase by Hassan";
pptx.subject = "Corporate showcase for multinational companies in Hong Kong";

const imgLanding = shot("01-landing.png");
const imgLogin = shot("02-login.png");
const imgDash = shot("03-dashboard.png");
const imgPractice = shot("04-practice.png");

// ─── 1. Title ───────────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.5,
    y: 1.05,
    w: 0.35,
    h: 0.08,
    fill: { color: C.brand },
    rectRadius: 0.04,
  });
  s.addText("DSE English Coach", {
    x: 0.5,
    y: 1.3,
    w: 9,
    h: 0.5,
    fontSize: 32,
    fontFace: FONT,
    color: C.white,
    bold: true,
  });
  s.addText("Helping Hong Kong students prepare for HKDSE English", {
    x: 0.5,
    y: 1.9,
    w: 9,
    h: 0.35,
    fontSize: 16,
    fontFace: FONT,
    color: C.dim,
  });
  s.addText("幫助香港學生備戰香港中學文憑試（DSE）英文科", {
    x: 0.5,
    y: 2.3,
    w: 9,
    h: 0.3,
    fontSize: 13,
    fontFace: FONT,
    color: C.muted,
  });

  card(s, 0.5, 2.9, 5.5, 1.35);
  s.addText("Presented by Hassan", {
    x: 0.75,
    y: 3.1,
    w: 5,
    h: 0.35,
    fontSize: 18,
    fontFace: FONT,
    color: C.white,
    bold: true,
  });
  s.addText("Founder & Developer  ·  設計與開發：Hassan", {
    x: 0.75,
    y: 3.5,
    w: 5,
    h: 0.3,
    fontSize: 13,
    fontFace: FONT,
    color: C.brandSoft,
  });
  s.addText("Hong Kong  ·  香港", {
    x: 0.75,
    y: 3.85,
    w: 5,
    h: 0.25,
    fontSize: 12,
    fontFace: FONT,
    color: C.muted,
  });

  s.addText("A product showcase for multinational companies", {
    x: 0.5,
    y: 4.5,
    w: 9,
    h: 0.28,
    fontSize: 13,
    fontFace: FONT,
    color: C.accent,
  });
  s.addText("面向在港跨國企業的產品展示", {
    x: 0.5,
    y: 4.8,
    w: 9,
    h: 0.25,
    fontSize: 12,
    fontFace: FONT,
    color: C.muted,
  });
}

// ─── 2. Agenda ──────────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  label(s, "AGENDA", "大綱");
  heading(s, "What we will cover today", "今天的內容");

  const items = [
    ["01", "The challenge for DSE students", "DSE 學生面對的挑戰"],
    ["02", "The product solution", "產品方案"],
    ["03", "Who it helps", "服務對象"],
    ["04", "Live product screens", "產品畫面"],
    ["05", "Why this matters in Hong Kong", "為何對香港重要"],
    ["06", "Status + product demo video", "現況與產品演示影片"],
  ];
  items.forEach((it, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.5 + col * 4.7;
    const y = 1.5 + row * 1.05;
    card(s, x, y, 4.45, 0.9);
    s.addText(it[0], {
      x: x + 0.2,
      y: y + 0.15,
      w: 0.7,
      h: 0.3,
      fontSize: 16,
      fontFace: FONT,
      color: C.brandSoft,
      bold: true,
    });
    s.addText(it[1], {
      x: x + 1.0,
      y: y + 0.12,
      w: 3.2,
      h: 0.3,
      fontSize: 14,
      fontFace: FONT,
      color: C.white,
      bold: true,
    });
    s.addText(it[2], {
      x: x + 1.0,
      y: y + 0.45,
      w: 3.2,
      h: 0.28,
      fontSize: 12,
      fontFace: FONT,
      color: C.muted,
    });
  });
  foot(s, 2);
}

// ─── 3. Challenge ───────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  label(s, "THE CHALLENGE", "挑戰");
  heading(s, "DSE English is high-stakes for HK students", "DSE 英文對香港學生至關重要");

  const pains = [
    {
      en: "Four skills, one exam",
      zh: "讀寫聽說一齊考",
      d: "Students must prepare Reading, Writing, Listening and Speaking — often with uneven support.",
    },
    {
      en: "Feedback comes too late",
      zh: "反饋來得太慢",
      d: "Writing and speaking practice needs comments. Busy teachers cannot mark everything overnight.",
    },
    {
      en: "Hard to see progress",
      zh: "看不清自己的進步",
      d: "Without clear scores and weak areas, students practise hard but feel unsure.",
    },
  ];
  pains.forEach((p, i) => {
    const x = 0.5 + i * 3.1;
    card(s, x, 1.55, 2.95, 2.9);
    s.addText(p.en, {
      x: x + 0.2,
      y: 1.75,
      w: 2.55,
      h: 0.45,
      fontSize: 15,
      fontFace: FONT,
      color: C.white,
      bold: true,
    });
    s.addText(p.zh, {
      x: x + 0.2,
      y: 2.25,
      w: 2.55,
      h: 0.3,
      fontSize: 13,
      fontFace: FONT,
      color: C.brandSoft,
    });
    s.addText(p.d, {
      x: x + 0.2,
      y: 2.75,
      w: 2.55,
      h: 1.4,
      fontSize: 13,
      fontFace: FONT,
      color: C.dim,
    });
  });
  foot(s, 3);
}

// ─── 4. Solution ────────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  label(s, "THE SOLUTION", "方案");
  heading(s, "One study companion for every English skill", "一個平台練齊四項技能");

  const skills = [
    { e: "Reading", z: "閱讀" },
    { e: "Writing", z: "寫作" },
    { e: "Listening", z: "聆聽" },
    { e: "Speaking", z: "說話" },
  ];
  skills.forEach((sk, i) => {
    const x = 0.5 + i * 2.35;
    card(s, x, 1.5, 2.2, 1.2);
    s.addText(sk.e, {
      x: x + 0.15,
      y: 1.7,
      w: 1.9,
      h: 0.35,
      fontSize: 18,
      fontFace: FONT,
      color: C.white,
      bold: true,
      align: "center",
    });
    s.addText(sk.z, {
      x: x + 0.15,
      y: 2.15,
      w: 1.9,
      h: 0.3,
      fontSize: 14,
      fontFace: FONT,
      color: C.brandSoft,
      align: "center",
    });
  });

  const points = [
    ["Built around HKDSE English", "以香港 DSE 英文科為核心"],
    ["Instant practice feedback students can understand", "即時、易懂的練習反饋"],
    ["Progress dashboard for students and parents", "學習進度一目了然"],
    ["Works in English and Chinese (繁 / 简)", "介面支援英文與中文"],
  ];
  points.forEach((p, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.5 + col * 4.7;
    const y = 2.95 + row * 0.95;
    card(s, x, y, 4.45, 0.85);
    s.addText(p[0], {
      x: x + 0.2,
      y: y + 0.15,
      w: 4.05,
      h: 0.3,
      fontSize: 13,
      fontFace: FONT,
      color: C.white,
      bold: true,
    });
    s.addText(p[1], {
      x: x + 0.2,
      y: y + 0.48,
      w: 4.05,
      h: 0.28,
      fontSize: 12,
      fontFace: FONT,
      color: C.muted,
    });
  });
  foot(s, 4);
}

// ─── 5. Who it helps ────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  label(s, "WHO IT HELPS", "服務對象");
  heading(s, "Built for Hong Kong’s exam journey", "為香港公開試之路而設");

  const who = [
    {
      en: "Form 5–6 students",
      zh: "中五、中六學生",
      d: "Daily practice before DSE English — with clear scores and next steps.",
    },
    {
      en: "Parents",
      zh: "家長",
      d: "A simple view of progress, not only “how many hours studied”.",
    },
    {
      en: "Teachers & centres",
      zh: "教師與補習社",
      d: "Homework that gives students feedback between lessons.",
    },
  ];
  who.forEach((w, i) => {
    const x = 0.5 + i * 3.1;
    card(s, x, 1.55, 2.95, 2.6);
    s.addText(w.en, {
      x: x + 0.2,
      y: 1.75,
      w: 2.55,
      h: 0.4,
      fontSize: 15,
      fontFace: FONT,
      color: C.white,
      bold: true,
    });
    s.addText(w.zh, {
      x: x + 0.2,
      y: 2.2,
      w: 2.55,
      h: 0.3,
      fontSize: 13,
      fontFace: FONT,
      color: C.brandSoft,
    });
    s.addText(w.d, {
      x: x + 0.2,
      y: 2.7,
      w: 2.55,
      h: 1.2,
      fontSize: 13,
      fontFace: FONT,
      color: C.dim,
    });
  });
  s.addText("IELTS is also supported as a secondary track for students with overseas plans.", {
    x: 0.5,
    y: 4.4,
    w: 9,
    h: 0.25,
    fontSize: 12,
    fontFace: FONT,
    color: C.accent,
  });
  s.addText("亦支援 IELTS，作為有海外升學計劃學生的次要路徑。", {
    x: 0.5,
    y: 4.7,
    w: 9,
    h: 0.25,
    fontSize: 11,
    fontFace: FONT,
    color: C.muted,
  });
  foot(s, 5);
}

// ─── 6. Screens: welcome ────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  label(s, "PRODUCT DEMO", "產品演示");
  heading(s, "What students see first", "學生第一眼看到的畫面");

  if (imgLanding) {
    s.addImage({
      path: imgLanding,
      x: 0.45,
      y: 1.5,
      w: 4.5,
      h: 2.8,
      shadow: { type: "outer", color: "000000", blur: 12, opacity: 0.35 },
    });
  }
  if (imgLogin) {
    s.addImage({
      path: imgLogin,
      x: 5.15,
      y: 1.5,
      w: 4.4,
      h: 2.8,
      shadow: { type: "outer", color: "000000", blur: 12, opacity: 0.35 },
    });
  }
  s.addText("Homepage  ·  首頁", {
    x: 0.45,
    y: 4.4,
    w: 4.5,
    h: 0.25,
    fontSize: 12,
    fontFace: FONT,
    color: C.muted,
    align: "center",
  });
  s.addText("Login  ·  登入", {
    x: 5.15,
    y: 4.4,
    w: 4.4,
    h: 0.25,
    fontSize: 12,
    fontFace: FONT,
    color: C.muted,
    align: "center",
  });
  foot(s, 6);
}

// ─── 7. Screens: study ──────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  label(s, "PRODUCT DEMO", "產品演示");
  heading(s, "Where students practise every day", "學生每天練習的地方");

  if (imgDash) {
    s.addImage({
      path: imgDash,
      x: 0.45,
      y: 1.5,
      w: 4.5,
      h: 2.8,
      shadow: { type: "outer", color: "000000", blur: 12, opacity: 0.35 },
    });
  }
  if (imgPractice) {
    s.addImage({
      path: imgPractice,
      x: 5.15,
      y: 1.5,
      w: 4.4,
      h: 2.8,
      shadow: { type: "outer", color: "000000", blur: 12, opacity: 0.35 },
    });
  }
  s.addText("Dashboard — progress & weak areas  ·  學習儀表板", {
    x: 0.45,
    y: 4.4,
    w: 4.5,
    h: 0.25,
    fontSize: 11,
    fontFace: FONT,
    color: C.muted,
    align: "center",
  });
  s.addText("Practice library — DSE papers & skills  ·  練習庫", {
    x: 5.15,
    y: 4.4,
    w: 4.4,
    h: 0.25,
    fontSize: 11,
    fontFace: FONT,
    color: C.muted,
    align: "center",
  });
  foot(s, 7);
}

// ─── 8. Why HK ──────────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  label(s, "WHY HONG KONG", "為何是香港");
  heading(s, "DSE English shapes pathways for young people", "DSE 英文影響年輕人的出路");

  const reasons = [
    {
      en: "A public exam every family understands",
      zh: "家長與學生都熟悉的公開試",
      d: "English results influence university and career options across Hong Kong.",
    },
    {
      en: "Local language, global skills",
      zh: "本地語言介面，國際英語能力",
      d: "Students practise English while navigating the app in 繁體中文 or English.",
    },
    {
      en: "Relevant for companies in HK",
      zh: "與在港企業相關",
      d: "Supporting youth skills, education access, and community impact in the city you operate in.",
    },
  ];
  reasons.forEach((r, i) => {
    const y = 1.5 + i * 1.05;
    card(s, 0.5, y, 9, 0.95);
    s.addText(r.en, {
      x: 0.75,
      y: y + 0.12,
      w: 8.5,
      h: 0.28,
      fontSize: 15,
      fontFace: FONT,
      color: C.white,
      bold: true,
    });
    s.addText(r.zh, {
      x: 0.75,
      y: y + 0.4,
      w: 8.5,
      h: 0.22,
      fontSize: 12,
      fontFace: FONT,
      color: C.brandSoft,
    });
    s.addText(r.d, {
      x: 0.75,
      y: y + 0.65,
      w: 8.5,
      h: 0.22,
      fontSize: 12,
      fontFace: FONT,
      color: C.muted,
    });
  });
  foot(s, 8);
}

// ─── 9. Status ──────────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  label(s, "WHERE WE ARE", "現況");
  heading(s, "A working product foundation", "已可運行的產品基礎");

  card(s, 0.5, 1.5, 4.4, 3.0);
  card(s, 5.1, 1.5, 4.4, 3.0);

  s.addText("Ready today", {
    x: 0.7,
    y: 1.7,
    w: 4,
    h: 0.3,
    fontSize: 16,
    fontFace: FONT,
    color: C.accent,
    bold: true,
  });
  s.addText("現已可用", {
    x: 0.7,
    y: 2.05,
    w: 4,
    h: 0.25,
    fontSize: 12,
    fontFace: FONT,
    color: C.muted,
  });
  [
    "Student accounts & guest trial",
    "EN / 繁 / 简 interface",
    "DSE English practice path",
    "Reading practice end-to-end",
    "Dashboard for progress tracking",
    "Mobile-friendly design",
  ].forEach((line, i) => {
    s.addText(`•  ${line}`, {
      x: 0.7,
      y: 2.45 + i * 0.3,
      w: 4,
      h: 0.28,
      fontSize: 13,
      fontFace: FONT,
      color: C.dim,
    });
  });

  s.addText("Growing next", {
    x: 5.3,
    y: 1.7,
    w: 4,
    h: 0.3,
    fontSize: 16,
    fontFace: FONT,
    color: C.brandSoft,
    bold: true,
  });
  s.addText("下一步擴充", {
    x: 5.3,
    y: 2.05,
    w: 4,
    h: 0.25,
    fontSize: 12,
    fontFace: FONT,
    color: C.muted,
  });
  [
    "More full DSE-style papers",
    "Richer listening audio",
    "Stronger speaking practice",
    "Teacher / class tools",
    "School & centre pilots",
    "Deeper parent reports",
  ].forEach((line, i) => {
    s.addText(`•  ${line}`, {
      x: 5.3,
      y: 2.45 + i * 0.3,
      w: 4,
      h: 0.28,
      fontSize: 13,
      fontFace: FONT,
      color: C.dim,
    });
  });
  foot(s, 9);
}

// ─── 10. Demo video (2nd last) ──────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  label(s, "LIVE WALKTHROUGH", "產品演示影片");
  heading(s, "See how students use the system", "看看學生如何使用這個系統");

  if (fs.existsSync(DEMO_MP4)) {
    const cover = asDataUrl(DEMO_COVER, "image/png");
    s.addMedia({
      type: "video",
      path: DEMO_MP4,
      x: 1.1,
      y: 1.45,
      w: 7.8,
      h: 3.4,
      ...(cover ? { cover } : {}),
    });
  } else {
    card(s, 1.1, 1.45, 7.8, 3.4);
    s.addText("Demo video missing — run: npm run pitch:demo", {
      x: 1.3,
      y: 2.8,
      w: 7.4,
      h: 0.4,
      fontSize: 16,
      fontFace: FONT,
      color: C.muted,
      align: "center",
    });
  }

  s.addText("~2.5 min  ·  Click to play in PowerPoint / LibreOffice  ·  約 2.5 分鐘，點擊播放", {
    x: 0.5,
    y: 4.95,
    w: 9,
    h: 0.22,
    fontSize: 11,
    fontFace: FONT,
    color: C.muted,
    align: "center",
  });
  foot(s, 10);
}

// ─── 11. Thank you ──────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.5,
    y: 1.0,
    w: 0.35,
    h: 0.08,
    fill: { color: C.brand },
    rectRadius: 0.04,
  });
  s.addText("Thank you", {
    x: 0.5,
    y: 1.25,
    w: 9,
    h: 0.45,
    fontSize: 32,
    fontFace: FONT,
    color: C.white,
    bold: true,
  });
  s.addText("謝謝", {
    x: 0.5,
    y: 1.75,
    w: 9,
    h: 0.3,
    fontSize: 16,
    fontFace: FONT,
    color: C.muted,
  });
  s.addText("Happy to discuss how this can support students in Hong Kong.", {
    x: 0.5,
    y: 2.2,
    w: 9,
    h: 0.35,
    fontSize: 15,
    fontFace: FONT,
    color: C.dim,
  });
  s.addText("歡迎進一步交流，探討如何支持香港學生。", {
    x: 0.5,
    y: 2.55,
    w: 9,
    h: 0.3,
    fontSize: 13,
    fontFace: FONT,
    color: C.muted,
  });

  card(s, 0.5, 3.1, 9, 1.55);
  s.addText("Hassan", {
    x: 0.75,
    y: 3.25,
    w: 8.5,
    h: 0.35,
    fontSize: 20,
    fontFace: FONT,
    color: C.white,
    bold: true,
  });
  s.addText("Founder & Developer  ·  設計與開發", {
    x: 0.75,
    y: 3.65,
    w: 8.5,
    h: 0.28,
    fontSize: 13,
    fontFace: FONT,
    color: C.brandSoft,
  });
  s.addText("Let’s talk  ·  Product demo available  ·  歡迎預約產品演示", {
    x: 0.75,
    y: 4.1,
    w: 8.5,
    h: 0.3,
    fontSize: 14,
    fontFace: FONT,
    color: C.accent,
  });
  foot(s, 11);
}

await pptx.writeFile({ fileName: OUT });
console.log(`Wrote ${OUT}`);
if (!imgLanding || !imgLogin || !imgDash || !imgPractice) {
  console.warn("Warning: some screenshots missing — run: npm run pitch:screenshots");
}
