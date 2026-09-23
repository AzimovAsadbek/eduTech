/**
 * Baseline environment for tests. Values are only applied when the variable is not already set,
 * except DATABASE_URL for integration runs which is forced to the dedicated `edutech_test` database.
 */
export const TEST_DATABASE_URL = "postgresql://edutech:edutech@localhost:5433/edutech_test?schema=public";

const defaults: Record<string, string> = {
  NODE_ENV: "test",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  AUTH_SECRET: "test-auth-secret-test-auth-secret-test-auth-secret-0123456789",
  SESSION_TTL_HOURS: "12",
  TELEGRAM_BOT_TOKEN: "",
  TELEGRAM_CHAT_ID: "",
  TELEGRAM_WEBHOOK_SECRET: "test-webhook-secret",
  TELEGRAM_API_BASE: "",
  UPLOAD_DIR: "./public/uploads",
  UPLOAD_PUBLIC_PATH: "/uploads",
  UPLOAD_MAX_MB: "10",
};

export function applyTestEnv(opts: { database?: boolean } = {}) {
  for (const [k, v] of Object.entries(defaults)) {
    if (process.env[k] === undefined) process.env[k] = v;
  }
  if (opts.database) process.env.DATABASE_URL = TEST_DATABASE_URL;
  else if (!process.env.DATABASE_URL) process.env.DATABASE_URL = TEST_DATABASE_URL;
}
