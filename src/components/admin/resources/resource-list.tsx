"use client";

import { ArrowDown, ArrowUp, Copy, ExternalLink, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import type { ContentStatus, Role } from "@prisma/client";
import { adminApi, errorMessage } from "@/lib/admin-api";
import { cn } from "@/lib/utils";
import { DateText } from "@/components/admin/ui/date-text";
import { CONTENT_STATUS_LABELS, roleAtLeast } from "@/components/admin/labels";
import { Button } from "@/components/admin/ui/button";
import { Card } from "@/components/admin/ui/card";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { controlBase } from "@/components/admin/ui/field";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Pagination } from "@/components/admin/ui/pagination";
import { ContentStatusBadge } from "@/components/admin/ui/status-badge";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/admin/ui/table";
import { useToast } from "@/components/admin/ui/toast";
import { getPath, RESOURCES, type ColumnDef, type ResourceKey } from "./config";

type Row = Record<string, unknown> & { id: string };

const STATUS_CHIPS: { value: ContentStatus | ""; label: string }[] = [
  { value: "", label: "Barchasi" },
  { value: "DRAFT", label: CONTENT_STATUS_LABELS.DRAFT },
  { value: "PUBLISHED", label: CONTENT_STATUS_LABELS.PUBLISHED },
  { value: "ARCHIVED", label: CONTENT_STATUS_LABELS.ARCHIVED },
];

function Cell({ col, row }: { col: ColumnDef; row: Row }) {
  const v = getPath(row, col.key);
  switch (col.kind) {
    case "image":
      return typeof v === "string" && v ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={v} alt="" className="size-9 rounded-[8px] border border-(--line) bg-paper-3 object-cover" loading="lazy" />
      ) : (
        <span aria-hidden className="block size-9 rounded-[8px] bg-paper-3" />
      );
    case "status":
      return typeof v === "string" ? <ContentStatusBadge status={v as ContentStatus} /> : null;
    case "date":
      return v instanceof Date || typeof v === "string" ? <DateText value={v} className="t-meta text-muted" /> : null;
    case "boolean":
      return <span className={cn("inline-block size-2 rounded-full", v ? "bg-success" : "bg-muted-2")} aria-label={v ? "Ha" : "Yoʻq"} role="img" />;
    case "number":
      return <span className="t-meta text-ink">{typeof v === "number" ? v : "—"}</span>;
    case "mono":
      return <span className="t-meta text-muted">{v === null || v === undefined || v === "" ? "—" : String(v)}</span>;
    case "relation":
      return <span className="text-muted">{typeof v === "string" && v ? v : "—"}</span>;
    default: {
      const sub = col.sub ? getPath(row, col.sub) : undefined;
      return (
        <span className="block min-w-0">
          <span className="block truncate font-semibold text-ink">{v === null || v === undefined || v === "" ? "—" : String(v)}</span>
          {typeof sub === "string" && sub ? <span className="block truncate text-xs text-muted">{sub}</span> : null}
        </span>
      );
    }
  }
}

