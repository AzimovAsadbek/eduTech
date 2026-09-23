import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/server/modules/auth/password";

describe("password hashing", () => {
  it("hashes with bcrypt cost 12 and verifies the original", async () => {
    const hash = await hashPassword("ChangeMe123!");
    expect(hash).toMatch(/^\$2[aby]\$12\$/);
    await expect(verifyPassword("ChangeMe123!", hash)).resolves.toBe(true);
  }, 20_000);

  it("rejects a wrong password and produces unique salts", async () => {
    const [h1, h2] = await Promise.all([hashPassword("secret-pass"), hashPassword("secret-pass")]);
    expect(h1).not.toBe(h2);
    await expect(verifyPassword("secret-pas", h1)).resolves.toBe(false);
    await expect(verifyPassword("secret-pass", h2)).resolves.toBe(true);
  }, 20_000);
});
