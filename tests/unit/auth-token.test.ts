import { describe, expect, it } from "vitest";
import { hashToken, newSessionToken, SESSION_COOKIE, signSessionJwt, verifySessionJwt } from "@/server/modules/auth/token";

const SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef";
const claims = { sid: "sess_123", uid: "user_456", role: "ADMIN" as const };

describe("session JWT", () => {
  it("round-trips claims through sign/verify", async () => {
    const jwt = await signSessionJwt(claims, SECRET, 3600);
    expect(jwt.split(".")).toHaveLength(3);
    await expect(verifySessionJwt(jwt, SECRET)).resolves.toEqual(claims);
  });

  it("returns null for a tampered payload", async () => {
    const jwt = await signSessionJwt(claims, SECRET, 3600);
    const [h, p, s] = jwt.split(".");
    const payload = JSON.parse(Buffer.from(p, "base64url").toString());
    payload.role = "SUPER_ADMIN";
    const forged = `${h}.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.${s}`;
    await expect(verifySessionJwt(forged, SECRET)).resolves.toBeNull();
  });

  it("returns null when verified with a different secret", async () => {
    const jwt = await signSessionJwt(claims, SECRET, 3600);
    await expect(verifySessionJwt(jwt, `${SECRET}x`)).resolves.toBeNull();
  });

  it("returns null for an expired token", async () => {
    const jwt = await signSessionJwt(claims, SECRET, -120); // already expired, beyond jose's default clock tolerance
    await expect(verifySessionJwt(jwt, SECRET)).resolves.toBeNull();
  });

  it("returns null for garbage input", async () => {
    await expect(verifySessionJwt("not.a.jwt", SECRET)).resolves.toBeNull();
    await expect(verifySessionJwt("", SECRET)).resolves.toBeNull();
  });

  it("rejects tokens signed with a non-HS256 algorithm header (alg:none)", async () => {
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ sub: "s", uid: "u", role: "ADMIN", exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url");
    await expect(verifySessionJwt(`${header}.${payload}.`, SECRET)).resolves.toBeNull();
  });
});

describe("opaque session tokens", () => {
  it("generates unique base64url tokens", () => {
    const a = newSessionToken();
    const b = newSessionToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });
  it("hashes deterministically with sha256 hex", () => {
    expect(hashToken("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(hashToken("abc")).toBe(hashToken("abc"));
    expect(hashToken("abd")).not.toBe(hashToken("abc"));
  });
  it("exposes the cookie name", () => {
    expect(SESSION_COOKIE).toBe("edutech_session");
  });
});
