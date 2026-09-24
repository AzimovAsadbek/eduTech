"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "./button";
import { useFocusTrap } from "./use-focus-trap";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

/** Accessible confirmation built on the native <dialog> (focus trap, Esc, backdrop). */
export function ConfirmDialog({ open, title, description, confirmLabel = "Tasdiqlash", cancelLabel = "Bekor qilish", tone = "default", onConfirm, onClose }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  useFocusTrap(ref, open);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current && !busy) onClose();
      }}
      aria-labelledby="confirm-title"
      className="m-auto w-[min(420px,calc(100vw-2rem))] rounded-(--radius-lg) border border-(--line) bg-paper p-0 text-ink shadow-lg backdrop:bg-ink/40 backdrop:backdrop-blur-[2px]"
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          <span className={tone === "danger" ? "grid size-10 shrink-0 place-items-center rounded-full bg-danger/10 text-danger" : "grid size-10 shrink-0 place-items-center rounded-full bg-orange-soft text-orange"}>
            <AlertTriangle size={20} aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 id="confirm-title" className="t-h4">
              {title}
            </h2>
            {description ? <div className="mt-1.5 text-sm text-muted">{description}</div> : null}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} size="sm" onClick={confirm} loading={busy} autoFocus>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
