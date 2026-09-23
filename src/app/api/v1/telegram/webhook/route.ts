import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { unauthorized } from "@/server/http/errors";
import { handler, ok } from "@/server/http/response";
import { handleUpdate, type TelegramUpdate } from "@/server/modules/telegram/service";

function secretMatches(given: string | null, expected: string) {
  if (!given || !expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Telegram calls this with inline-button presses. Protected by the webhook secret header. */
export const POST = handler(async (req) => {
  if (!secretMatches(req.headers.get("x-telegram-bot-api-secret-token"), env().TELEGRAM_WEBHOOK_SECRET)) {
    throw unauthorized();
  }
  const update = (await req.json().catch(() => null)) as TelegramUpdate | null;
  if (update) await handleUpdate(update);
  // Always 200 so Telegram does not retry endlessly.
  return ok({ received: true });
});
