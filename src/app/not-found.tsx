import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh items-center overflow-hidden bg-paper">
      <div aria-hidden className="pointer-events-none absolute -top-1/3 right-[-10%] size-[70vw] rounded-full bg-[radial-gradient(closest-side,rgba(255,107,26,.22),transparent)] blur-3xl" />
      <div className="container-x relative py-24">
        <p className="t-eyebrow text-orange">404</p>
        <h1 className="t-display mt-4">
          Bu sahifa <span className="text-orange">hali</span> yaratilmagan.
        </h1>
        <p className="t-lead mt-6 max-w-md">Havola eskirgan yoki notoʻgʻri boʻlishi mumkin. Kurslar yoki media xizmatlarga qayting.</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/" className="inline-flex h-12 items-center gap-2 rounded-full bg-orange px-6 font-semibold text-white hover:bg-orange-deep">
            <ArrowLeft size={18} /> Bosh sahifa
          </Link>
          <Link href="/kurslar" className="inline-flex h-12 items-center rounded-full border border-(--line) px-6 font-semibold hover:bg-ink/5">
            Kurslar
          </Link>
          <Link href="/media" className="inline-flex h-12 items-center rounded-full border border-(--line) px-6 font-semibold hover:bg-ink/5">
            Media
          </Link>
        </div>
      </div>
    </main>
  );
}
