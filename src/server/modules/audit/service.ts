import "server-only";
import type { AuditAction, Prisma } from "@prisma/client";
import { db } from "@/server/db";

export interface AuditInput {
  userId?: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  meta?: Prisma.InputJsonValue;
  ip?: string | null;
}

/** Fire-and-forget audit logging; never throws into the caller path. */
export async function audit(input: AuditInput): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        meta: input.meta,
        ip: input.ip ?? null,
      },
    });
  } catch (e) {
    console.error("[audit] failed", e);
  }
}

export async function listAudit(limit = 50) {
  return db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { name: true, email: true } } },
  });
}
