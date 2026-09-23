import type { PrismaClient } from "@prisma/client";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { seedAdmin, testDb, truncateAll } from "../helpers/db";
import { cookieJar } from "../helpers/next-headers";

const PASSWORD = "Correct-Horse-1";
let db: PrismaClient;
let auth: typeof import("@/server/modules/auth/service");
let token: typeof import("@/server/modules/auth/token");

beforeAll(async () => {
  db = await testDb();
  auth = await import("@/server/modules/auth/service");
  token = await import("@/server/modules/auth/token");
  await truncateAll(db);
});

beforeEach(async () => {
  cookieJar.clear();
  await truncateAll(db, ["AuditLog", "Session", "AdminUser"]);
});

describe("login", () => {
  it("creates a session row, sets the httpOnly cookie and audits LOGIN for a valid password", async () => {
    const user = await seedAdmin(db, { email: "admin@test.local", password: PASSWORD, role: "SUPER_ADMIN" });
    const before = Date.now();

    const result = await auth.login({ email: "Admin@Test.local", password: PASSWORD }, { ip: "203.0.113.9", userAgent: "vitest/1.0" });
    expect(result.user).toMatchObject({ id: user.id, email: "admin@test.local", role: "SUPER_ADMIN" });
    expect(result.user).not.toHaveProperty("passwordHash");

    const session = await db.session.findUniqueOrThrow({ where: { id: result.sessionId } });
    expect(session.userId).toBe(user.id);
    expect(session.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(session.ip).toBe("203.0.113.9");
    expect(session.userAgent).toBe("vitest/1.0");
    expect(session.revokedAt).toBeNull();
    const ttlMs = session.expiresAt.getTime() - before;
    expect(ttlMs).toBeGreaterThan(11.9 * 3600_000);
    expect(ttlMs).toBeLessThan(12.1 * 3600_000);

    const cookie = cookieJar.get(token.SESSION_COOKIE);
    expect(cookie).toBeDefined();
    expect(cookie!.options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/", maxAge: 12 * 3600, secure: false });
    const claims = await token.verifySessionJwt(cookie!.value, process.env.AUTH_SECRET!);
    expect(claims).toEqual({ sid: session.id, uid: user.id, role: "SUPER_ADMIN" });

    const refreshed = await db.adminUser.findUniqueOrThrow({ where: { id: user.id } });
    expect(refreshed.lastLoginAt).toBeInstanceOf(Date);
    expect(refreshed.failedLoginAttempts).toBe(0);
    expect(await db.auditLog.count({ where: { action: "LOGIN", userId: user.id } })).toBe(1);
  });

  it("locks the account after 5 wrong passwords and refuses even the right one afterwards", async () => {
    const user = await seedAdmin(db, { email: "admin@test.local", password: PASSWORD });

    for (let i = 1; i <= 5; i++) {
      await expect(auth.login({ email: "admin@test.local", password: "wrong-password" }, {})).rejects.toMatchObject({ status: 401, message: "Email yoki parol notoʻgʻri" });
      const u = await db.adminUser.findUniqueOrThrow({ where: { id: user.id } });
      expect(u.failedLoginAttempts).toBe(i);
      if (i < 5) expect(u.lockedUntil).toBeNull();
    }

    const locked = await db.adminUser.findUniqueOrThrow({ where: { id: user.id } });
    expect(locked.lockedUntil).toBeInstanceOf(Date);
    expect(locked.lockedUntil!.getTime()).toBeGreaterThan(Date.now() + 14 * 60_000);
    expect(locked.lockedUntil!.getTime()).toBeLessThan(Date.now() + 16 * 60_000);

    await expect(auth.login({ email: "admin@test.local", password: PASSWORD }, {})).rejects.toMatchObject({ status: 401, message: expect.stringContaining("bloklangan") });
    expect(cookieJar.all()).toHaveLength(0);
    expect(await db.session.count()).toBe(0);

    const failed = await db.auditLog.findMany({ where: { action: "LOGIN_FAILED", userId: user.id }, orderBy: { createdAt: "asc" } });
    expect(failed).toHaveLength(6);
    expect(failed.slice(0, 5).map((l) => (l.meta as { reason: string }).reason)).toEqual(Array(5).fill("bad_password"));
    expect((failed[5].meta as { reason: string }).reason).toBe("locked");
  });

  it("resets the failure counter after a successful login", async () => {
    const user = await seedAdmin(db, { email: "admin@test.local", password: PASSWORD });
    await expect(auth.login({ email: "admin@test.local", password: "nope-nope" }, {})).rejects.toMatchObject({ status: 401 });
    await auth.login({ email: "admin@test.local", password: PASSWORD }, {});
    const u = await db.adminUser.findUniqueOrThrow({ where: { id: user.id } });
    expect(u.failedLoginAttempts).toBe(0);
    expect(u.lockedUntil).toBeNull();
  });

  it("rejects unknown and inactive users with the same generic 401", async () => {
    await expect(auth.login({ email: "ghost@test.local", password: PASSWORD }, {})).rejects.toMatchObject({ status: 401, message: "Email yoki parol notoʻgʻri" });
    const user = await seedAdmin(db, { email: "off@test.local", password: PASSWORD });
    await db.adminUser.update({ where: { id: user.id }, data: { isActive: false } });
    await expect(auth.login({ email: "off@test.local", password: PASSWORD }, {})).rejects.toMatchObject({ status: 401, message: "Email yoki parol notoʻgʻri" });
    expect(await db.auditLog.count({ where: { action: "LOGIN_FAILED" } })).toBe(2);
  });
});

describe("getAuth / requireRole / logout", () => {
  it("resolves the session from the cookie, enforces roles and revokes on logout", async () => {
    await seedAdmin(db, { email: "editor@test.local", password: PASSWORD, role: "EDITOR" });
    expect(await auth.getAuth()).toBeNull();

    const { sessionId } = await auth.login({ email: "editor@test.local", password: PASSWORD }, {});
    const ctx = await auth.getAuth();
    expect(ctx?.sessionId).toBe(sessionId);
    expect(ctx?.user.role).toBe("EDITOR");

    await expect(auth.requireRole("EDITOR")).resolves.toBeTruthy();
    await expect(auth.requireRole("ADMIN")).rejects.toMatchObject({ status: 403 });

    await auth.logout(ctx);
    expect(cookieJar.get(token.SESSION_COOKIE)).toBeUndefined();
    expect((await db.session.findUniqueOrThrow({ where: { id: sessionId } })).revokedAt).toBeInstanceOf(Date);
    await expect(auth.requireAuth()).rejects.toMatchObject({ status: 401 });

    // a revoked session is refused even if the cookie is replayed
    const jwt = await token.signSessionJwt({ sid: sessionId, uid: ctx!.user.id, role: "EDITOR" }, process.env.AUTH_SECRET!, 3600);
    (await import("../helpers/next-headers")).cookies().then((jar) => jar.set(token.SESSION_COOKIE, jwt));
    expect(await auth.getAuth()).toBeNull();
  });
});
