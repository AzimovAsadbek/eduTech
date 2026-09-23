export default function Loading() {
  return (
    <div className="container-x pt-40 pb-24" aria-busy="true" aria-label="Yuklanmoqda">
      <div className="h-4 w-40 animate-pulse rounded bg-paper-3" />
      <div className="mt-6 h-16 w-3/4 animate-pulse rounded bg-paper-3" />
      <div className="mt-4 h-6 w-1/2 animate-pulse rounded bg-paper-3" />
      <div className="mt-12 grid gap-8 lg:grid-cols-12">
        <div className="h-96 animate-pulse rounded-(--radius-xl) bg-paper-3 lg:col-span-7" />
        <div className="h-96 animate-pulse rounded-(--radius-xl) bg-paper-3 lg:col-span-5" />
      </div>
    </div>
  );
}
