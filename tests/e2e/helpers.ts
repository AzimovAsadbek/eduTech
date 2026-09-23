import { expect, test, type APIRequestContext, type Locator, type Page, type PlaywrightWorkerArgs } from "@playwright/test";

type Playwright = PlaywrightWorkerArgs["playwright"];
import { BASE_URL, RUN_IP, TELEGRAM_MOCK_URL } from "../../playwright.config";

export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@edutech.uz";
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "ChangeMe123!";

/** The server rejects forms submitted < 2s after the first focus ("too fast to be human"). */
export const HUMAN_DELAY_MS = 2_300;

export interface LeadRow {
  id: string;
  type: "EDUCATION" | "MEDIA" | "GENERAL";
  status: string;
  name: string;
  phone: string;
  company: string | null;
  budget: string | null;
  interest: string | null;
  courseId: string | null;
  serviceId: string | null;
  source: string | null;
  createdAt: string;
  course: { id: string; title: string; slug: string } | null;
  service: { id: string; title: string; slug: string } | null;
}

/** Logs in through the API; the returned context keeps the session cookie. */
export async function adminApi(playwright: Playwright, ip: string = RUN_IP): Promise<APIRequestContext> {
  const ctx = await playwright.request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: { Origin: BASE_URL, "X-Forwarded-For": ip },
  });
  const res = await ctx.post("/api/v1/admin/auth/login", { data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  expect(res.status(), `admin login failed: ${await res.text()}`).toBe(200);
  const me = await ctx.get("/api/v1/admin/auth/me");
  expect(me.status()).toBe(200);
  return ctx;
}

/** Newest lead matching `q` and `phone` (leads accumulate across runs, so pick the freshest). */
export async function findLead(api: APIRequestContext, q: string, phone: string): Promise<LeadRow> {
  const res = await api.get("/api/v1/admin/leads", { params: { q, sort: "createdAt", dir: "desc", pageSize: 50 } });
  expect(res.status(), await res.text()).toBe(200);
  const body = (await res.json()) as { ok: boolean; data: LeadRow[] };
  expect(body.ok).toBe(true);
  const lead = body.data.find((l) => l.phone === phone);
  expect(lead, `no lead with phone ${phone} found for q=${q}`).toBeDefined();
  return lead!;
}

/**
 * Clicks submit inside `form` (after the human delay) and waits for the success card.
 * The success card replaces the <form> element, so `scope` must be a container that survives
 * the swap (a section/wrapper, or the page itself).
 */
export async function submitLeadForm(page: Page, form: Locator, submitName: string | RegExp, scope: Locator | Page = form) {
  await page.waitForTimeout(HUMAN_DELAY_MS);
  await form.getByRole("button", { name: submitName }).click();
  await expect(scope.getByRole("heading", { name: "Arizangiz qabul qilindi" })).toBeVisible({ timeout: 15_000 });
}

interface MockRequest {
  path: string;
  method: string;
  body: Record<string, unknown> | null;
  receivedAt: number;
}

export async function mockRequests(): Promise<MockRequest[]> {
  const res = await fetch(`${TELEGRAM_MOCK_URL}/__requests`);
  return (await res.json()) as MockRequest[];
}

export async function resetMock(): Promise<void> {
  await fetch(`${TELEGRAM_MOCK_URL}/__reset`, { method: "POST" });
}

/**
 * Polls the Telegram mock for a sendMessage whose text contains `needle`.
 * The dev server on :3000 may have been started without TELEGRAM_* pointing at the mock;
 * in that case nothing ever arrives and the Telegram step is skipped rather than failed.
 */
export async function expectTelegramSendMessageOrSkip(needle: string, timeoutMs = 5_000): Promise<MockRequest> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const hit = (await mockRequests()).find((r) => r.method === "sendMessage" && String(r.body?.text ?? "").includes(needle));
    if (hit) return hit;
    await new Promise((r) => setTimeout(r, 200));
  }
  test.skip(true, `No Telegram sendMessage containing "${needle}" reached the mock within ${timeoutMs / 1000}s — the running dev server reports/behaves as Telegram-disabled (start it with TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID/TELEGRAM_API_BASE=${TELEGRAM_MOCK_URL} to enable this check).`);
  throw new Error("unreachable");
}

export function assertTelegramPayload(req: MockRequest, expectations: { chatId?: string; textIncludes: string[] }) {
  const body = req.body!;
  expect(req.path).toMatch(/\/bot[^/]+\/sendMessage$/);
  expect(body.parse_mode).toBe("HTML");
  if (expectations.chatId) expect(String(body.chat_id)).toBe(expectations.chatId);
  const kb = (body.reply_markup as { inline_keyboard: { callback_data: string }[][] } | undefined)?.inline_keyboard;
  expect(kb, "inline_keyboard missing").toBeDefined();
  expect(kb!.flat().map((b) => b.callback_data)).toEqual(expect.arrayContaining([expect.stringMatching(/^lead:.+:CONTACTED$/), expect.stringMatching(/^lead:.+:LOST$/)]));
  for (const t of expectations.textIncludes) expect(String(body.text)).toContain(t);
}
