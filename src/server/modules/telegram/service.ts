import "server-only";
import type { LeadStatus } from "@prisma/client";
import { db } from "@/server/db";
import { env } from "@/lib/env";
import { audit } from "@/server/modules/audit/service";
import { telegramClient } from "./client";
import { formatLeadMessage, leadKeyboard, parseCallback } from "./format";

const leadInclude = { course: { select: { title: true } }, service: { select: { title: true } }, branch: { select: { name: true } } } as const;

/** Sends the "new lead" notification. Never throws — failures are audited. */
export async function notifyNewLead(leadId: string): Promise<void> {
  const tg = telegramClient();
  if (!tg.enabled) return;
  const lead = await db.lead.findUnique({ where: { id: leadId }, include: leadInclude });
  if (!lead) return;
  try {
    const result = await tg.sendMessage({
      chat_id: env().TELEGRAM_CHAT_ID,
      text: formatLeadMessage(lead),
      reply_markup: leadKeyboard(lead.id),
    });
    if (result) {
      await db.lead.update({
        where: { id: lead.id },
        data: { telegramMessageId: String(result.message_id), telegramChatId: env().TELEGRAM_CHAT_ID },
      });
    }
  } catch (e) {
    console.error("[telegram] notify failed", e);
    await audit({ action: "NOTIFY_FAILED", entity: "Lead", entityId: lead.id, meta: { error: e instanceof Error ? e.message : String(e) } });
  }
}

/** Reflects a status change (from admin or Telegram) on the original Telegram message. */
export async function syncLeadMessage(leadId: string, actor?: string): Promise<void> {
  const tg = telegramClient();
  if (!tg.enabled) return;
  const lead = await db.lead.findUnique({ where: { id: leadId }, include: leadInclude });
  if (!lead?.telegramMessageId || !lead.telegramChatId) return;
  try {
    await tg.editMessage({
      chat_id: lead.telegramChatId,
      message_id: Number(lead.telegramMessageId),
      text: formatLeadMessage(lead, actor),
      reply_markup: leadKeyboard(lead.id),
    });
  } catch (e) {
    // "message is not modified" is benign
    if (!(e instanceof Error && /not modified/i.test(e.message))) console.error("[telegram] edit failed", e);
  }
}

interface CallbackQuery {
  id: string;
  data?: string;
  from?: { id: number; first_name?: string; username?: string };
  message?: { message_id: number; chat: { id: number } };
}

export interface TelegramUpdate {
  update_id: number;
  callback_query?: CallbackQuery;
}

/** Handles inline-button presses. Only callbacks from the configured chat are honoured. */
export async function handleUpdate(update: TelegramUpdate): Promise<void> {
  const cb = update.callback_query;
  if (!cb?.data) return;
  const tg = telegramClient();
  const parsed = parseCallback(cb.data);
  if (!parsed) {
    await tg.answerCallback({ callback_query_id: cb.id, text: "Nomaʼlum buyruq" });
    return;
  }
  const chatId = cb.message?.chat.id != null ? String(cb.message.chat.id) : "";
  if (chatId !== env().TELEGRAM_CHAT_ID) {
    await tg.answerCallback({ callback_query_id: cb.id, text: "Ruxsat yoʻq" });
    return;
  }
  const actor = cb.from?.username ? `@${cb.from.username}` : (cb.from?.first_name ?? "Telegram");
  const { transitionLeadStatus } = await import("@/server/modules/leads/service");
  await transitionLeadStatus(parsed.leadId, parsed.status as LeadStatus, { actorLabel: actor, viaTelegram: true });
  await tg.answerCallback({ callback_query_id: cb.id, text: `Status: ${parsed.status}` });
}
