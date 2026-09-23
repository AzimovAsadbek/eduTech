import "server-only";
import { cookies } from "next/headers";
import type { AdminUser, Role } from "@prisma/client";
import { db } from "@/server/db";
import { env, isProd } from "@/lib/env";
import { audit } from "@/server/modules/audit/service";
import { forbidden, unauthorized } from "@/server/http/errors";
import { hashPassword, verifyPassword } from "./password";
import { SESSION_COOKIE, hashToken, newSessionToken, signSessionJwt } from "./token";

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

export type SafeUser = Pick<AdminUser, "id" | "email" | "name" | "role" | "isActive" | "lastLoginAt" | "createdAt">;

export const safeUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

export interface AuthContext {
  user: SafeUser;
  sessionId: string;
}

export async function login(input: { email: string; password: string }, meta: { ip?: string; userAgent?: string }) {
  const email = input.email.toLowerCase();
  const user = await db.adminUser.findUnique({ where: { email } });

  const deny = async (reason: string) => {
    await audit({ userId: user?.id, action: "LOGIN_FAILED", entity: "AdminUser", entityId: user?.id, ip: meta.ip, meta: { reason, email } });
    throw unauthorized("Email yoki parol notoʻgʻri");
  };

  if (!user || !user.isActive) return deny("unknown_or_inactive");
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await audit({ userId: user.id, action: "LOGIN_FAILED", entity: "AdminUser", entityId: user.id, ip: meta.ip, meta: { reason: "locked" } });
    throw unauthorized(`Hisob vaqtincha bloklangan. ${LOCK_MINUTES} daqiqadan soʻng urinib koʻring.`);
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    const attempts = user.failedLoginAttempts + 1;
    await db.adminUser.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil: attempts >= MAX_FAILED ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
      },
    });
    return deny("bad_password");
  }

  const token = newSessionToken();
  const ttlSeconds = env().SESSION_TTL_HOURS * 3600;
  const session = await db.session.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      ip: meta.ip,
      userAgent: meta.userAgent?.slice(0, 300),
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    },
  });
  await db.adminUser.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  const jwt = await signSessionJwt({ sid: session.id, uid: user.id, role: user.role }, env().AUTH_SECRET, ttlSeconds);
  await setSessionCookie(jwt, ttlSeconds);
  await audit({ userId: user.id, action: "LOGIN", entity: "AdminUser", entityId: user.id, ip: meta.ip });

  // The raw token is embedded in the JWT subject indirectly via session id; we store only the hash.
  return { user: toSafe(user), sessionId: session.id };
}

export async function logout(ctx: AuthContext | null) {
  if (ctx) {
    await db.session.updateMany({ where: { id: ctx.sessionId, revokedAt: null }, data: { revokedAt: new Date() } });
    await audit({ userId: ctx.user.id, action: "LOGOUT", entity: "AdminUser", entityId: ctx.user.id });
  }
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

async function setSessionCookie(jwt: string, ttlSeconds: number) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: isProd(),
    sameSite: "lax",
    path: "/",
    maxAge: ttlSeconds,
  });
}

/** Resolves the current admin from the cookie, verifying the DB session (revocation-safe). */
export async function getAuth(): Promise<AuthContext | null> {
  const jar = await cookies();
  const jwt = jar.get(SESSION_COOKIE)?.value;
  if (!jwt) return null;
  const { verifySessionJwt } = await import("./token");
  const claims = await verifySessionJwt(jwt, env().AUTH_SECRET);
  if (!claims) return null;
  const session = await db.session.findUnique({
    where: { id: claims.sid },
    include: { user: { select: safeUserSelect } },
  });
  if (!session || session.revokedAt || session.expiresAt < new Date() || !session.user.isActive) return null;
  return { user: session.user, sessionId: session.id };
}

const rank: Record<Role, number> = { EDITOR: 1, ADMIN: 2, SUPER_ADMIN: 3 };

export async function requireAuth(): Promise<AuthContext> {
  const ctx = await getAuth();
  if (!ctx) throw unauthorized("Tizimga kiring");
  return ctx;
}

export async function requireRole(min: Role): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (rank[ctx.user.role] < rank[min]) throw forbidden("Bu amal uchun huquq yetarli emas");
  return ctx;
}

export function hasRole(role: Role, min: Role) {
  return rank[role] >= rank[min];
}

// ── User management (SUPER_ADMIN) ────────────────────────────────────

export async function listUsers(): Promise<SafeUser[]> {
  return db.adminUser.findMany({ select: safeUserSelect, orderBy: { createdAt: "asc" } });
}

export async function createUser(input: { email: string; name: string; password: string; role: Role }, actorId: string) {
  const user = await db.adminUser.create({
    data: { email: input.email.toLowerCase(), name: input.name, role: input.role, passwordHash: await hashPassword(input.password) },
    select: safeUserSelect,
  });
  await audit({ userId: actorId, action: "CREATE", entity: "AdminUser", entityId: user.id, meta: { role: user.role } });
  return user;
}

export async function updateUser(
  id: string,
  input: { name?: string; role?: Role; isActive?: boolean; password?: string },
  actorId: string,
) {
  const user = await db.adminUser.update({
    where: { id },
    data: {
      name: input.name,
      role: input.role,
      isActive: input.isActive,
      passwordHash: input.password ? await hashPassword(input.password) : undefined,
    },
    select: safeUserSelect,
  });
  if (input.isActive === false || input.password) {
    await db.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
  }
  await audit({ userId: actorId, action: "UPDATE", entity: "AdminUser", entityId: id, meta: { fields: Object.keys(input) } });
  return user;
}

export async function changeOwnPassword(ctx: AuthContext, currentPassword: string, newPassword: string) {
  const user = await db.adminUser.findUniqueOrThrow({ where: { id: ctx.user.id } });
  if (!(await verifyPassword(currentPassword, user.passwordHash))) throw unauthorized("Joriy parol notoʻgʻri");
  await db.adminUser.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } });
  await db.session.updateMany({ where: { userId: user.id, revokedAt: null, NOT: { id: ctx.sessionId } }, data: { revokedAt: new Date() } });
  await audit({ userId: user.id, action: "UPDATE", entity: "AdminUser", entityId: user.id, meta: { fields: ["password"] } });
}

function toSafe(u: AdminUser): SafeUser {
  return { id: u.id, email: u.email, name: u.name, role: u.role, isActive: u.isActive, lastLoginAt: u.lastLoginAt, createdAt: u.createdAt };
}
