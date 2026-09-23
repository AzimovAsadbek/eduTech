import type { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { seedCourse, testDb, truncateAll } from "../helpers/db";
import { startTelegramMock, type TelegramMock } from "../helpers/telegram-mock";

const CHAT_ID = "123";

let db: PrismaClient;
let mock: TelegramMock;
let telegram: typeof import("@/server/modules/telegram/service");
let leads: typeof import("@/server/modules/leads/service");

beforeAll(async () => {
  mock = await startTelegramMock();
  // env() is cached on first use, so configure Telegram before any server module is imported.
  process.env.TELEGRAM_API_BASE = mock.url;
  process.env.TELEGRAM_BOT_TOKEN = "test";
  process.env.TELEGRAM_CHAT_ID = CHAT_ID;
  db = await testDb();
  telegram = await import("@/server/modules/telegram/service");
  leads = await import("@/server/modules/leads/service");
  await truncateAll(db);
});

afterAll(async () => {
  await mock.close();
});

beforeEach(async () => {
  mock.reset();
  await truncateAll(db, ["LeadNote", "Lead", "AuditLog", "Course"]);
});

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("notifyNewLead", () => {
  it("POSTs sendMessage with HTML parse mode and an inline keyboard, then stores the message id", async () => {
    const course = await seedCourse(db, { slug: "dasturlash", title: "Dasturlash & Web" });
    const lead = await db.lead.create({ data: { type: "EDUCATION", name: "Ali <Valiyev>", phone: "+998901234567", courseId: course.id } });

    await telegram.notifyNewLead(lead.id);

    const req = await mock.waitFor("sendMessage", 2000);
    expect(req.path).toBe("/bottest/sendMessage");
    const body = req.body as Record<string, unknown>;
    expect(body.chat_id).toBe(CHAT_ID);
    expect(body.parse_mode).toBe("HTML");
    expect(body.disable_web_page_preview).toBe(true);
    expect(String(body.text)).toContain("Ali &lt;Valiyev&gt;");
    expect(String(body.text)).toContain("Dasturlash &amp; Web");
    const kb = (body.reply_markup as { inline_keyboard: { callback_data: string }[][] }).inline_keyboard;
    expect(kb).toHaveLength(2);
    expect(kb.flat().map((b) => b.callback_data)).toEqual([`lead:${lead.id}:CONTACTED`, `lead:${lead.id}:IN_PROGRESS`, `lead:${lead.id}:CONVERTED`, `lead:${lead.id}:LOST`]);

    const saved = await db.lead.findUniqueOrThrow({ where: { id: lead.id } });
    expect(saved.telegramMessageId).toBe("1000");
    expect(saved.telegramChatId).toBe(CHAT_ID);
  });

  it("is triggered out-of-band by createPublicLead", async () => {
    const r = await leads.createPublicLead({ type: "GENERAL", name: "Kamola", phone: "+998 93 000 00 00", startedAt: Date.now() - 10_000 }, {});
    const req = await mock.waitFor("sendMessage", 3000);
    expect(String((req.body as { text: string }).text)).toContain("Kamola");
    // wait for the follow-up DB write
    for (let i = 0; i < 40; i++) {
      if ((await db.lead.findUniqueOrThrow({ where: { id: r.id } })).telegramMessageId) break;
      await wait(50);
    }
    expect((await db.lead.findUniqueOrThrow({ where: { id: r.id } })).telegramMessageId).toBeTruthy();
  });

  it("does nothing for an unknown lead id", async () => {
    await telegram.notifyNewLead("clxunknown0000000000");
    await wait(100);
    expect(mock.requests).toHaveLength(0);
  });
});

describe("handleUpdate (callback_query)", () => {
  async function seedNotifiedLead() {
    const lead = await db.lead.create({ data: { type: "GENERAL", name: "Ali Valiyev", phone: "+998901234567", telegramMessageId: "555", telegramChatId: CHAT_ID } });
    return lead;
  }

  it("changes the status when the callback comes from the configured chat", async () => {
    const lead = await seedNotifiedLead();
    await telegram.handleUpdate({
      update_id: 1,
      callback_query: { id: "cb1", data: `lead:${lead.id}:CONTACTED`, from: { id: 42, username: "tester" }, message: { message_id: 555, chat: { id: Number(CHAT_ID) } } },
    });

    const saved = await db.lead.findUniqueOrThrow({ where: { id: lead.id } });
    expect(saved.status).toBe("CONTACTED");
    expect(saved.contactedAt).toBeInstanceOf(Date);

    const audit = await db.auditLog.findFirst({ where: { entityId: lead.id, action: "STATUS_CHANGE" } });
    expect(audit?.meta).toEqual({ status: "CONTACTED", via: "telegram", actor: "@tester" });

    const answer = await mock.waitFor("answerCallbackQuery", 2000);
    expect(answer.body).toEqual({ callback_query_id: "cb1", text: "Status: CONTACTED" });

    // the original message is edited to reflect the new status (fire-and-forget)
    const edit = await mock.waitFor("editMessageText", 3000);
    const editBody = edit.body as Record<string, unknown>;
    expect(editBody.chat_id).toBe(CHAT_ID);
    expect(editBody.message_id).toBe(555);
    expect(editBody.parse_mode).toBe("HTML");
    expect(String(editBody.text)).toContain("Bogʻlanildi");
    expect(String(editBody.text)).toContain("(@tester)");
  });

  it("refuses callbacks from any other chat", async () => {
    const lead = await seedNotifiedLead();
    await telegram.handleUpdate({
      update_id: 2,
      callback_query: { id: "cb2", data: `lead:${lead.id}:CONVERTED`, from: { id: 7, first_name: "Mallory" }, message: { message_id: 1, chat: { id: 999 } } },
    });
    expect((await db.lead.findUniqueOrThrow({ where: { id: lead.id } })).status).toBe("NEW");
    expect(await db.auditLog.count({ where: { entityId: lead.id } })).toBe(0);
    const answer = await mock.waitFor("answerCallbackQuery", 2000);
    expect(answer.body).toEqual({ callback_query_id: "cb2", text: "Ruxsat yoʻq" });
    await wait(150);
    expect(mock.requests.filter((r) => r.method === "editMessageText")).toHaveLength(0);
  });

  it("answers 'unknown command' for malformed callback data and ignores non-callback updates", async () => {
    await telegram.handleUpdate({ update_id: 3, callback_query: { id: "cb3", data: "lead:x:DROP", message: { message_id: 1, chat: { id: Number(CHAT_ID) } } } });
    const answer = await mock.waitFor("answerCallbackQuery", 2000);
    expect(answer.body).toEqual({ callback_query_id: "cb3", text: "Nomaʼlum buyruq" });

    mock.reset();
    await telegram.handleUpdate({ update_id: 4 });
    await wait(100);
    expect(mock.requests).toHaveLength(0);
  });
});
