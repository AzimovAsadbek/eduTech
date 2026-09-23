import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/admin/ui/card";
import { NAV } from "@/components/admin/shell/nav";

export interface ContentCount {
  href: string;
  label: string;
  total: number;
  published?: number;
}

export function EditorHome({ counts }: { counts: ContentCount[] }) {
  const byHref = new Map(counts.map((c) => [c.href, c]));
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {NAV.flatMap((s) => s.items)
        .filter((i) => byHref.has(i.href))
        .map((i) => {
          const c = byHref.get(i.href)!;
          const Icon = i.icon;
          return (
            <Card key={i.href} className="group">
              <Link href={i.href} className="flex items-center gap-4 p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-[10px] bg-orange-soft text-orange">
                  <Icon size={20} strokeWidth={1.75} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-semibold tracking-[-0.01em] text-ink">{c.label}</p>
                  <p className="t-meta mt-0.5 text-muted">
                    {c.total} ta{typeof c.published === "number" ? ` · ${c.published} nashr etilgan` : ""}
                  </p>
                </div>
                <ArrowRight size={16} className="text-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </Card>
          );
        })}
    </div>
  );
}
