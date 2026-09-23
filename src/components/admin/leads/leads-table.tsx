import Link from "next/link";
import type { LeadListItem } from "@/server/modules/leads/service";
import { formatAdminDate } from "@/components/admin/format";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { LeadTypeBadge } from "@/components/admin/ui/status-badge";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/admin/ui/table";
import { LeadStatusSelect } from "./status-select";

export function leadSubject(l: Pick<LeadListItem, "course" | "service" | "interest" | "company">) {
  if (l.course) return l.course.title;
  if (l.service) return l.service.title;
  if (l.interest) return l.interest;
  if (l.company) return l.company;
  return "—";
}

export function LeadsTable({ items }: { items: LeadListItem[] }) {
  if (!items.length) return <EmptyState title="Lidlar topilmadi" description="Filtrlarni oʻzgartiring yoki yangi murojaatlarni kuting." />;
  return (
    <Table className="min-w-[900px]">
      <THead>
        <tr>
          <Th className="w-36">Sana</Th>
          <Th className="w-24">Turi</Th>
          <Th>Ism</Th>
          <Th className="w-40">Telefon</Th>
          <Th>Kurs / Xizmat</Th>
          <Th className="w-40">Holat</Th>
          <Th className="w-36">Masʼul</Th>
        </tr>
      </THead>
      <TBody>
        {items.map((l) => (
          <Tr key={l.id}>
            <Td>
              <time dateTime={l.createdAt.toISOString()} className="t-meta text-muted">
                {formatAdminDate(l.createdAt)}
              </time>
            </Td>
            <Td>
              <LeadTypeBadge type={l.type} />
            </Td>
            <Td>
              <Link href={`/admin/leads/${l.id}`} className="font-semibold whitespace-nowrap text-ink underline-offset-4 hover:text-orange hover:underline">
                {l.name}
              </Link>
              {l.company ? <span className="block truncate text-xs text-muted">{l.company}</span> : null}
            </Td>
            <Td>
              <a href={`tel:${l.phone}`} className="t-meta text-ink hover:text-orange">
                {l.phone}
              </a>
            </Td>
            <Td>
              <span className="block max-w-[260px] truncate text-muted">{leadSubject(l)}</span>
            </Td>
            <Td>
              <LeadStatusSelect id={l.id} status={l.status} />
            </Td>
            <Td>
              <span className={l.assignedTo ? "text-ink" : "text-muted-2"}>{l.assignedTo?.name ?? "—"}</span>
            </Td>
          </Tr>
        ))}
      </TBody>
    </Table>
  );
}
