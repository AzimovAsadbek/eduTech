import { SignJWT, jwtVerify } from "jose";
import { createHash, randomBytes } from "node:crypto";

export const SESSION_COOKIE = "edutech_session";

export interface SessionClaims {
  sid: string;
  uid: string;
  role: "SUPER_ADMIN" | "ADMIN" | "EDITOR";
}

const key = (secret: string) => new TextEncoder().encode(secret);

export function newSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function signSessionJwt(claims: SessionClaims, secret: string, ttlSeconds: number): Promise<string> {
  return new SignJWT({ uid: claims.uid, role: claims.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sid)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
    .sign(key(secret));
}

/** Edge-safe verification (no DB) — used in proxy.ts for routing decisions only. */
export async function verifySessionJwt(jwt: string, secret: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(jwt, key(secret), { algorithms: ["HS256"] });
    if (!payload.sub || typeof payload.uid !== "string" || typeof payload.role !== "string") return null;
    return { sid: payload.sub, uid: payload.uid, role: payload.role as SessionClaims["role"] };
  } catch {
    return null;
  }
}
