import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAuth } from "@/server/modules/auth/service";
import { getResource } from "@/server/modules/content/admin";
import { isResourceKey } from "@/server/modules/content/registry";
import { HttpError } from "@/server/http/errors";
import { RESOURCES } from "@/components/admin/resources/config";
import { ResourceForm } from "@/components/admin/resources/resource-form";
import { loadRelations } from "@/components/admin/resources/server";
import { PageHeader } from "@/components/admin/ui/page-header";

type Params = Promise<{ resource: string; id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { resource } = await params;
  return { title: isResourceKey(resource) ? `${RESOURCES[resource].singular} · Tahrirlash` : "Tahrirlash" };
}

export default async function ResourceEditPage({ params }: { params: Params }) {
  const [auth, { resource, id }] = await Promise.all([getAuth(), params]);
  if (!auth) redirect("/admin/login");
  if (!isResourceKey(resource)) notFound();
  const ui = RESOURCES[resource];

  let item: Record<string, unknown>;
  try {
    item = (await getResource(resource, id)) as Record<string, unknown>;
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) notFound();
    throw e;
  }
  const relations = await loadRelations(resource);
  const title = String(item[ui.titleField] ?? ui.singular);

  return (
    <>
      <PageHeader crumbs={[{ label: ui.label, href: `/admin/${resource}` }, { label: title }]} title={title} />
      <ResourceForm key={id} resource={resource} mode="edit" item={item} relations={relations} role={auth.user.role} />
    </>
  );
}
