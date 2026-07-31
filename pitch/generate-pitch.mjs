/**
 * Bilingual B2B pitch — short, student-focused, with product screenshots.
 * Run: npm run pitch:pptx
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PptxGenJS from "pptxgenjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "DSE-IELTS-English-Coach-Pitch.pptx");
const SHOTS = path.join(__dirname, "screenshots");

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

function shot(name) {
  const p = path.join(SHOTS, name);
  return fs.existsSync(p) ? p : null;
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

function foot(slide, n, total = 10) {
  slide.addText("DSE + IELTS English Coach  ·  Confidential", {
    x: 0.5,
    y: 5.22,
    w: 7.5,
    h: 0.22,
    fontSize: 10,
    fontFace: FONT,
    color: C.muted,
  });
  slide.addText(`${n} / ${total}`, {
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

function bulletPair(slide, x, y, w, en, zh) {
  slide.addText(`•  ${en}`, {
    x,
    y,
    w,
    h: 0.28,
    fontSize: 14,
    fontFace: FONT,
    color: C.dim,
  });
  slide.addText(`   ${zh}`, {
    x,
    y: y + 0.28,
    w,
    h: 0.24,
    fontSize: 12,
    fontFace: FONT,
    color: C.muted,
  });
  return y + 0.28 + 0.24 + 0.12;
}

const pptx = new PptxGenJS();
pptx.defineLayout({ name: "WIDE", width: 10, height: 5.625 });
pptx.layout = "WIDE";
pptx.author = "DSE + IELTS English Coach";
pptx.title = "DSE + IELTS English Coach — Investment Pitch";

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
    y: 1.2,
    w: 0.35,
    h: 0.08,
    fill: { color: C.brand },
    rectRadius: 0.04,
  });
  s.addText("DSE + IELTS English Coach", {
    x: 0.5,
    y: 1.45,
    w: 9,
    h: 0.5,
    fontSize: 30,
    fontFace: FONT,
    color: C.white,
    bold: true,
  });
  s.addText("Helping students in Hong Kong & Shenzhen prepare for DSE and IELTS", {
    x: 0.5,
    y: 2.05,
    w: 8.5,
    h: 0.35,
    fontSize: 15,
    fontFace: FONT,
    color: C.dim,
  });
  s.addText("幫助香港與深圳學生備戰 DSE 與 IELTS", {
    x: 0.5,
    y: 2.45,
    w: 8.5,
    h: 0.28,
    fontSize: 13,
    fontFace: FONT,
    color: C.muted,
  });
  s.addText("帮助香港与深圳学生备战 DSE 与 IELTS", {
    x: 0.5,
    y: 2.75,
    w: 8.5,
    h: 0.28,
    fontSize: 13,
    fontFace: FONT,
    color: C.muted,
  });
  s.addText("Investment Opportunity", {
    x: 0.5,
    y: 3.35,
    w: 9,
    h: 0.3,
    fontSize: 16,
    fontFace: FONT,
    color: C.brandSoft,
    bold: true,
  });
  s.addText("投資機會  ·  投资机会", {
    x: 0.5,
    y: 3.7,
    w: 9,
    h: 0.28,
    fontSize: 13,
    fontFace: FONT,
    color: C.muted,
  });
  s.addText("For tutorial centres & private schools  ·  面向補習社與私立學校", {
    x: 0.5,
    y: 4.2,
    w: 9,
    h: 0.28,
    fontSize: 13,
    fontFace: FONT,
    color: C.dim,
  });
  s.addText("[Company Name Ltd]  ·  Confidential", {
    x: 0.5,
    y: 5.05,
    w: 9,
    h: 0.22,
    fontSize: 11,
    fontFace: FONT,
    color: C.muted,
  });
}

// ─── 2. The ask ─────────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  label(s, "THE ASK", "融資要約");
  heading(s, "200,000 HKD for 30% equity", "港幣 20 萬換取 30% 股權");

  const boxes = [
    { x: 0.5, en: "Investment", zh: "投資金額", v: "200,000 HKD" },
    { x: 3.55, en: "Your share", zh: "股權比例", v: "30%" },
    { x: 6.6, en: "Company value", zh: "投後估值", v: "~667,000 HKD" },
  ];
  for (const b of boxes) {
    card(s, b.x, 1.55, 2.9, 1.7);
    s.addText(b.en, {
      x: b.x + 0.2,
      y: 1.7,
      w: 2.5,
      h: 0.28,
      fontSize: 13,
      fontFace: FONT,
      color: C.muted,
    });
    s.addText(b.zh, {
      x: b.x + 0.2,
      y: 2.0,
      w: 2.5,
      h: 0.24,
      fontSize: 12,
      fontFace: FONT,
      color: C.brandSoft,
    });
    s.addText(b.v, {
      x: b.x + 0.15,
      y: 2.45,
      w: 2.6,
      h: 0.45,
      fontSize: 20,
      fontFace: FONT,
      color: C.white,
      bold: true,
      wrap: false,
    });
  }

  s.addText(
    "We want a partner who can bring students — through centres and schools — not only capital.",
    {
      x: 0.5,
      y: 3.55,
      w: 9,
      h: 0.35,
      fontSize: 14,
      fontFace: FONT,
      color: C.dim,
    },
  );
  s.addText(
    "我們希望夥伴能帶來學生（透過補習社／學校），而不只是資金。",
    {
      x: 0.5,
      y: 3.95,
      w: 9,
      h: 0.28,
      fontSize: 12,
      fontFace: FONT,
      color: C.muted,
    },
  );
  s.addText(
    "我们希望伙伴能带来学生（通过补习社／学校），而不只是资金。",
    {
      x: 0.5,
      y: 4.28,
      w: 9,
      h: 0.28,
      fontSize: 12,
      fontFace: FONT,
      color: C.muted,
    },
  );
  foot(s, 2);
}

// ─── 3. Students' problem ───────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  label(s, "FOR STUDENTS", "學生痛點");
  heading(s, "Students practise hard — but still feel lost", "學生很努力，卻仍不知道自己差在哪");

  const pains = [
    {
      en: "Unclear feedback",
      zh: "不知道錯在哪裡",
      d: "Teachers are busy. Students wait days for comments on writing and speaking.",
    },
    {
      en: "Mixed exams",
      zh: "DSE 與 IELTS 分開準備",
      d: "Many families need both — HK DSE now, IELTS for overseas plans.",
    },
    {
      en: "Hard to stay consistent",
      zh: "難以堅持每天練習",
      d: "Without a clear weekly plan and visible progress, motivation drops.",
    },
  ];
  pains.forEach((p, i) => {
    const x = 0.5 + i * 3.1;
    card(s, x, 1.55, 2.95, 2.85);
    s.addText(p.en, {
      x: x + 0.2,
      y: 1.75,
      w: 2.55,
      h: 0.4,
      fontSize: 15,
      fontFace: FONT,
      color: C.white,
      bold: true,
    });
    s.addText(p.zh, {
      x: x + 0.2,
      y: 2.2,
      w: 2.55,
      h: 0.3,
      fontSize: 13,
      fontFace: FONT,
      color: C.brandSoft,
    });
    s.addText(p.d, {
      x: x + 0.2,
      y: 2.7,
      w: 2.55,
      h: 1.4,
      fontSize: 13,
      fontFace: FONT,
      color: C.dim,
    });
  });
  foot(s, 3);
}

// ─── 4. What students get ───────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  label(s, "OUR ANSWER", "我們給學生甚麼");
  heading(s, "A study companion for every skill", "讀寫聽說 — 一個地方練齊");

  let y = 1.5;
  y = bulletPair(
    s,
    0.5,
    y,
    9,
    "Reading, Writing, Listening, Speaking — for DSE and IELTS",
    "閱讀、寫作、聆聽、說話 — 同時支援 DSE 與 IELTS",
  );
  y = bulletPair(
    s,
    0.5,
    y,
    9,
    "Instant scores after practice, plus clear tips on how to improve",
    "練習後即時得分，並用簡單語言說明如何進步",
  );
  y = bulletPair(
    s,
    0.5,
    y,
    9,
    "Chinese or English interface — parents and students both understand",
    "介面支援英文 / 繁體 / 簡體，家長與學生都看得懂",
  );
  y = bulletPair(
    s,
    0.5,
    y,
    9,
    "Works on phone and computer — practice anytime after class",
    "手機與電腦都可用 — 下課後隨時練習",
  );

  s.addText(
    "Centres can assign practice as homework. Students see their weak areas. Parents see progress.",
    {
      x: 0.5,
      y: 4.15,
      w: 9,
      h: 0.35,
      fontSize: 13,
      fontFace: FONT,
      color: C.accent,
    },
  );
  foot(s, 4);
}

// ─── 5. Screenshots: welcome ────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  label(s, "PRODUCT", "產品畫面");
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
  foot(s, 5);
}

// ─── 6. Screenshots: study ──────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  label(s, "PRODUCT", "產品畫面");
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
  s.addText("Practice library — pick exam & skill  ·  練習庫", {
    x: 5.15,
    y: 4.4,
    w: 4.4,
    h: 0.25,
    fontSize: 11,
    fontFace: FONT,
    color: C.muted,
    align: "center",
  });
  foot(s, 6);
}

// ─── 7. For centres ─────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  label(s, "FOR CENTRES", "給補習社 / 學校");
  heading(s, "Help more students without more overtime", "幫助更多學生，減少老師加班");

  const items = [
    {
      en: "Homework that gives feedback overnight",
      zh: "功課 overnight 就能給學生初步反饋",
    },
    {
      en: "One place for DSE and IELTS classes",
      zh: "DSE 與 IELTS 班共用同一平台",
    },
    {
      en: "Show parents clear progress, not only attendance",
      zh: "向家長展示學習進度，而不只是出席",
    },
    {
      en: "Students can start as guest, then create accounts",
      zh: "試堂可用訪客，正式學員再開帳戶",
    },
  ];
  items.forEach((it, i) => {
    const y = 1.5 + i * 0.75;
    card(s, 0.5, y, 9, 0.65);
    s.addText(it.en, {
      x: 0.75,
      y: y + 0.08,
      w: 8.5,
      h: 0.26,
      fontSize: 14,
      fontFace: FONT,
      color: C.white,
      bold: true,
    });
    s.addText(it.zh, {
      x: 0.75,
      y: y + 0.34,
      w: 8.5,
      h: 0.24,
      fontSize: 12,
      fontFace: FONT,
      color: C.muted,
    });
  });
  foot(s, 7);
}

// ─── 8. Opportunity ─────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  label(s, "OPPORTUNITY", "機會");
  heading(s, "A corridor of students who need English exams", "港深之間，大量學生需要公開試英文");

  card(s, 0.5, 1.55, 4.4, 2.8);
  card(s, 5.1, 1.55, 4.4, 2.8);

  s.addText("Hong Kong", {
    x: 0.75,
    y: 1.75,
    w: 4,
    h: 0.35,
    fontSize: 18,
    fontFace: FONT,
    color: C.white,
    bold: true,
  });
  s.addText("香港", {
    x: 0.75,
    y: 2.15,
    w: 4,
    h: 0.28,
    fontSize: 13,
    fontFace: FONT,
    color: C.brandSoft,
  });
  s.addText(
    "Every year, thousands of Form 5–6 students prepare for DSE English. Families already pay for tutorials — they want tools that show real improvement.",
    {
      x: 0.75,
      y: 2.6,
      w: 3.9,
      h: 1.4,
      fontSize: 13,
      fontFace: FONT,
      color: C.dim,
    },
  );

  s.addText("Shenzhen", {
    x: 5.35,
    y: 1.75,
    w: 4,
    h: 0.35,
    fontSize: 18,
    fontFace: FONT,
    color: C.white,
    bold: true,
  });
  s.addText("深圳", {
    x: 5.35,
    y: 2.15,
    w: 4,
    h: 0.28,
    fontSize: 13,
    fontFace: FONT,
    color: C.brandSoft,
  });
  s.addText(
    "Strong IELTS demand for overseas study. Many students also look toward Hong Kong exams — one platform covers both journeys.",
    {
      x: 5.35,
      y: 2.6,
      w: 3.9,
      h: 1.4,
      fontSize: 13,
      fontFace: FONT,
      color: C.dim,
    },
  );
  foot(s, 8);
}

// ─── 9. Deal & funds ────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  label(s, "THE DEAL", "合作條款");
  heading(s, "Simple partnership", "簡單清晰的合作");

  card(s, 0.5, 1.5, 4.4, 3.0);
  card(s, 5.1, 1.5, 4.4, 3.0);

  s.addText("How we split", {
    x: 0.7,
    y: 1.7,
    w: 4,
    h: 0.3,
    fontSize: 15,
    fontFace: FONT,
    color: C.white,
    bold: true,
  });
  s.addText("股權分配", {
    x: 0.7,
    y: 2.05,
    w: 4,
    h: 0.25,
    fontSize: 12,
    fontFace: FONT,
    color: C.muted,
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.7,
    y: 2.5,
    w: 2.8,
    h: 0.45,
    fill: { color: C.brand },
    rectRadius: 0.06,
  });
  s.addText("Team  70%", {
    x: 0.85,
    y: 2.55,
    w: 2.5,
    h: 0.35,
    fontSize: 14,
    fontFace: FONT,
    color: C.white,
    bold: true,
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.7,
    y: 3.15,
    w: 1.4,
    h: 0.45,
    fill: { color: C.accent },
    rectRadius: 0.06,
  });
  s.addText("You  30%", {
    x: 0.8,
    y: 3.2,
    w: 1.2,
    h: 0.35,
    fontSize: 13,
    fontFace: FONT,
    color: C.bg,
    bold: true,
  });
  s.addText("200,000 HKD investment", {
    x: 0.7,
    y: 3.85,
    w: 4,
    h: 0.3,
    fontSize: 13,
    fontFace: FONT,
    color: C.dim,
    wrap: false,
  });

  s.addText("Where the money goes", {
    x: 5.3,
    y: 1.7,
    w: 4,
    h: 0.3,
    fontSize: 15,
    fontFace: FONT,
    color: C.white,
    bold: true,
  });
  s.addText("資金用途", {
    x: 5.3,
    y: 2.05,
    w: 4,
    h: 0.25,
    fontSize: 12,
    fontFace: FONT,
    color: C.muted,
  });

  const funds = [
    ["35%", "More practice papers for students"],
    ["35%", "Improve the product & launch"],
    ["20%", "Pilot classes with centres"],
    ["10%", "Company setup & operations"],
  ];
  funds.forEach((f, i) => {
    s.addText(`${f[0]}   ${f[1]}`, {
      x: 5.3,
      y: 2.5 + i * 0.4,
      w: 4,
      h: 0.35,
      fontSize: 13,
      fontFace: FONT,
      color: C.dim,
    });
  });
  foot(s, 9);
}

// ─── 10. Close ──────────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.5,
    y: 1.1,
    w: 0.35,
    h: 0.08,
    fill: { color: C.brand },
    rectRadius: 0.04,
  });
  s.addText("Let’s help more students\nreach their exam goals.", {
    x: 0.5,
    y: 1.35,
    w: 9,
    h: 0.95,
    fontSize: 26,
    fontFace: FONT,
    color: C.white,
    bold: true,
  });
  s.addText("一起幫助更多學生達成公開試目標。", {
    x: 0.5,
    y: 2.45,
    w: 9,
    h: 0.3,
    fontSize: 14,
    fontFace: FONT,
    color: C.muted,
  });

  card(s, 0.5, 3.0, 9, 1.55);
  s.addText("Next step", {
    x: 0.7,
    y: 3.15,
    w: 8.5,
    h: 0.28,
    fontSize: 14,
    fontFace: FONT,
    color: C.brandSoft,
    bold: true,
  });
  s.addText("下一步", {
    x: 0.7,
    y: 3.45,
    w: 8.5,
    h: 0.24,
    fontSize: 12,
    fontFace: FONT,
    color: C.muted,
  });
  s.addText(
    "1) Try the product together    2) Discuss a pilot class    3) Agree 200,000 HKD / 30%",
    {
      x: 0.7,
      y: 3.8,
      w: 8.5,
      h: 0.3,
      fontSize: 13,
      fontFace: FONT,
      color: C.dim,
      wrap: false,
    },
  );
  s.addText("[Founder Name]  ·  [email]  ·  [WhatsApp / WeChat]", {
    x: 0.7,
    y: 4.2,
    w: 8.5,
    h: 0.25,
    fontSize: 12,
    fontFace: FONT,
    color: C.muted,
  });
  foot(s, 10);
}

await pptx.writeFile({ fileName: OUT });
console.log(`Wrote ${OUT}`);
if (!imgLanding || !imgLogin || !imgDash || !imgPractice) {
  console.warn("Warning: some screenshots missing — run: node pitch/capture-screenshots.mjs");
}
