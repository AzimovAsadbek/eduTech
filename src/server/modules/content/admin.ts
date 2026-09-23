import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { invalidate } from "@/server/cache";
import { conflict, notFound } from "@/server/http/errors";
import { audit } from "@/server/modules/audit/service";
import { resources, type ResourceDef, type ResourceKey } from "./registry";
import type { ListQuery } from "./schema";

// Prisma delegates share the same CRUD shape; we type the subset we use.
interface Delegate {
  findMany(args: unknown): Promise<unknown[]>;
  findUnique(args: unknown): Promise<unknown | null>;
  count(args: unknown): Promise<number>;
  create(args: unknown): Promise<unknown>;
  update(args: unknown): Promise<unknown>;
  delete(args: unknown): Promise<unknown>;
}

function delegate(key: ResourceKey): Delegate {
  return db[resources[key].model] as unknown as Delegate;
}

function def(key: ResourceKey): ResourceDef {
  return resources[key];
}

export async function listResource(key: ResourceKey, query: ListQuery) {
  const def = resources[key] as ResourceDef;
  const where: Record<string, unknown> = {};
  if (def.hasStatus && query.status) where.status = query.status;
  if (query.q) where.OR = def.search.map((f) => ({ [f]: { contains: query.q, mode: "insensitive" } }));
  const d = delegate(key);
  const [items, total] = await Promise.all([
    d.findMany({
      where,
      include: def.include,
      orderBy: def.defaultOrder,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    d.count({ where }),
  ]);
  return { items, total, page: query.page, pageSize: query.pageSize };
}

export async function getResource(key: ResourceKey, id: string) {
  const item = await delegate(key).findUnique({ where: { id }, include: def(key).include });
  if (!item) throw notFound(`${resources[key].label}: element topilmadi`);
  return item;
}

function toData(key: ResourceKey, input: Record<string, unknown>) {
  const { teacherIds, ...data } = input;
  if (key === "courses" && Array.isArray(teacherIds)) {
    return {
      ...data,
      teachers: { deleteMany: {}, create: (teacherIds as string[]).map((teacherId) => ({ teacherId })) },
    };
  }
  return data;
}

export async function createResource(key: ResourceKey, input: Record<string, unknown>, actorId: string) {
  const data = toData(key, input);
  if (key === "courses" && "teachers" in data) {
    const t = data.teachers as { create: unknown };
    data.teachers = { create: t.create };
  }
  try {
    const item = (await delegate(key).create({ data, include: def(key).include })) as { id: string };
    await audit({ userId: actorId, action: "CREATE", entity: resources[key].model, entityId: item.id });
    invalidate(...resources[key].tags);
    return item;
  } catch (e) {
    throw mapPrismaError(e);
  }
}

export async function updateResource(key: ResourceKey, id: string, input: Record<string, unknown>, actorId: string) {
  try {
    const item = (await delegate(key).update({ where: { id }, data: toData(key, input), include: def(key).include })) as { id: string };
    await audit({ userId: actorId, action: "UPDATE", entity: resources[key].model, entityId: id, meta: { fields: Object.keys(input) } });
    invalidate(...resources[key].tags);
    return item;
  } catch (e) {
    throw mapPrismaError(e);
  }
}

export async function deleteResource(key: ResourceKey, id: string, actorId: string) {
  try {
    await delegate(key).delete({ where: { id } });
  } catch (e) {
    throw mapPrismaError(e);
  }
  await audit({ userId: actorId, action: "DELETE", entity: resources[key].model, entityId: id });
  invalidate(...resources[key].tags);
}

export async function reorderResource(key: ResourceKey, ids: string[], actorId: string) {
  const d = delegate(key);
  await db.$transaction(ids.map((id, order) => d.update({ where: { id }, data: { order } }) as Prisma.PrismaPromise<unknown>));
  await audit({ userId: actorId, action: "UPDATE", entity: resources[key].model, meta: { reorder: ids.length } });
  invalidate(...resources[key].tags);
}

function mapPrismaError(e: unknown): unknown {
  const code = (e as { code?: string })?.code;
  if (code === "P2002") return conflict("Bu slug yoki nom allaqachon mavjud");
  if (code === "P2025") return notFound("Element topilmadi");
  return e;
}
