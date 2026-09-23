"use client";

import { AlertOctagon, RotateCcw } from "lucide-react";
import { Button } from "./button";

export function ErrorState({ title = "Nimadir xato ketdi", description, onRetry, digest }: { title?: string; description?: string; onRetry?: () => void; digest?: string }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center rounded-(--radius-md) border border-danger/20 bg-danger/5 px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-danger/10 text-danger" aria-hidden>
        <AlertOctagon size={22} />
      </span>
      <p className="mt-4 font-display text-lg font-semibold tracking-[-0.01em] text-ink">{title}</p>
      {description ? <p className="mt-1 max-w-md text-sm text-muted">{description}</p> : null}
      {digest ? <p className="t-meta mt-2 text-muted-2">Kod: {digest}</p> : null}
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-5" icon={<RotateCcw />} onClick={onRetry}>
          Qayta urinish
        </Button>
      ) : null}
    </div>
  );
}
