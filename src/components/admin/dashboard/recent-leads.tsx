import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { LeadListItem } from "@/server/modules/leads/service";
import { formatAdminDate } from "@/components/admin/format";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { LEAD_TYPE_LABELS } from "@/components/admin/labels";
import { LeadStatusBadge } from "@/components/admin/ui/status-badge";

export function RecentLeads({ leads }: { leads: LeadListItem[] }) {
  if (!leads.length) return <EmptyState compact title="Hali murojaatlar yoʻq" description="Saytdagi formalar orqali kelgan lidlar shu yerda koʻrinadi." />;
  return (
    <ul className="divide-y divide-(--line)">
      {leads.map((l) => (
        <li key={l.id}>
          <Link href={`/admin/leads/${l.id}`} className="group flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-paper-2">
            <div className="min-w-0 flex-1">
              <p className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-ink">
                <span className="truncate">{l.name}</span>
                <ArrowUpRight size={14} className="shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
              </p>
              <p className="t-meta mt-0.5 truncate text-muted">
                <time dateTime={l.createdAt.toISOString()}>{formatAdminDate(l.createdAt, { year: undefined })}</time>
                {" · "}
                {LEAD_TYPE_LABELS[l.type]}
                {l.course ? ` · ${l.course.title}` : l.service ? ` · ${l.service.title}` : l.interest ? ` · ${l.interest}` : ""}
              </p>
            </div>
            <LeadStatusBadge status={l.status} className="shrink-0" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
