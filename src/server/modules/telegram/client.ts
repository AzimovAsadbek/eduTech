import "server-only";
import { env } from "@/lib/env";

interface TelegramResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
}

export interface TelegramClient {
  enabled: boolean;
  sendMessage(input: { chat_id: string; text: string; reply_markup?: unknown }): Promise<{ message_id: number } | null>;
  editMessage(input: { chat_id: string; message_id: number; text: string; reply_markup?: unknown }): Promise<void>;
  answerCallback(input: { callback_query_id: string; text?: string }): Promise<void>;
}

const RETRIES = 2;

async function call<T>(method: string, body: unknown): Promise<T | null> {
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_API_BASE } = env();
  const base = TELEGRAM_API_BASE || "https://api.telegram.org";
  const url = `${base}/bot${TELEGRAM_BOT_TOKEN}/${method}`;
  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
      });
      const json = (await res.json()) as TelegramResponse<T>;
      if (json.ok) return json.result ?? null;
      // 4xx from Telegram is not retryable (bad chat id, message unchanged, etc.)
      if (res.status >= 400 && res.status < 500) throw new Error(json.description ?? `telegram ${method} failed`);
      lastError = new Error(json.description ?? `telegram ${method} failed`);
    } catch (e) {
      lastError = e;
      if (e instanceof Error && !/timeout|fetch|network|5\d\d/i.test(e.message)) throw e;
    }
    await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
  }
  throw lastError instanceof Error ? lastError : new Error("telegram unreachable");
}

export function telegramClient(): TelegramClient {
  const enabled = Boolean(env().TELEGRAM_BOT_TOKEN && env().TELEGRAM_CHAT_ID);
  return {
    enabled,
    async sendMessage(input) {
      return call<{ message_id: number }>("sendMessage", { ...input, parse_mode: "HTML", disable_web_page_preview: true });
    },
    async editMessage(input) {
      await call("editMessageText", { ...input, parse_mode: "HTML", disable_web_page_preview: true });
    },
    async answerCallback(input) {
      await call("answerCallbackQuery", input);
    },
  };
}
