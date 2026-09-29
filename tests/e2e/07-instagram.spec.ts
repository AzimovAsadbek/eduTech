import { expect, test } from "@playwright/test";
import { adminApi, findLead, HUMAN_DELAY_MS } from "./helpers";

/** Instagram app's in-app browser (iOS). */
const IG_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 390.0.0.20.85 (iPhone15,2; iOS 18_5; uz_UZ; uz; scale=3.00; 1179x2556; 734012345)";

/**
 * Own synthetic client IP: the earlier flows already spend most of the shared run IP's lead budget
 * (5 posts / 10 min), and these two submissions must not hit the limiter.
 */
const IG_IP = `10.249.${Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}`;

test.describe.serial("Instagram: bio page, welcome card and attribution", () => {
  test.use({
    userAgent: IG_UA,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    extraHTTPHeaders: { "X-Forwarded-For": IG_IP },
  });

  test("the bio landing (/ig) takes a short application credited to Instagram · bio", async ({ page, playwright }) => {
    const phone = "+998901230071";
    const res = await page.goto("/ig");
    expect(res?.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator("h1")).toBeVisible();
    const form = page.locator("#ariza form");
    await expect(form.getByLabel("Xabar")).toHaveCount(0);
    await form.getByLabel("Ismingiz").fill("E2E Instagram Bio");
    await form.getByLabel("Telefon").fill(phone);
    await page.waitForTimeout(HUMAN_DELAY_MS);
    await form.getByRole("button", { name: /Ariza yuborish/ }).click();
    await expect(page.getByRole("heading", { name: "Arizangiz qabul qilindi" })).toBeVisible();

    const api = await adminApi(playwright);
    const lead = await findLead(api, "E2E Instagram Bio", phone);
    expect(lead).toMatchObject({ type: "EDUCATION", channel: "INSTAGRAM", utmSource: "instagram", utmMedium: "bio", landingPage: "/ig", source: "ig:bio" });
    const filtered = await api.get(`/api/v1/admin/leads?channel=INSTAGRAM&q=${encodeURIComponent("E2E Instagram Bio")}`);
    expect(((await filtered.json()) as { data: unknown[] }).data.length).toBeGreaterThan(0);
    await api.dispose();
  });

  test("a tagged story link shows the welcome card, which opens the short form", async ({ page, playwright }) => {
    const phone = "+998901230072";
    await page.goto("/?utm_source=instagram&utm_medium=story&utm_campaign=e2e_kuz");
    const card = page.getByRole("dialog", { name: "Instagramdan xush kelibsiz!" });
    await expect(card).toBeVisible({ timeout: 6000 });
    await card.getByRole("button", { name: /Yozilish/ }).click();
    const dialog = page.locator("dialog[open]");
    await expect(dialog.getByRole("heading", { name: "Bepul konsultatsiya" })).toBeVisible();
    await expect(dialog.getByLabel("Xabar")).toHaveCount(0);
    await dialog.getByLabel("Ismingiz").fill("E2E Instagram Story");
    await dialog.getByLabel("Telefon").fill(phone);
    await page.waitForTimeout(HUMAN_DELAY_MS);
    await dialog.getByRole("button", { name: /Yuborish/ }).click();
    await expect(dialog.getByRole("heading", { name: "Arizangiz qabul qilindi" })).toBeVisible();

    const api = await adminApi(playwright);
    const lead = await findLead(api, "E2E Instagram Story", phone);
    expect(lead).toMatchObject({ channel: "INSTAGRAM", utmMedium: "story", utmCampaign: "e2e_kuz", source: "ig-welcome" });
    await api.dispose();
  });
});

test.describe("Instagram welcome card", () => {
  test("is not shown to visitors from elsewhere", async ({ page }) => {
    await page.goto("/?utm_source=telegram");
    await page.waitForTimeout(2500);
    await expect(page.getByRole("dialog", { name: "Instagramdan xush kelibsiz!" })).toBeHidden();
  });
});