export function ResourceList({ resource, items, total, page, pageSize, role }: { resource: ResourceKey; items: Row[]; total: number; page: number; pageSize: number; role: Role }) {
  const ui = RESOURCES[resource];
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const toast = useToast();
  const [pending, start] = useTransition();
  const urlQ = sp.get("q") ?? "";
  const [q, setQ] = useState(urlQ);
  const [prevUrlQ, setPrevUrlQ] = useState(urlQ);
  if (urlQ !== prevUrlQ) {
    setPrevUrlQ(urlQ);
    setQ(urlQ);
  }
  const [rows, setRows] = useState<Row[]>(items);
  const [prevItems, setPrevItems] = useState(items);
  if (items !== prevItems) {
    // Server re-render (router.refresh) wins over the optimistic local order.
    setPrevItems(items);
    setRows(items);
  }
  const [reordering, setReordering] = useState(false);
  const [toDelete, setToDelete] = useState<Row | null>(null);

  const status = sp.get("status") ?? "";
  const canDelete = roleAtLeast(role, "ADMIN");

  const setParam = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (!v) next.delete(k);
      else next.set(k, v);
    }
    next.delete("page");
    start(() => router.push(`${pathname}${next.toString() ? `?${next}` : ""}`));
  };

  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
    setReordering(true);
    try {
      await adminApi.post(`/content/${resource}/reorder`, { ids: next.map((r) => r.id) });
      router.refresh();
    } catch (e) {
      setRows(rows);
      toast.error("Tartibni saqlab boʻlmadi", errorMessage(e));
    } finally {
      setReordering(false);
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    const victim = toDelete;
    try {
      await adminApi.delete(`/content/${resource}/${victim.id}`);
      setRows((r) => r.filter((x) => x.id !== victim.id));
      setToDelete(null);
      toast.success("Oʻchirildi", String(victim[ui.titleField] ?? ""));
      router.refresh();
    } catch (e) {
      toast.error("Oʻchirib boʻlmadi", errorMessage(e));
      setToDelete(null);
    }
  };

  const hasFilters = Boolean(sp.get("q") || status);
  const sortable = !hasFilters;

  return (
    <>
      <PageHeader
        eyebrow="Kontent"
        title={ui.label}
        description={`${total} ta ${ui.singular.toLowerCase()}`}
        actions={
          <Button href={`/admin/${resource}/new`} icon={<Plus />}>
            {ui.singular} qoʻshish
          </Button>
        }
      />
      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-(--line) px-4 py-3" aria-busy={pending || reordering}>
          <form
            role="search"
            className="relative min-w-[200px] flex-1 sm:max-w-xs"
            onSubmit={(e) => {
              e.preventDefault();
              setParam({ q: q.trim() });
            }}
          >
            <label htmlFor={`${resource}-q`} className="sr-only">
              Qidirish
            </label>
            <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden />
            <input id={`${resource}-q`} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Qidirish…" className={cn(controlBase, "h-9 pl-9 text-[13px]")} />
          </form>
          {ui.hasStatus ? (
            <div role="radiogroup" aria-label="Holat boʻyicha filtr" className="flex flex-wrap gap-1">
              {STATUS_CHIPS.map((c) => {
                const active = status === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setParam({ status: c.value })}
                    className={cn("h-8 rounded-full border px-3 text-xs font-semibold transition-colors", active ? "border-ink bg-ink text-white" : "border-(--line) text-muted hover:border-ink hover:text-ink")}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          ) : null}
          {hasFilters ? (
            <Button variant="ghost" size="sm" icon={<X />} onClick={() => start(() => router.push(pathname))}>
              Tozalash
            </Button>
          ) : null}
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title={hasFilters ? "Hech narsa topilmadi" : `Hali ${ui.singular.toLowerCase()} yoʻq`}
            description={hasFilters ? "Qidiruv yoki filtrni oʻzgartiring." : "Birinchi elementni yarating."}
            action={
              hasFilters ? undefined : (
                <Button href={`/admin/${resource}/new`} icon={<Plus />} size="sm">
                  {ui.singular} qoʻshish
                </Button>
              )
            }
          />
        ) : (
          <Table>
            <THead>
              <tr>
                {sortable ? <Th className="w-16">Tartib</Th> : null}
                {ui.columns.map((c) => (
                  <Th key={c.key} className={cn(c.width, c.hideBelow === "md" && "hidden md:table-cell", c.hideBelow === "lg" && "hidden lg:table-cell")}>
                    {c.label}
                  </Th>
                ))}
                <Th className="w-36" align="right">
                  <span className="sr-only">Amallar</span>
                </Th>
              </tr>
            </THead>
            <TBody>
              {rows.map((row, i) => {
                const preview = ui.preview?.(row);
                return (
                  <Tr key={row.id} className="group">
                    {sortable ? (
                      <Td>
                        <span className="flex items-center">
                          <Button variant="ghost" size="xs" iconOnly icon={<ArrowUp />} disabled={i === 0 || reordering} onClick={() => move(i, -1)}>
                            Yuqoriga
                          </Button>
                          <Button variant="ghost" size="xs" iconOnly icon={<ArrowDown />} disabled={i === rows.length - 1 || reordering} onClick={() => move(i, 1)}>
                            Pastga
                          </Button>
                        </span>
                      </Td>
                    ) : null}
                    {ui.columns.map((c, ci) => (
                      <Td key={c.key} className={cn(c.hideBelow === "md" && "hidden md:table-cell", c.hideBelow === "lg" && "hidden lg:table-cell", ci === 0 && c.kind === "image" && "pr-0")}>
                        {ci === (ui.columns[0]?.kind === "image" ? 1 : 0) && !c.kind ? (
                          <Link href={`/admin/${resource}/${row.id}`} className="block min-w-0 hover:text-orange">
                            <Cell col={c} row={row} />
                          </Link>
                        ) : (
                          <Cell col={c} row={row} />
                        )}
                      </Td>
                    ))}
                    <Td align="right">
                      <span className="inline-flex items-center justify-end gap-0.5">
                        {preview ? (
                          <Button href={preview} variant="ghost" size="xs" iconOnly icon={<ExternalLink />}>
                            Oldindan koʻrish
                          </Button>
                        ) : null}
                        <Button href={`/admin/${resource}/new?from=${row.id}`} variant="ghost" size="xs" iconOnly icon={<Copy />}>
                          Nusxa olish
                        </Button>
                        <Button href={`/admin/${resource}/${row.id}`} variant="ghost" size="xs" iconOnly icon={<Pencil />}>
                          Tahrirlash
                        </Button>
                        {canDelete ? (
                          <Button variant="ghost" size="xs" iconOnly icon={<Trash2 />} className="text-muted hover:text-danger" onClick={() => setToDelete(row)}>
                            Oʻchirish
                          </Button>
                        ) : null}
                      </span>
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        )}
        <Pagination page={page} pageSize={pageSize} total={total} />
      </Card>

      <ConfirmDialog
        open={toDelete !== null}
        title={`${ui.singular}ni oʻchirasizmi?`}
        description={toDelete ? `«${String(toDelete[ui.titleField] ?? "")}» butunlay oʻchiriladi.` : undefined}
        confirmLabel="Oʻchirish"
        tone="danger"
        onConfirm={remove}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
