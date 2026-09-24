import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { notFoundMetadata } from "@/lib/seo";

// Lives outside `[locale]`, so the locale is resolved from the request (next-intl middleware) rather than params.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.notFound");
  return { ...notFoundMetadata, title: t("seoTitle") };
}

export default async function NotFound() {
  const [t, tc] = await Promise.all([getTranslations("pages.notFound"), getTranslations("common")]);
  return (
    // Rendered above `[locale]/layout.tsx`, so it needs its own provider (inherits locale + messages from the request config) for the locale-aware links.
    <NextIntlClientProvider>
      <main className="relative flex min-h-dvh items-center overflow-hidden bg-paper">
        <div aria-hidden className="pointer-events-none absolute -top-1/3 right-[-10%] size-[70vw] rounded-full bg-[radial-gradient(closest-side,rgba(255,107,26,.22),transparent)] blur-3xl" />
        <div className="container-x relative py-24">
          <p className="t-eyebrow text-orange">404</p>
          <h1 className="t-display mt-4">{t.rich("title", { accent: (chunks) => <span className="text-orange">{chunks}</span> })}</h1>
          <p className="t-lead mt-6 max-w-md">{t("lead")}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/" className="inline-flex h-12 items-center gap-2 rounded-full bg-orange px-6 font-semibold text-white hover:bg-orange-deep">
              <ArrowLeft size={18} /> {tc("nav.home")}
            </Link>
            <Link href="/kurslar" className="inline-flex h-12 items-center rounded-full border border-(--line) px-6 font-semibold hover:bg-ink/5">
              {tc("nav.courses")}
            </Link>
            <Link href="/media" className="inline-flex h-12 items-center rounded-full border border-(--line) px-6 font-semibold hover:bg-ink/5">
              {tc("nav.media")}
            </Link>
          </div>
        </div>
      </main>
    </NextIntlClientProvider>
  );
}
