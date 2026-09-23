import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuth } from "@/server/modules/auth/service";
import { listLeads } from "@/server/modules/leads/service";
import { roleAtLeast } from "@/components/admin/labels";
import { Card } from "@/components/admin/ui/card";
import { Forbidden } from "@/components/admin/ui/forbidden";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Pagination } from "@/components/admin/ui/pagination";
import { leadFilterFromSearch, type SearchParamsLike } from "@/components/admin/leads/filters";
import { LeadsTable } from "@/components/admin/leads/leads-table";
import { LeadsToolbar } from "@/components/admin/leads/leads-toolbar";

export const metadata: Metadata = { title: "Lidlar" };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<SearchParamsLike> }) {
  const [auth, sp] = await Promise.all([getAuth(), searchParams]);
  if (!auth) redirect("/admin/login");
  if (!roleAtLeast(auth.user.role, "ADMIN")) return <Forbidden description="Lidlar boʻlimi faqat adminlar uchun." />;

  const filter = leadFilterFromSearch(sp);
  const { items, total, page, pageSize } = await listLeads(filter);

  return (
    <>
      <PageHeader eyebrow="CRM" title="Lidlar" description="Saytdan kelgan murojaatlar. Holatni jadvalning oʻzida oʻzgartiring." />
      <Card>
        <LeadsToolbar total={total} />
        <LeadsTable items={items} />
        <Pagination page={page} pageSize={pageSize} total={total} />
      </Card>
    </>
  );
}
