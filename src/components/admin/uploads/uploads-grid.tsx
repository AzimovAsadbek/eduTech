"use client";

import { Check, Copy, ImageOff, Trash2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type DragEvent } from "react";
import type { Role } from "@prisma/client";
import { adminApi, errorMessage } from "@/lib/admin-api";
import { cn } from "@/lib/utils";
import { DateText } from "@/components/admin/ui/date-text";
import { roleAtLeast } from "@/components/admin/labels";
import { Button } from "@/components/admin/ui/button";
import { Card } from "@/components/admin/ui/card";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Pagination } from "@/components/admin/ui/pagination";
import { useToast } from "@/components/admin/ui/toast";
import { formatBytes, type UploadItem } from "./types";
import { useUploader } from "./use-uploader";

export function UploadsGrid({ items, total, page, pageSize, role }: { items: UploadItem[]; total: number; page: number; pageSize: number; role: Role }) {
  const router = useRouter();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, progress, error } = useUploader();
  const [over, setOver] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<UploadItem | null>(null);
  const canDelete = roleAtLeast(role, "ADMIN");

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    let ok = 0;
    for (const file of Array.from(files)) {
      const item = await upload(file);
      if (item) ok++;
    }
    if (ok) {
      toast.success(`${ok} ta rasm yuklandi`);
      router.refresh();
    }
  };

  const copy = async (u: UploadItem) => {
    try {
      await navigator.clipboard.writeText(u.url);
      setCopied(u.id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Nusxa olib boʻlmadi", u.url);
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    try {
      await adminApi.delete(`/uploads/${toDelete.id}`);
      toast.success("Fayl oʻchirildi");
      setToDelete(null);
      router.refresh();
    } catch (e) {
      toast.error("Oʻchirib boʻlmadi", errorMessage(e));
      setToDelete(null);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <>
      <PageHeader
        eyebrow="Fayllar"
        title="Media kutubxona"
        description={`${total} ta fayl · barcha rasmlar WebP formatiga aylantiriladi`}
        actions={
          <Button icon={<UploadCloud />} onClick={() => inputRef.current?.click()} loading={progress !== null}>
            Rasm yuklash
          </Button>
        }
      />
      <input ref={inputRef} type="file" accept="image/*" multiple className="sr-only" aria-label="Rasm tanlash" onChange={(e) => handleFiles(e.target.files)} />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={cn("mb-4 rounded-(--radius-md) border border-dashed border-(--line-strong) px-4 py-3 text-center text-sm text-muted transition-colors", over && "border-orange bg-orange-soft text-orange-deep")}
      >
        {progress !== null ? (
          <span className="inline-flex items-center gap-2">
            Yuklanmoqda… {Math.round(progress * 100)}%
            <span className="h-1 w-32 overflow-hidden rounded-full bg-paper-3">
              <span className="block h-full bg-orange" style={{ width: `${Math.round(progress * 100)}%` }} />
            </span>
          </span>
        ) : (
          "Rasmlarni shu yerga tashlang"
        )}
        {error ? (
          <p role="alert" className="mt-1 text-danger">
            {error}
          </p>
        ) : null}
      </div>

      <Card>
        {items.length === 0 ? (
          <EmptyState icon={<ImageOff />} title="Kutubxona boʻsh" description="Birinchi rasmni yuklang — u kurs, xizmat va galereyada ishlatiladi." />
        ) : (
          <ul className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((u) => (
              <li key={u.id} className="group overflow-hidden rounded-[10px] border border-(--line) bg-paper">
                <div className="relative aspect-[4/3] bg-paper-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u.url} alt={u.alt ?? ""} className="size-full object-cover" loading="lazy" />
                </div>
                <div className="p-2.5">
                  <p className="t-meta truncate text-ink" title={u.key}>
                    {u.key.split("/").pop()}
                  </p>
                  <p className="t-meta mt-0.5 text-[10px] text-muted">
                    {u.width}×{u.height} · {formatBytes(u.size)} · <DateText value={u.createdAt} opts={{ hour: undefined, minute: undefined }} />
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    <Button variant="outline" size="xs" icon={copied === u.id ? <Check /> : <Copy />} onClick={() => copy(u)} className="flex-1">
                      {copied === u.id ? "Nusxalandi" : "URL nusxa"}
                    </Button>
                    {canDelete ? (
                      <Button variant="ghost" size="xs" iconOnly icon={<Trash2 />} className="text-muted hover:text-danger" onClick={() => setToDelete(u)}>
                        Oʻchirish
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Pagination page={page} pageSize={pageSize} total={total} />
      </Card>

      <ConfirmDialog
        open={toDelete !== null}
        title="Faylni oʻchirasizmi?"
        description="Fayl serverdan oʻchiriladi. Uni ishlatayotgan sahifalarda rasm koʻrinmay qoladi."
        confirmLabel="Oʻchirish"
        tone="danger"
        onConfirm={remove}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
