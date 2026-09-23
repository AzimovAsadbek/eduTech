import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuth } from "@/server/modules/auth/service";
import { listUploads } from "@/server/modules/uploads/service";
import { UploadsGrid } from "@/components/admin/uploads/uploads-grid";

export const metadata: Metadata = { title: "Media kutubxona" };

export default async function UploadsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const [auth, sp] = await Promise.all([getAuth(), searchParams]);
  if (!auth) redirect("/admin/login");
  const page = Math.max(1, Number(sp.page) || 1);
  const { items, total, pageSize } = await listUploads(page, 30);
  return <UploadsGrid items={items} total={total} page={page} pageSize={pageSize} role={auth.user.role} />;
}
