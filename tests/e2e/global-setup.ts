import path from "node:path";
import { TELEGRAM_MOCK_URL } from "../../playwright.config";
import { startMock } from "./mock-process";

export default async function globalSetup() {
  // Project root (config.rootDir would be the testDir, tests/e2e).
  await startMock(TELEGRAM_MOCK_URL, path.resolve(__dirname, "../.."));
}
