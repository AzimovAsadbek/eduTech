import Link from "next/link";
import type { LeadListItem } from "@/server/modules/leads/service";
import { formatAdminDate } from "@/components/admin/format";
import { LEAD_TYPE_LABELS } from "@/components/admin/labels";
import { ChannelBadge, channelDetail } from "@/components/admin/analytics/channel-badge";
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

/** Columns hidden on phones; their content is folded into the name cell there. */
const wide = "hidden md:table-cell";

export function LeadsTable({ items }: { items: LeadListItem[] }) {
  if (!items.length) return <EmptyState title="Lidlar topilmadi" description="Filtrlarni oʻzgartiring yoki yangi murojaatlarni kuting." />;
  return (
    <Table className="min-w-0 md:min-w-[1040px]">
      <THead>
        <tr>
          <Th className={`${wide} w-36`}>Sana</Th>
          <Th className={`${wide} w-24`}>Turi</Th>
          <Th>Ism</Th>
          <Th className={`${wide} w-40`}>Telefon</Th>
          <Th className={`${wide} w-36`}>Kanal</Th>
          <Th className={`${wide} whitespace-nowrap`}>Kurs / Xizmat</Th>
          <Th className="w-40">Holat</Th>
          <Th className={`${wide} w-36`}>Masʼul</Th>
        </tr>
      </THead>
      <TBody>
        {items.map((l) => {
          const detail = channelDetail(l.utmMedium, l.utmCampaign);
          return (
            <Tr key={l.id}>
              <Td className={wide}>
                <time dateTime={l.createdAt.toISOString()} className="t-meta text-muted">
                  {formatAdminDate(l.createdAt)}
                </time>
              </Td>
              <Td className={wide}>
                <LeadTypeBadge type={l.type} />
              </Td>
              <Td className="max-md:py-3">
                <Link href={`/admin/leads/${l.id}`} className="font-semibold text-ink underline-offset-4 hover:text-orange hover:underline md:whitespace-nowrap">
                  {l.name}
                </Link>
                {l.company ? <span className="block truncate text-xs text-muted">{l.company}</span> : null}
                <div className="md:hidden">
                  <p className="t-meta mt-0.5 text-muted">
                    <time dateTime={l.createdAt.toISOString()}>{formatAdminDate(l.createdAt, { year: undefined })}</time>
                    {` · ${LEAD_TYPE_LABELS[l.type]}`}
                    {leadSubject(l) !== "—" ? ` · ${leadSubject(l)}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <ChannelBadge channel={l.channel} detail={detail} />
                    <a href={`tel:${l.phone}`} className="t-meta text-ink hover:text-orange">
                      {l.phone}
                    </a>
                  </div>
                </div>
              </Td>
              <Td className={wide}>
                <a href={`tel:${l.phone}`} className="t-meta text-ink hover:text-orange">
                  {l.phone}
                </a>
              </Td>
              <Td className={wide}>
                <ChannelBadge channel={l.channel} detail={detail} />
              </Td>
              <Td className={wide}>
                <span className="block max-w-[260px] truncate text-muted">{leadSubject(l)}</span>
              </Td>
              <Td className="max-md:align-top max-md:py-3">
                <LeadStatusSelect id={l.id} status={l.status} />
              </Td>
              <Td className={wide}>
                <span className={l.assignedTo ? "text-ink" : "text-muted-2"}>{l.assignedTo?.name ?? "—"}</span>
              </Td>
            </Tr>
          );
        })}
      </TBody>
    </Table>
  );
}
