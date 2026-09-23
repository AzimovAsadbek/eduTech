import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAuth, listUsers } from "@/server/modules/auth/service";
import { getLead } from "@/server/modules/leads/service";
import { HttpError } from "@/server/http/errors";
import { roleAtLeast } from "@/components/admin/labels";
import { Forbidden } from "@/components/admin/ui/forbidden";
import { PageHeader } from "@/components/admin/ui/page-header";
import { LeadDetailView, type LeadDetail } from "@/components/admin/leads/lead-detail";

export const metadata: Metadata = { title: "Lid" };

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [auth, { id }] = await Promise.all([getAuth(), params]);
  if (!auth) redirect("/admin/login");
  if (!roleAtLeast(auth.user.role, "ADMIN")) return <Forbidden description="Lidlar boʻlimi faqat adminlar uchun." />;

  let lead: LeadDetail;
  try {
    lead = await getLead(id);
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) notFound();
    throw e;
  }
  const users = roleAtLeast(auth.user.role, "SUPER_ADMIN") ? (await listUsers()).filter((u) => u.isActive).map((u) => ({ id: u.id, name: u.name })) : null;

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Lidlar", href: "/admin/leads" }, { label: `#${lead.id.slice(-8)}` }]}
        title={lead.name}
        description={
          <span className="font-mono text-xs">
            {lead.phone}
            {lead.company ? ` · ${lead.company}` : ""}
          </span>
        }
      />
      <LeadDetailView lead={lead} role={auth.user.role} assignees={users} />
    </>
  );
}
