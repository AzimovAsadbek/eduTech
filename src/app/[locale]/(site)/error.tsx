"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Link } from "@/i18n/navigation";

/** Page-level error boundary: rendered inside the site layout (header/footer stay) and the locale provider. */
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("pages.error");
  const tc = useTranslations("common");
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <section className="relative flex min-h-[70vh] items-center overflow-hidden bg-ink text-white">
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
    </section>
  );
}
