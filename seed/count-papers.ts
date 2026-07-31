import { prisma } from "../lib/db";

async function main() {
  const all = await prisma.paper.count();
  const modes = await prisma.paper.findMany({ include: { examMode: true } });
  const map: Record<string, number> = {};
  for (const p of modes) {
    const k = `${p.examMode.code}:${p.skill}`;
    map[k] = (map[k] || 0) + 1;
  }
  console.log("total papers", all);
  console.log(map);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
