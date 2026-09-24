import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuth } from "@/server/modules/auth/service";
import { LoginForm } from "@/components/admin/login-form";
import { AdminBrand } from "@/components/admin/shell/brand";

export const metadata: Metadata = { title: "Kirish" };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [{ next }, auth] = await Promise.all([searchParams, getAuth()]);
  if (auth) redirect(next && next.startsWith("/admin") && !next.startsWith("/admin/login") ? next : "/admin");

  return (
    <main className="grid min-h-dvh bg-paper lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)]">
      {/* Brand side */}
      <section className="relative isolate flex flex-col justify-between overflow-hidden bg-ink px-8 py-8 text-white sm:px-12 lg:px-16 lg:py-12">
        <div aria-hidden className="pointer-events-none absolute -top-1/4 right-[-20%] -z-10 size-[80vw] max-w-[900px] rounded-full bg-[radial-gradient(closest-side,rgba(255,107,26,.38),transparent)] blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-1/3 left-[-20%] -z-10 size-[60vw] max-w-[700px] rounded-full bg-[radial-gradient(closest-side,rgba(255,107,26,.16),transparent)] blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-[0.045] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:48px_48px]" />

        <AdminBrand href="/" />

        <div className="my-16 max-w-xl lg:my-0">
          <p className="t-eyebrow text-orange">Boshqaruv paneli</p>
          <h1 className="t-h1 mt-5 text-balance">
            Kurslar, lidlar va <span className="text-orange">media</span> — bir joyda.
          </h1>
          <p className="t-lead mt-6 max-w-md text-white/65">Kontentni nashr eting, murojaatlarni kuzating va jamoa bilan bitta panelda ishlang.</p>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-white/10 pt-6">
            {[
              ["Lidlar", "Telegram + Excel"],
              ["Kontent", "10 ta resurs"],
              ["Rollar", "3 daraja"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="t-meta text-white/40">{k}</dt>
                <dd className="mt-1 text-sm font-semibold text-white">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="t-meta hidden text-white/35 lg:block">© {new Date().getFullYear()} EduTech · Namangan</p>
      </section>

      {/* Form side */}
      <section className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <p className="t-eyebrow text-muted">Xush kelibsiz</p>
          <h2 className="t-h3 mt-3">Tizimga kirish</h2>
          <p className="mt-2 text-sm text-muted">Xodim hisobingiz bilan kiring. Parolni unutgan boʻlsangiz, super adminga murojaat qiling.</p>
          <div className="mt-8">
            <LoginForm next={next} />
          </div>
        </div>
      </section>
    </main>
  );
}
