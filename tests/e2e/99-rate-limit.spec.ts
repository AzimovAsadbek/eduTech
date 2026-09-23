import { expect, test } from "@playwright/test";
import { BASE_URL } from "../../playwright.config";

/**
 * Runs last and uses its own synthetic IP (X-Forwarded-For) so the exhausted bucket
 * never affects the browser-driven flows.
 */
test.describe.serial("API rate limit", () => {
  test("the 6th lead post from the same IP within 10 minutes returns 429", async ({ playwright }) => {
    const ip = `10.250.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
    const api = await playwright.request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Origin: BASE_URL, "X-Forwarded-For": ip } });
    const payload = (i: number) => ({ type: "GENERAL", name: `E2E RateLimit ${i}`, phone: `+99890900000${i}`, startedAt: Date.now() - 10_000, source: "e2e:rate-limit" });

    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await api.post("/api/v1/public/leads", { data: payload(i) });
      statuses.push(res.status());
      if (i === 5) {
        expect(await res.json()).toMatchObject({ ok: false, error: { code: "rate_limited" } });
      }
    }
    expect(statuses).toEqual([201, 201, 201, 201, 201, 429]);

    // a different client IP is unaffected
    const other = await playwright.request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Origin: BASE_URL, "X-Forwarded-For": "10.251.0.1" } });
    const res = await other.post("/api/v1/public/leads", { data: payload(9) });
    expect(res.status()).toBe(201);
    await api.dispose();
    await other.dispose();
  });
});
