import { expect, test } from "@playwright/test";

test.describe("Accessibility smoke (390×844)", () => {
  test("homepage has exactly one h1 and a working skip link", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    const skip = page.locator('a[href="#main"]');
    await expect(skip).toHaveCount(1);
    await expect(page.locator("#main")).toHaveCount(1);
    // the skip link becomes visible on keyboard focus
    await skip.focus();
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
  });

  test("the mobile menu button toggles aria-expanded and the menu dialog", async ({ page }) => {
    await page.goto("/");
    const button = page.getByRole("button", { name: /Menyuni/ });
    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(button).toHaveAttribute("aria-controls", "mobile-menu");

    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(button).toHaveAccessibleName(/yopish/i);
    await expect(page.locator("#mobile-menu")).toBeVisible();

    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(button).toHaveAccessibleName(/ochish/i);
  });

  test("form fields on /kontakt are labelled", async ({ page }) => {
    await page.goto("/kontakt");
    const form = page.locator("form").filter({ has: page.getByRole("combobox", { name: /Qiziqish/ }) });
    for (const label of ["Ismingiz", "Telefon", "Xabar"]) {
      await expect(form.getByLabel(label)).toBeVisible();
    }
    // The custom select exposes an accessible name through aria-labelledby.
    await expect(form.getByRole("combobox", { name: /Qiziqish/ })).toBeVisible();
  });
});
