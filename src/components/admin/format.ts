import { formatDate } from "@/lib/utils";

export const ADMIN_TIME_ZONE = "Asia/Tashkent";

/** `formatDate` pinned to the business timezone so server- and client-rendered timestamps agree. */
export function formatAdminDate(date: Date | string, opts?: Intl.DateTimeFormatOptions): string {
  return formatDate(date, { timeZone: ADMIN_TIME_ZONE, ...opts });
}
