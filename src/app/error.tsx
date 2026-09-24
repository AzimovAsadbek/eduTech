"use client";

import { hasLocale, NextIntlClientProvider, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import enCommon from "../../messages/en/common.json";
import enPages from "../../messages/en/pages.json";
import ruCommon from "../../messages/ru/common.json";
import ruPages from "../../messages/ru/pages.json";
import uzCommon from "../../messages/uz/common.json";
import uzPages from "../../messages/uz/pages.json";

// This boundary sits above `[locale]/layout.tsx`, so no intl provider exists here: it brings its own,
// picking the locale from `<html lang>` (set by the root layout) and bundling only the messages it needs.
const MESSAGES: Record<Locale, Record<string, unknown>> = {
  uz: { common: uzCommon.common, pages: { error: uzPages.pages.error } },
  ru: { common: ruCommon.common, pages: { error: ruPages.pages.error } },
  en: { common: enCommon.common, pages: { error: enPages.pages.error } },
};

function currentLocale(): Locale {
  const lang = typeof document === "undefined" ? "" : document.documentElement.lang;
  return hasLocale(routing.locales, lang) ? lang : routing.defaultLocale;
}

function ErrorView({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("pages.error");
  const tc = useTranslations("common");
  return (
    <main className="relative flex min-h-dvh items-center overflow-hidden bg-ink text-white">
      <div aria-hidden className="pointer-events-none absolute -bottom-1/3 left-[-10%] size-[70vw] rounded-full bg-[radial-gradient(closest-side,rgba(255,107,26,.3),transparent)] blur-3xl" />
      <div className="container-x relative py-24">
        <p className="t-eyebrow text-orange">500</p>
        <h1 className="t-display mt-4">{t("title")}</h1>
        <p className="t-lead mt-6 max-w-md text-white/70">{t("lead")}</p>
        {error.digest ? <p className="t-meta mt-4 text-white/40">{t("code", { digest: error.digest })}</p> : null}
        <div className="mt-10 flex gap-3">
          <button type="button" onClick={reset} className="inline-flex h-12 items-center rounded-full bg-orange px-6 font-semibold text-white hover:bg-orange-deep">
            {t("retry")}
          </button>
          <Link href="/" className="inline-flex h-12 items-center rounded-full border border-white/20 px-6 font-semibold hover:border-white">
            {tc("nav.home")}
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [locale] = useState<Locale>(currentLocale);
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
      <ErrorView error={error} reset={reset} />
    </NextIntlClientProvider>
  );
}
