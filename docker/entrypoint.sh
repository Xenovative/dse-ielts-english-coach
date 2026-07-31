#!/bin/sh
set -eu

DATA_DIR="${DATA_DIR:-/app/data}"
DB_FILE="${DATA_DIR}/prod.db"
export DATABASE_URL="${DATABASE_URL:-file:${DB_FILE}}"

mkdir -p "$DATA_DIR"

echo "[entrypoint] Applying Prisma schema..."
npx prisma db push --skip-generate

PAPER_COUNT="$(node <<'NODE'
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
prisma.paper
  .count()
  .then((count) => {
    process.stdout.write(String(count));
    return prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
NODE
)"

if [ "$PAPER_COUNT" = "0" ]; then
  echo "[entrypoint] Empty database — seeding exam content..."
  npx tsx seed/seed.ts
else
  echo "[entrypoint] Database already has $PAPER_COUNT papers — skipping seed."
fi

echo "[entrypoint] Starting Next.js on :${PORT:-3000}"
exec npx next start -H 0.0.0.0 -p "${PORT:-3000}"
