import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/**
 * Messages are split per area (common / components / pages) so teams can work on them independently;
 * they are merged into one flat namespace tree per locale.
 */
async function loadMessages(locale: string) {
  const parts = await Promise.all([
    import(`../../messages/${locale}/common.json`),
    import(`../../messages/${locale}/components.json`),
    import(`../../messages/${locale}/pages.json`),
  ]);
  return Object.assign({}, ...parts.map((p) => p.default));
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  return { locale, messages: await loadMessages(locale) };
});
