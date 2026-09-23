"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function GlobalSearch() {
  const [q, setQ] = useState("");
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <form
      role="search"
      className="relative hidden w-full max-w-md md:block"
      onSubmit={(e) => {
        e.preventDefault();
        const term = q.trim();
        router.push(term ? `/admin/leads?q=${encodeURIComponent(term)}` : "/admin/leads");
      }}
    >
      <label htmlFor="global-search" className="sr-only">
        Lidlarni qidirish
      </label>
      <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden />
      <input
        ref={ref}
        id="global-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Lidlarni qidirish — ism, telefon, kompaniya"
        className="h-10 w-full rounded-full border border-(--line) bg-paper-2 pr-14 pl-9 text-sm text-ink placeholder:text-muted-2 focus:border-orange focus:bg-paper focus:outline-none focus:ring-3 focus:ring-orange/15"
      />
      <kbd className="t-meta pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded border border-(--line) bg-paper px-1.5 py-0.5 text-[10px] text-muted" aria-hidden>
        ⌘K
      </kbd>
    </form>
  );
}
