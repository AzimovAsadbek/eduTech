import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing, type Locale } from "./routing";

/** Route params of every page under `[locale]` (Next's generated validator requires `string` here). */
export type LocaleParams = Promise<{ locale: string }>;

/**
 * Narrows the `[locale]` route param to a supported `Locale`. The locale layout already 404s unknown
 * values, so this mainly gives pages a precise type for `localize*()` and `pageMetadata()`.
 */
export async function resolveLocale(params: LocaleParams): Promise<Locale> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  return locale;
}
