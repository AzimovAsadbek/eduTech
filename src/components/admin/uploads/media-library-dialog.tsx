"use client";

import { ChevronLeft, ChevronRight, ImageOff, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { adminApi, errorMessage, type PageMeta } from "@/lib/admin-api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/admin/ui/button";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { Skeleton } from "@/components/admin/ui/skeleton";
import { useFocusTrap } from "@/components/admin/ui/use-focus-trap";
import { formatBytes, type UploadItem } from "./types";

export function MediaLibraryDialog({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (item: UploadItem) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{ page: number; items: UploadItem[]; meta: PageMeta | null } | null>(null);
  const [failure, setFailure] = useState<{ page: number; message: string } | null>(null);
  const items = result && result.page === page ? result.items : null;
  const meta = result && result.page === page ? result.meta : null;
  const error = failure && failure.page === page ? failure.message : null;
  useFocusTrap(ref, open);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    adminApi
      .get<UploadItem[]>("/uploads", { page, pageSize: 24 })
      .then((r) => {
        if (alive) setResult({ page, items: r.data, meta: r.meta ?? null });
      })
      .catch((e) => alive && setFailure({ page, message: errorMessage(e) }));
    return () => {
      alive = false;
    };
  }, [open, page]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="media-lib-title"
      className="m-auto w-[min(920px,calc(100vw-2rem))] rounded-(--radius-lg) border border-(--line) bg-paper p-0 text-ink shadow-lg backdrop:bg-ink/40 backdrop:backdrop-blur-[2px]"
    >
      <div className="flex items-center justify-between border-b border-(--line) px-5 py-3">
        <div>
          <h2 id="media-lib-title" className="t-h4">
            Media kutubxona
          </h2>
          <p className="t-meta text-muted">{meta ? `${meta.total} ta fayl` : ""}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Yopish" className="grid size-9 place-items-center rounded-md text-muted hover:bg-ink/5 hover:text-ink">
          <X size={18} />
        </button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto p-5">
        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
        {items === null && !error ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-[10px]" />
            ))}
          </div>
        ) : null}
        {items?.length === 0 ? <EmptyState compact icon={<ImageOff />} title="Kutubxona boʻsh" description="Avval rasm yuklang." /> : null}
        {items?.length ? (
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {items.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => onSelect(u)}
                  className={cn("group block w-full overflow-hidden rounded-[10px] border border-(--line) bg-paper-3 text-left transition-[border-color,box-shadow] hover:border-orange hover:ring-3 hover:ring-orange/15 focus-visible:border-orange")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u.url} alt={u.alt ?? ""} className="aspect-square w-full object-cover" loading="lazy" />
                  <span className="t-meta block truncate px-2 py-1.5 text-[10px] text-muted">
                    {u.width}×{u.height} · {formatBytes(u.size)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {meta && meta.pages > 1 ? (
        <div className="flex items-center justify-between border-t border-(--line) px-5 py-3">
          <span className="t-meta text-muted">
            {meta.page} / {meta.pages}
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="xs" iconOnly icon={<ChevronLeft />} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Oldingi
            </Button>
            <Button variant="outline" size="xs" iconOnly icon={<ChevronRight />} disabled={page >= meta.pages} onClick={() => setPage((p) => p + 1)}>
              Keyingi
            </Button>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
