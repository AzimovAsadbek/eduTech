import Link from "next/link";
import { cn } from "@/lib/utils";

export type SettingsTab = "site" | "users" | "audit" | "password";

const TABS: { value: SettingsTab; label: string; superOnly: boolean }[] = [
  { value: "site", label: "Sayt", superOnly: true },
  { value: "users", label: "Foydalanuvchilar", superOnly: true },
  { value: "audit", label: "Audit", superOnly: true },
  { value: "password", label: "Parol", superOnly: false },
];

export function SettingsTabs({ active, isSuper }: { active: SettingsTab; isSuper: boolean }) {
  return (
    <nav aria-label="Sozlamalar boʻlimlari" className="mb-5 flex gap-1 overflow-x-auto border-b border-(--line)">
      {TABS.filter((t) => isSuper || !t.superOnly).map((t) => {
        const on = t.value === active;
        return (
          <Link
            key={t.value}
            href={`/admin/settings?tab=${t.value}`}
            aria-current={on ? "page" : undefined}
            className={cn("relative -mb-px inline-flex h-11 shrink-0 items-center px-4 text-sm font-semibold transition-colors", on ? "text-ink" : "text-muted hover:text-ink")}
          >
            {t.label}
            <span aria-hidden className={cn("absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-orange transition-opacity", on ? "opacity-100" : "opacity-0")} />
          </Link>
        );
      })}
    </nav>
  );
}
