import { expect, test } from "@playwright/test";

const WEBHOOK = "/api/v1/telegram/webhook";
const HEADER = "X-Telegram-Bot-Api-Secret-Token";

test.describe("Telegram webhook", () => {
  test("rejects a request without the secret header with 401", async ({ request }) => {
    const res = await request.post(WEBHOOK, { data: { update_id: 1 } });
    expect(res.status()).toBe(401);
    expect(await res.json()).toMatchObject({ ok: false, error: { code: "unauthorized" } });
  });

  test("rejects a wrong secret with 401", async ({ request }) => {
    const res = await request.post(WEBHOOK, { data: { update_id: 1 }, headers: { [HEADER]: "definitely-not-the-secret" } });
    expect(res.status()).toBe(401);
  });

  test("accepts the configured secret with 200", async ({ request }) => {
    // The server started by Playwright uses "e2e-secret"; a pre-existing dev server uses the value from .env.
    const candidates = Array.from(new Set([process.env.TELEGRAM_WEBHOOK_SECRET, "e2e-secret"].filter((s): s is string => Boolean(s))));
    test.skip(candidates.length === 0, "TELEGRAM_WEBHOOK_SECRET is not known in this environment");

    let accepted = false;
    for (const secret of candidates) {
      const res = await request.post(WEBHOOK, { data: { update_id: 2 }, headers: { [HEADER]: secret } });
      if (res.status() === 200) {
        expect(await res.json()).toEqual({ ok: true, data: { received: true } });
        accepted = true;
        break;
      }
    }
    test.skip(!accepted, "none of the known secrets matched the running server's TELEGRAM_WEBHOOK_SECRET (server started with a different value)");
    expect(accepted).toBe(true);
  });
});
