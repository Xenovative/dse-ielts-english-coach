import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/db";
import { ingestPaper } from "../lib/services/content";
import { adminPaperSchema } from "../lib/validators";

// Use bcrypt directly here (not lib/auth) to avoid pulling the `server-only`
// guard into the plain-Node seed runtime.
const hashPassword = (pw: string) => bcrypt.hash(pw, 10);

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dirname, "content");

function load(file: string): unknown {
  return JSON.parse(readFileSync(join(CONTENT_DIR, file), "utf-8"));
}

async function reset() {
  // Order matters due to FK constraints.
  await prisma.answer.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.skillScore.deleteMany();
  await prisma.progressMetric.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.practiceSession.deleteMany();
  await prisma.question.deleteMany();
  await prisma.passage.deleteMany();
  await prisma.audioAsset.deleteMany();
  await prisma.writingPrompt.deleteMany();
  await prisma.speakingCard.deleteMany();
  await prisma.paper.deleteMany();
  await prisma.examMode.deleteMany();
  await prisma.languagePreference.deleteMany();
  await prisma.user.deleteMany();
}

async function seedUsers() {
  await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "Admin",
      role: "admin",
      passwordHash: await hashPassword("admin1234"),
      languagePreference: { create: { locale: "en", theme: "system" } },
    },
  });
  await prisma.user.create({
    data: {
      email: "student@example.com",
      name: "Sam Student",
      role: "student",
      passwordHash: await hashPassword("student1234"),
      languagePreference: { create: { locale: "en", theme: "system" } },
    },
  });
  console.log("  ✓ users: admin@example.com / student@example.com");
}

async function seedContent() {
  const single = ["dse-reading.json", "ielts-academic-reading.json", "ielts-general-reading.json"];
  const arrays = ["writing.json", "speaking.json", "listening.json"];

  const papers: unknown[] = [];
  for (const f of single) papers.push(load(f));
  for (const f of arrays) {
    const data = load(f) as unknown[];
    papers.push(...data);
  }

  // Large original mock bank (exam-style; not official copyrighted papers).
  const bank = load("bank-generated.json") as unknown[];
  papers.push(...bank);

  let count = 0;
  for (const raw of papers) {
    const input = adminPaperSchema.parse(raw);
    const paper = await ingestPaper(input);
    count += 1;
    console.log(`  ✓ ${input.examCode} ${input.skill} — ${paper.title}`);
  }
  console.log(`  ✓ ${count} papers ingested`);
}

async function main() {
  console.log("Seeding database…");
  await reset();
  await seedUsers();
  await seedContent();
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
