"use client";

import { ImagePlus, Link2, LibraryBig, Trash2, UploadCloud } from "lucide-react";
import { useId, useRef, useState, type DragEvent } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/admin/ui/button";
import { controlBase, FieldWrap } from "@/components/admin/ui/field";
import { useToast } from "@/components/admin/ui/toast";
import { MediaLibraryDialog } from "./media-library-dialog";
import { useUploader } from "./use-uploader";

/**
 * Public pages render images through `next/image`, which only knows this site's origin —
 * so a pasted URL is accepted only when it resolves to a site-local path (e.g. a copied library URL).
 */
/** Site-local paths stay as paths; same-origin URLs become paths; external https URLs are kept as-is. */
function toImageSource(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  if (/^\/(?!\/)/.test(v)) return v;
  try {
    const u = new URL(v, window.location.origin);
    if (u.origin === window.location.origin) return `${u.pathname}${u.search}`;
    if (u.protocol === "https:") return u.toString();
  } catch {
    /* not a URL */
  }
  return null;
}

export function ImageField({ label, value, onChange, error, hint, required }: { label: string; value: string; onChange: (url: string) => void; error?: string; hint?: string; required?: boolean }) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [lib, setLib] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const { upload, progress, error: uploadError, clearError } = useUploader();
  const toast = useToast();

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const item = await upload(file, label);
    if (item) {
      onChange(item.url);
      toast.success("Rasm yuklandi");
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const uploading = progress !== null;

  const applyUrl = (raw: string): boolean => {
    if (!raw.trim()) return false;
    const path = toImageSource(raw);
    if (!path) {
      toast.error("Rasm manzili notoʻgʻri", "https:// bilan boshlanuvchi URL yoki /uploads/… yoʻlini kiriting.");
      return false;
    }
    onChange(path);
    return true;
  };

  return (
    <FieldWrap id={id} label={label} hint={hint} error={error ?? uploadError ?? undefined} required={required} as="div">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={cn(
          "relative overflow-hidden rounded-[10px] border border-dashed border-(--line-strong) bg-paper-2 transition-colors",
          over && "border-orange bg-orange-soft",
          error && "border-danger",
        )}
      >
        {value ? (
          <div className="flex items-stretch gap-3 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="size-24 shrink-0 rounded-[8px] border border-(--line) bg-paper-3 object-cover" />
            <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
              <p className="t-meta truncate text-muted" title={value}>
                {value}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Button variant="outline" size="xs" icon={<UploadCloud />} onClick={() => inputRef.current?.click()} loading={uploading}>
                  Almashtirish
                </Button>
                <Button variant="outline" size="xs" icon={<LibraryBig />} onClick={() => setLib(true)}>
                  Kutubxona
                </Button>
                <Button variant="ghost" size="xs" icon={<Trash2 />} className="text-muted hover:text-danger" onClick={() => onChange("")}>
                  Olib tashlash
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-4 py-6 text-center">
            <span className="grid size-10 place-items-center rounded-full bg-paper text-muted shadow-sm" aria-hidden>
              <ImagePlus size={18} />
            </span>
            <p className="mt-3 text-sm text-ink">
              Rasmni shu yerga tashlang yoki{" "}
              <button type="button" onClick={() => inputRef.current?.click()} className="font-semibold text-orange underline-offset-4 hover:underline">
                faylni tanlang
              </button>
            </p>
            <p className="t-meta mt-1 text-muted">JPEG, PNG, WebP, GIF, AVIF · 10 MB gacha · WebP ga aylantiriladi</p>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              <Button variant="outline" size="xs" icon={<LibraryBig />} onClick={() => setLib(true)}>
                Kutubxonadan tanlash
              </Button>
              <Button variant="outline" size="xs" icon={<Link2 />} onClick={() => setUrlMode((v) => !v)} aria-expanded={urlMode}>
                URL kiritish
              </Button>
            </div>
          </div>
        )}
        {uploading ? (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-paper-3" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((progress ?? 0) * 100)} aria-label="Yuklanmoqda">
            <div className="h-full bg-orange transition-[width] duration-150" style={{ width: `${Math.round((progress ?? 0) * 100)}%` }} />
          </div>
        ) : null}
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="image/*"
          aria-label={`${label} — fayl tanlash`}
          className="sr-only"
          onChange={(e) => {
            clearError();
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      {urlMode && !value ? (
        <input
          aria-label={`${label} URL`}
          placeholder="/uploads/… (sayt ichidagi yoʻl)"
          className={cn(controlBase, "mt-2 h-9 font-mono text-[13px]")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const v = (e.target as HTMLInputElement).value;
              if (!v.trim() || applyUrl(v)) setUrlMode(false);
            }
          }}
          onBlur={(e) => {
            applyUrl(e.target.value);
          }}
          autoFocus
        />
      ) : null}
      <MediaLibraryDialog
        open={lib}
        onClose={() => setLib(false)}
        onSelect={(item) => {
          onChange(item.url);
          setLib(false);
        }}
      />
    </FieldWrap>
  );
}
