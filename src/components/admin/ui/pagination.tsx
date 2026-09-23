"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "./button";

export function Pagination({ page, pageSize, total, param = "page" }: { page: number; pageSize: number; total: number; param?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  const go = (p: number) => {
    const next = new URLSearchParams(sp.toString());
    if (p <= 1) next.delete(param);
    else next.set(param, String(p));
    router.push(`${pathname}${next.toString() ? `?${next}` : ""}`);
  };
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <nav aria-label="Sahifalar" className="flex items-center justify-between gap-3 border-t border-(--line) px-4 py-3">
      <p className="t-meta text-muted">
        {from}–{to} / {total}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="xs" iconOnly icon={<ChevronLeft />} disabled={page <= 1} onClick={() => go(page - 1)}>
          Oldingi
        </Button>
        <span className="t-meta px-2 text-ink">
          {page} / {pages}
        </span>
        <Button variant="outline" size="xs" iconOnly icon={<ChevronRight />} disabled={page >= pages} onClick={() => go(page + 1)}>
          Keyingi
        </Button>
      </div>
    </nav>
  );
}
