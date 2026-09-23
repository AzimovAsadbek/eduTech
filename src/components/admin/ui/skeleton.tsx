import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-ink/6", className)} />;
}

export function PageSkeleton({ rows = 8, header = true, kpis = 0 }: { rows?: number; header?: boolean; kpis?: number }) {
  return (
    <div aria-busy="true" aria-label="Yuklanmoqda">
      {header ? (
        <div className="mb-6 flex items-end justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-56" />
          </div>
          <Skeleton className="h-10 w-32 rounded-[10px]" />
        </div>
      ) : null}
      {kpis ? (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: kpis }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-(--radius-md)" />
          ))}
        </div>
      ) : null}
      <div className="rounded-(--radius-md) border border-(--line) bg-paper p-4 shadow-sm">
        <div className="mb-4 flex gap-2">
          <Skeleton className="h-9 w-64 rounded-[10px]" />
          <Skeleton className="h-9 w-28 rounded-[10px]" />
        </div>
        <div className="divide-y divide-(--line)">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div aria-busy="true" aria-label="Yuklanmoqda">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-8 w-72" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-(--radius-md) border border-(--line) bg-paper p-5 shadow-sm">
              <Skeleton className="mb-5 h-5 w-32" />
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="space-y-1.5">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-10 w-full rounded-[10px]" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-64 rounded-(--radius-md)" />
      </div>
    </div>
  );
}
