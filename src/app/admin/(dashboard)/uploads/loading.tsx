import { Skeleton } from "@/components/admin/ui/skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Yuklanmoqda">
      <div className="mb-6 flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-56" />
        </div>
        <Skeleton className="h-10 w-36 rounded-[10px]" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/3] rounded-[10px]" />
        ))}
      </div>
    </div>
  );
}
