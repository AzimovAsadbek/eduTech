import { Cursor } from "@/components/motion/cursor";
import { ApplyDialogProvider } from "@/components/site/apply-dialog";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { JsonLd, organizationJsonLd } from "@/components/site/json-ld";
import { getActiveBranches, getPublishedCourses } from "@/server/modules/content/public";
import { getSiteSettings } from "@/server/modules/settings/service";

// Rendered per request so the per-request CSP nonce (see proxy.ts) is applied to Next's own scripts.
// Content still comes from the tagged data cache, so this costs no extra DB work.
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, courses, branches] = await Promise.all([getSiteSettings(), getPublishedCourses(), getActiveBranches()]);
  return (
    <ApplyDialogProvider courses={courses.map((c) => ({ value: c.slug, label: c.title }))} branches={branches.map((b) => ({ value: b.id, label: b.name }))}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-full focus:bg-orange focus:px-4 focus:py-2 focus:text-white">
        Asosiy kontentga oʻtish
      </a>
      <JsonLd data={organizationJsonLd(settings)} />
      <Header />
      <main id="main">{children}</main>
      <Footer settings={settings} />
      <Cursor />
    </ApplyDialogProvider>
  );
}
