/**
 * Creates the `edutech_test` database (if missing) on the same Postgres container as the dev DB
 * and applies migrations to it. Run via `npm run test:integration`.
 */
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { TEST_DATABASE_URL } from "./env";

const TEST_DB_NAME = "edutech_test";

async function ensureDatabase() {
  const url = new URL(TEST_DATABASE_URL);
  url.pathname = "/postgres";
  const admin = new PrismaClient({ datasourceUrl: url.toString() });
  try {
    const rows = await admin.$queryRawUnsafe<{ datname: string }[]>(`SELECT datname FROM pg_database WHERE datname = '${TEST_DB_NAME}'`);
    if (rows.length === 0) {
      await admin.$executeRawUnsafe(`CREATE DATABASE "${TEST_DB_NAME}"`);
      console.log(`[test-db] created database ${TEST_DB_NAME}`);
    } else {
      console.log(`[test-db] database ${TEST_DB_NAME} already exists`);
    }
  } finally {
    await admin.$disconnect();
  }
}

async function main() {
  await ensureDatabase();
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
}

main().catch((e) => {
  console.error("[test-db] failed", e);
  process.exit(1);
});
