import { expect, test } from "@playwright/test";

const PUBLIC_PATHS = ["/", "/kurslar", "/media", "/media/portfolio", "/natijalar", "/biz-haqimizda", "/kontakt", "/sitemap.xml", "/robots.txt"];

test.describe("Public smoke", () => {
  for (const path of PUBLIC_PATHS) {
    test(`GET ${path} responds 200`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status(), `${path} → ${res.status()}`).toBe(200);
      const body = await res.text();
      expect(body.length).toBeGreaterThan(0);
      if (path === "/sitemap.xml") expect(body).toContain("<urlset");
      if (path === "/robots.txt") expect(body).toMatch(/User-agent/i);
    });
  }

  test("an unknown path returns the custom 404 page", async ({ page }) => {
    const res = await page.goto("/bu-sahifa-mavjud-emas-e2e");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("yaratilmagan");
    await expect(page.getByText("404", { exact: true })).toBeVisible();
  });

  test("/admin redirects an anonymous visitor to /admin/login", async ({ request }) => {
    const res = await request.get("/admin", { maxRedirects: 0 });
    expect([302, 307, 308]).toContain(res.status());
    const location = res.headers()["location"] ?? "";
    expect(location).toContain("/admin/login");
    expect(location).toContain("next=%2Fadmin");
  });

  test("responses carry a nonce-based CSP and the other security headers", async ({ request }) => {
    const res = await request.get("/");
    const h = res.headers();
    expect(h["content-security-policy"]).toBeDefined();
    expect(h["content-security-policy"]).toMatch(/script-src[^;]*'nonce-[A-Za-z0-9+/=]+'/);
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["x-powered-by"]).toBeUndefined();
  });

  test("the public lead API validates input (422) and blocks cross-origin posts (403)", async ({ request }) => {
    const invalid = await request.post("/api/v1/public/leads", { data: { type: "GENERAL", name: "A", phone: "1" } });
    expect(invalid.status()).toBe(422);
    const body = (await invalid.json()) as { error: { code: string; details: { path: string }[] } };
    expect(body.error.code).toBe("validation_error");
    expect(body.error.details.map((d) => d.path)).toEqual(expect.arrayContaining(["name", "phone"]));

    const crossOrigin = await request.post("/api/v1/public/leads", {
      data: { type: "GENERAL", name: "Cross Origin", phone: "+998901234567" },
      headers: { Origin: "https://evil.example" },
    });
    expect(crossOrigin.status()).toBe(403);
  });

  test("the admin API refuses anonymous access", async ({ request }) => {
    const res = await request.get("/api/v1/admin/leads");
    expect(res.status()).toBe(401);
  });
});
