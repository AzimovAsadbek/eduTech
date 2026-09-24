import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CYRILLIC: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p",
  р: "r", с: "s", т: "t", у: "u", ф: "f", х: "x", ц: "ts", ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "i", ь: "", э: "e", ю: "yu", я: "ya",
  ў: "o", қ: "q", ғ: "g", ҳ: "h",
};

/** URL slug from Uzbek Latin or Cyrillic text: "Sunʼiy intellekt" → "suniy-intellekt", "Дастурлаш" → "dasturlash". */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[ʻʼ'’`]/g, "")
    .replace(/[\u0400-\u04FF]/g, (ch) => CYRILLIC[ch] ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Two-digit index for editorial lists: 1 → "01". */
export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function formatDate(date: Date | string, opts?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("uz-UZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    ...opts,
  }).format(d);
}

/** Normalises Uzbek phone numbers to +998XXXXXXXXX where possible. */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 9) return `+998${digits}`;
  if (digits.length === 12 && digits.startsWith("998")) return `+${digits}`;
  return raw.trim();
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
