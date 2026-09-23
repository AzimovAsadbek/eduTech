import { expect, test } from "@playwright/test";
import { adminApi, assertTelegramPayload, expectTelegramSendMessageOrSkip, findLead, resetMock, submitLeadForm, type LeadRow } from "./helpers";

const NAME = "E2E Test";
const PHONE = "+998901234567";

test.describe.serial("Education: course list → detail → application → admin API → Telegram", () => {
  let lead: LeadRow | undefined;
  let courseSlug = "";

  test.beforeAll(async () => {
    await resetMock();
  });

  test("submits the pinned application form on the first course's detail page", async ({ page }) => {
    await page.goto("/kurslar");
    await expect(page.locator("h1")).toBeVisible();

    const firstCourse = page.locator('ol a[href^="/kurslar/"]').first();
    await expect(firstCourse).toBeVisible();
    const href = await firstCourse.getAttribute("href");
    courseSlug = href!.split("/").pop()!;
    await firstCourse.click();
    await expect(page).toHaveURL(new RegExp(`/kurslar/${courseSlug}$`));

    const form = page.locator("#ariza form");
    await expect(form).toBeVisible();
    await form.getByLabel("Ismingiz").fill(NAME);
    await form.getByLabel("Telefon").fill(PHONE);
    await expect(form.getByLabel("Qiziqqan kurs")).toHaveValue(courseSlug);
    await submitLeadForm(page, form, "Ariza yuborish", page.locator("#ariza"));
  });

  test("the lead is visible through the admin API as EDUCATION with a courseId", async ({ playwright }) => {
    const api = await adminApi(playwright);
    lead = await findLead(api, "E2E", PHONE);
    expect(lead.type).toBe("EDUCATION");
    expect(lead.name).toBe(NAME);
    expect(lead.courseId).toBeTruthy();
    expect(lead.course?.slug).toBe(courseSlug);
    expect(lead.status).toBe("NEW");
    expect(lead.source).toBe(`course:${courseSlug}`);
    await api.dispose();
  });

  test("Telegram receives an HTML notification with the inline keyboard", async () => {
    test.skip(!lead, "lead was not created");
    const req = await expectTelegramSendMessageOrSkip(NAME);
    assertTelegramPayload(req, { chatId: "424242", textIncludes: ["NEW LEAD", NAME, PHONE, `lead.id`.replace("lead.id", lead!.id.slice(-8))] });
  });
});
