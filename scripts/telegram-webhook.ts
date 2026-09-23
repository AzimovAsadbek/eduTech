/* eslint-disable no-console */
/**
 * Registers (or removes) the Telegram webhook for lead inline actions.
 *   npx tsx scripts/telegram-webhook.ts set     → setWebhook to $NEXT_PUBLIC_SITE_URL/api/v1/telegram/webhook
 *   npx tsx scripts/telegram-webhook.ts info    → getWebhookInfo
 *   npx tsx scripts/telegram-webhook.ts delete  → deleteWebhook
 */
import "dotenv/config";

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const site = process.env.NEXT_PUBLIC_SITE_URL;
const base = process.env.TELEGRAM_API_BASE || "https://api.telegram.org";
const cmd = process.argv[2] ?? "info";

if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");

async function call(method: string, body?: unknown) {
  const res = await fetch(`${base}/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  console.log(JSON.stringify(await res.json(), null, 2));
}

if (cmd === "set") {
  if (!secret || !site) throw new Error("TELEGRAM_WEBHOOK_SECRET and NEXT_PUBLIC_SITE_URL are required");
  await call("setWebhook", { url: `${site}/api/v1/telegram/webhook`, secret_token: secret, allowed_updates: ["callback_query"], drop_pending_updates: true });
} else if (cmd === "delete") {
  await call("deleteWebhook");
} else {
  await call("getWebhookInfo");
}
