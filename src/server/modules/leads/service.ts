import "server-only";
import type { LeadStatus, Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { stripHtml } from "@/lib/sanitize";
import { normalizePhone } from "@/lib/utils";
import { badRequest, notFound } from "@/server/http/errors";
import { audit } from "@/server/modules/audit/service";
import { notifyNewLead, syncLeadMessage } from "@/server/modules/telegram/service";
import type { LeadFilter, PublicLeadInput } from "./schema";

const MIN_FORM_SECONDS = 2; // bots submit instantly; humans do not

export const leadInclude = {
  course: { select: { id: true, title: true, slug: true } },
  service: { select: { id: true, title: true, slug: true } },
  branch: { select: { id: true, name: true } },
  assignedTo: { select: { id: true, name: true } },
} satisfies Prisma.LeadInclude;

export type LeadListItem = Prisma.LeadGetPayload<{ include: typeof leadInclude }>;

/** Single public write path for all lead types. */
export async function createPublicLead(input: PublicLeadInput, meta: { ip?: string }) {
  if (input.website) throw badRequest("Spam aniqlandi");
  if (input.startedAt && Date.now() - input.startedAt < MIN_FORM_SECONDS * 1000) throw badRequest("Iltimos, formani toʻldiring");

  const clean = (v?: string | null) => (v ? stripHtml(v) : null);

  let courseId: string | null = null;
  let serviceId: string | null = null;
  if (input.type === "EDUCATION") {
    if (input.courseId) courseId = (await db.course.findUnique({ where: { id: input.courseId }, select: { id: true } }))?.id ?? null;
    else if (input.courseSlug) courseId = (await db.course.findUnique({ where: { slug: input.courseSlug }, select: { id: true } }))?.id ?? null;
  }
  if (input.type === "MEDIA") {
    if (input.serviceId) serviceId = (await db.service.findUnique({ where: { id: input.serviceId }, select: { id: true } }))?.id ?? null;
    else if (input.serviceSlug) serviceId = (await db.service.findUnique({ where: { slug: input.serviceSlug }, select: { id: true } }))?.id ?? null;
  }
  const branchId =
    input.type === "EDUCATION" && input.branchId
      ? ((await db.branch.findUnique({ where: { id: input.branchId }, select: { id: true } }))?.id ?? null)
      : null;

  const lead = await db.lead.create({
    data: {
      type: input.type,
      name: stripHtml(input.name),
      phone: normalizePhone(input.phone),
      email: "email" in input && input.email ? input.email.toLowerCase() : null,
      company: input.type === "MEDIA" ? clean(input.company) : null,
      budget: input.type === "MEDIA" ? clean(input.budget) : null,
      interest: input.type === "GENERAL" ? clean(input.interest) : null,
      message: clean(input.message),
      courseId,
      serviceId,
      branchId,
      source: clean(input.source),
      utm: input.utm ?? undefined,
      ip: meta.ip ?? null,
    },
  });

  // Notification runs out-of-band; the user response never waits on Telegram.
  void notifyNewLead(lead.id);

  return { id: lead.id, type: lead.type, createdAt: lead.createdAt };
}

function buildWhere(filter: Omit<LeadFilter, "page" | "pageSize" | "sort" | "dir">): Prisma.LeadWhereInput {
  return {
    type: filter.type,
    status: filter.status,
    courseId: filter.courseId,
    serviceId: filter.serviceId,
    createdAt: filter.from || filter.to ? { gte: filter.from, lte: filter.to } : undefined,
    OR: filter.q
      ? [
          { name: { contains: filter.q, mode: "insensitive" } },
          { phone: { contains: filter.q.replace(/\s/g, "") } },
          { company: { contains: filter.q, mode: "insensitive" } },
          { email: { contains: filter.q, mode: "insensitive" } },
        ]
      : undefined,
  };
}

export async function listLeads(filter: LeadFilter) {
  const where = buildWhere(filter);
  const [items, total] = await Promise.all([
    db.lead.findMany({
      where,
      include: leadInclude,
      orderBy: { [filter.sort]: filter.dir },
      skip: (filter.page - 1) * filter.pageSize,
      take: filter.pageSize,
    }),
    db.lead.count({ where }),
  ]);
  return { items, total, page: filter.page, pageSize: filter.pageSize };
}

const EXPORT_MAX_ROWS = 50_000;

/** Same filters as the list, no pagination — used by the Excel export. */
export async function findLeadsForExport(filter: Omit<LeadFilter, "page" | "pageSize">) {
  return db.lead.findMany({ where: buildWhere(filter), include: leadInclude, orderBy: { [filter.sort]: filter.dir }, take: EXPORT_MAX_ROWS });
}

export async function getLead(id: string) {
  const lead = await db.lead.findUnique({
    where: { id },
    include: { ...leadInclude, notes: { include: { author: { select: { name: true } } }, orderBy: { createdAt: "desc" } } },
  });
  if (!lead) throw notFound("Lead topilmadi");
  return lead;
}

export async function updateLead(id: string, data: Prisma.LeadUncheckedUpdateInput & { status?: LeadStatus }, actor: { id: string; name: string }) {
  const before = await db.lead.findUnique({ where: { id }, select: { status: true } });
  if (!before) throw notFound("Lead topilmadi");
  const { status, ...rest } = data;
  const lead = await db.lead.update({ where: { id }, data: rest, include: leadInclude });
  await audit({ userId: actor.id, action: "UPDATE", entity: "Lead", entityId: id, meta: { fields: Object.keys(rest) } });
  if (status && status !== before.status) return transitionLeadStatus(id, status, { actorId: actor.id, actorLabel: actor.name });
  return lead;
}

export async function transitionLeadStatus(
  id: string,
  status: LeadStatus,
  opts: { actorId?: string; actorLabel?: string; viaTelegram?: boolean },
) {
  const lead = await db.lead.update({
    where: { id },
    data: {
      status,
      contactedAt: status === "CONTACTED" ? new Date() : undefined,
      closedAt: status === "CONVERTED" || status === "LOST" ? new Date() : null,
    },
    include: leadInclude,
  });
  await audit({
    userId: opts.actorId,
    action: "STATUS_CHANGE",
    entity: "Lead",
    entityId: id,
    meta: { status, via: opts.viaTelegram ? "telegram" : "admin", actor: opts.actorLabel },
  });
  void syncLeadMessage(id, opts.actorLabel);
  return lead;
}

export async function addLeadNote(leadId: string, text: string, authorId: string) {
  await db.lead.findUniqueOrThrow({ where: { id: leadId }, select: { id: true } }).catch(() => {
    throw notFound("Lead topilmadi");
  });
  return db.leadNote.create({ data: { leadId, text: stripHtml(text), authorId }, include: { author: { select: { name: true } } } });
}

export async function deleteLead(id: string, actorId: string) {
  await db.lead.delete({ where: { id } });
  await audit({ userId: actorId, action: "DELETE", entity: "Lead", entityId: id });
}

// ── Dashboard analytics ─────────────────────────────────────────────

export async function leadStats(days = 30) {
  const since = new Date(Date.now() - days * 86_400_000);
  const [total, newCount, byType, byStatus, recent, topCourses, topServices, series] = await Promise.all([
    db.lead.count(),
    db.lead.count({ where: { status: "NEW" } }),
    db.lead.groupBy({ by: ["type"], _count: { _all: true } }),
    db.lead.groupBy({ by: ["status"], _count: { _all: true } }),
    db.lead.count({ where: { createdAt: { gte: since } } }),
    db.lead.groupBy({ by: ["courseId"], where: { courseId: { not: null } }, _count: { _all: true }, orderBy: { _count: { courseId: "desc" } }, take: 5 }),
    db.lead.groupBy({ by: ["serviceId"], where: { serviceId: { not: null } }, _count: { _all: true }, orderBy: { _count: { serviceId: "desc" } }, take: 5 }),
    db.$queryRaw<{ day: Date; type: string; count: bigint }[]>`
      SELECT date_trunc('day', "createdAt") AS day, "type", COUNT(*)::bigint AS count
      FROM "Lead" WHERE "createdAt" >= ${since}
      GROUP BY 1, 2 ORDER BY 1 ASC`,
  ]);

  const courseIds = topCourses.map((c) => c.courseId!).filter(Boolean);
  const serviceIds = topServices.map((s) => s.serviceId!).filter(Boolean);
  const [courses, services] = await Promise.all([
    db.course.findMany({ where: { id: { in: courseIds } }, select: { id: true, title: true } }),
    db.service.findMany({ where: { id: { in: serviceIds } }, select: { id: true, title: true } }),
  ]);

  const converted = byStatus.find((s) => s.status === "CONVERTED")?._count._all ?? 0;
  const closed = converted + (byStatus.find((s) => s.status === "LOST")?._count._all ?? 0);

  return {
    total,
    newCount,
    recent,
    conversionRate: closed ? Math.round((converted / closed) * 100) : 0,
    byType: Object.fromEntries(byType.map((t) => [t.type, t._count._all])) as Record<string, number>,
    byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])) as Record<string, number>,
    topCourses: topCourses.map((c) => ({ id: c.courseId!, title: courses.find((x) => x.id === c.courseId)?.title ?? "—", count: c._count._all })),
    topServices: topServices.map((s) => ({ id: s.serviceId!, title: services.find((x) => x.id === s.serviceId)?.title ?? "—", count: s._count._all })),
    series: series.map((r) => ({ day: new Date(r.day).toISOString().slice(0, 10), type: r.type, count: Number(r.count) })),
  };
}
