import { expect, test } from "@playwright/test";
import { adminApi, assertTelegramPayload, expectTelegramSendMessageOrSkip, findLead, resetMock, submitLeadForm, type LeadRow } from "./helpers";

const NAME = "E2E Kontakt";
const PHONE = "+998901234569";

test.describe.serial("Contact: general form on /kontakt", () => {
  let lead: LeadRow | undefined;

  test.beforeAll(async () => {
    await resetMock();
  });

  test("submits the general form", async ({ page }) => {
    const res = await page.goto("/kontakt");
    expect(res?.status()).toBe(200);
    const form = page.locator("form").filter({ has: page.getByLabel("Qiziqish") });
    await expect(form).toBeVisible();
    await form.getByLabel("Ismingiz").fill(NAME);
    await form.getByLabel("Telefon").fill(PHONE);
    await form.getByLabel("Qiziqish").selectOption("Hamkorlik");
    await form.getByLabel("Xabar").fill("E2E xabar <b>test</b>");
    // The <form> is replaced by the success card, so assert the heading at page level.
    await submitLeadForm(page, form, /^Yuborish/, page);
  });

  test("the lead is stored as GENERAL with interest and a sanitised message", async ({ playwright }) => {
    const api = await adminApi(playwright);
    lead = await findLead(api, "E2E Kontakt", PHONE);
    expect(lead.type).toBe("GENERAL");
    expect(lead.interest).toBe("Hamkorlik");
    expect(lead.courseId).toBeNull();
    expect(lead.serviceId).toBeNull();
    expect(lead.source).toBe("contact");
    const detail = await api.get(`/api/v1/admin/leads/${lead.id}`);
    expect(detail.status()).toBe(200);
    expect(((await detail.json()) as { data: { message: string } }).data.message).toBe("E2E xabar test");
    await api.dispose();
  });

  test("Telegram receives a NEW REQUEST notification", async () => {
    test.skip(!lead, "lead was not created");
    const req = await expectTelegramSendMessageOrSkip(NAME);
    assertTelegramPayload(req, { chatId: "424242", textIncludes: ["NEW REQUEST", NAME, "Hamkorlik"] });
  });
});
