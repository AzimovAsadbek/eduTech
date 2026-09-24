"use client";

import { Link } from "@/i18n/navigation";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="relative flex min-h-dvh items-center overflow-hidden bg-ink text-white">
      <div aria-hidden className="pointer-events-none absolute -bottom-1/3 left-[-10%] size-[70vw] rounded-full bg-[radial-gradient(closest-side,rgba(255,107,26,.3),transparent)] blur-3xl" />
      <div className="container-x relative py-24">
        <p className="t-eyebrow text-orange">500</p>
        <h1 className="t-display mt-4">Nimadir xato ketdi.</h1>
        <p className="t-lead mt-6 max-w-md text-white/70">Biz allaqachon xabardormiz. Sahifani qayta yuklab koʻring yoki biroz kutib turing.</p>
        {error.digest ? <p className="t-meta mt-4 text-white/40">Kod: {error.digest}</p> : null}
        <div className="mt-10 flex gap-3">
          <button type="button" onClick={reset} className="inline-flex h-12 items-center rounded-full bg-orange px-6 font-semibold text-white hover:bg-orange-deep">
            Qayta urinish
          </button>
          <Link href="/" className="inline-flex h-12 items-center rounded-full border border-white/20 px-6 font-semibold hover:border-white">
            Bosh sahifa
          </Link>
        </div>
      </div>
    </main>
  );
}
