import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAuth } from "@/server/modules/auth/service";
import { listResource } from "@/server/modules/content/admin";
import { isResourceKey } from "@/server/modules/content/registry";
import { listQuerySchema } from "@/server/modules/content/schema";
import { RESOURCES } from "@/components/admin/resources/config";
import { ResourceList } from "@/components/admin/resources/resource-list";

type Params = Promise<{ resource: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { resource } = await params;
  return { title: isResourceKey(resource) ? RESOURCES[resource].label : "Kontent" };
}

export default async function ResourceListPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const [auth, { resource }, sp] = await Promise.all([getAuth(), params, searchParams]);
  if (!auth) redirect("/admin/login");
  if (!isResourceKey(resource)) notFound();

  const raw = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]).filter(([, v]) => v !== undefined && v !== ""));
  const parsed = listQuerySchema.safeParse({ pageSize: 25, ...raw });
  const query = parsed.success ? parsed.data : listQuerySchema.parse({ pageSize: 25 });
  const { items, total, page, pageSize } = await listResource(resource, query);

  return <ResourceList resource={resource} items={items as (Record<string, unknown> & { id: string })[]} total={total} page={page} pageSize={pageSize} role={auth.user.role} />;
}
