import { applyTestEnv, TEST_DATABASE_URL } from "../helpers/env";

// Never let integration tests touch the dev database.
applyTestEnv({ database: true });
if (process.env.DATABASE_URL !== TEST_DATABASE_URL) {
  throw new Error(`Integration tests must run against ${TEST_DATABASE_URL}`);
}
