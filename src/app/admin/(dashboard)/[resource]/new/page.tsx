import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAuth } from "@/server/modules/auth/service";
import { getResource } from "@/server/modules/content/admin";
import { isResourceKey } from "@/server/modules/content/registry";
import { RESOURCES } from "@/components/admin/resources/config";
import { ResourceForm } from "@/components/admin/resources/resource-form";
import { loadRelations } from "@/components/admin/resources/server";
import { PageHeader } from "@/components/admin/ui/page-header";

type Params = Promise<{ resource: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { resource } = await params;
  return { title: isResourceKey(resource) ? `Yangi ${RESOURCES[resource].singular.toLowerCase()}` : "Yangi" };
}

/** Builds a duplicate template: same content, fresh slug, draft status, "(nusxa)" only on the display-title field. */
function asTemplate(src: Record<string, unknown>, titleField: string): Record<string, unknown> {
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = src;
  void _id;
  void _c;
  void _u;
  const t: Record<string, unknown> = { ...rest, status: "DRAFT" };
  if (typeof t.slug === "string") t.slug = `${t.slug}-nusxa`.slice(0, 80);
  if (typeof t[titleField] === "string") t[titleField] = `${t[titleField]} (nusxa)`;
  return t;
}

export default async function ResourceNewPage({ params, searchParams }: { params: Params; searchParams: Promise<{ from?: string }> }) {
  const [auth, { resource }, { from }] = await Promise.all([getAuth(), params, searchParams]);
  if (!auth) redirect("/admin/login");
  if (!isResourceKey(resource)) notFound();
  const ui = RESOURCES[resource];

  const [relations, template] = await Promise.all([
    loadRelations(resource),
    from ? getResource(resource, from).then((r) => asTemplate(r as Record<string, unknown>, ui.titleField)).catch(() => null) : Promise.resolve(null),
  ]);

  return (
    <>
      <PageHeader crumbs={[{ label: ui.label, href: `/admin/${resource}` }, { label: "Yangi" }]} title={template ? `${ui.singular} nusxasi` : `Yangi ${ui.singular.toLowerCase()}`} />
      <ResourceForm key={from ?? "new"} resource={resource} mode="create" item={template} relations={relations} role={auth.user.role} />
    </>
  );
}
