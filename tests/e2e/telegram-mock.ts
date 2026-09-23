/**
 * Standalone Telegram Bot API mock for E2E runs (started by Playwright globalSetup via tsx):
 *   npx tsx tests/e2e/telegram-mock.ts
 * Listens on 127.0.0.1:4141, records every POST, answers { ok: true, result: { message_id } },
 * GET /__requests → recorded list, POST /__reset → clear.
 */
import { startTelegramMock } from "../helpers/telegram-mock";

const PORT = Number(process.env.TELEGRAM_MOCK_PORT ?? 4141);

startTelegramMock({ port: PORT, host: "127.0.0.1" })
  .then((mock) => {
    console.log(`[telegram-mock] listening on ${mock.url}`);
    const stop = () => mock.close().then(() => process.exit(0));
    process.on("SIGTERM", stop);
    process.on("SIGINT", stop);
  })
  .catch((e) => {
    console.error("[telegram-mock] failed to start", e);
    process.exit(1);
  });
