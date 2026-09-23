import { expect, test } from "@playwright/test";
import { adminApi, assertTelegramPayload, expectTelegramSendMessageOrSkip, findLead, resetMock, submitLeadForm, type LeadRow } from "./helpers";

const NAME = "E2E Media";
const PHONE = "+998901234568";
const COMPANY = "E2E Studio";
const BUDGET = "1–3 mln soʻm";

test.describe.serial("Media: service page → inquiry → admin API → Telegram", () => {
  let lead: LeadRow | undefined;

  test.beforeAll(async () => {
    await resetMock();
  });

  test("submits the inquiry form on /media/xizmatlar/reels-production", async ({ page }) => {
    const res = await page.goto("/media/xizmatlar/reels-production");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();

    const section = page.locator("#media-inquiry");
    const form = section.locator("form");
    await expect(form).toBeVisible();
    await form.getByLabel("Kompaniya / brend").fill(COMPANY);
    await form.getByLabel("Ismingiz").fill(NAME);
    await form.getByLabel("Telefon").fill(PHONE);
    await expect(form.getByLabel("Xizmat")).toHaveValue("reels-production");
    await form.getByLabel("Taxminiy byudjet").selectOption(BUDGET);
    await submitLeadForm(page, form, "Soʻrov yuborish", section);
  });

  test("the lead is visible through the admin API as MEDIA with a serviceId", async ({ playwright }) => {
    const api = await adminApi(playwright);
    lead = await findLead(api, "E2E Media", PHONE);
    expect(lead.type).toBe("MEDIA");
    expect(lead.serviceId).toBeTruthy();
    expect(lead.service?.slug).toBe("reels-production");
    expect(lead.company).toBe(COMPANY);
    expect(lead.budget).toBe(BUDGET);
    expect(lead.source).toBe("service:reels-production");
    await api.dispose();
  });

  test("Telegram receives a MEDIA notification", async () => {
    test.skip(!lead, "lead was not created");
    const req = await expectTelegramSendMessageOrSkip(NAME);
    assertTelegramPayload(req, { chatId: "424242", textIncludes: ["NEW MEDIA LEAD", COMPANY, NAME, BUDGET] });
  });
});
