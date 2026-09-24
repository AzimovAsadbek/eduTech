import { Reveal } from "@/components/motion/reveal";
import { SplitHeading } from "@/components/motion/split-heading";
import { Conversion } from "@/components/site/home/conversion";
import { JsonLd, breadcrumbJsonLd, webPageJsonLd } from "@/components/site/json-ld";
import { PageHeader } from "@/components/site/page-header";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { SectionHeading } from "@/components/ui/section-heading";
import { getActiveBranches, getPublishedCourses, getPublishedGallery, getPublishedServices, getPublishedTeachers } from "@/server/modules/content/public";
import { getSiteSettings } from "@/server/modules/settings/service";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Biz haqimizda — zamonaviy kasblar akademiyasi",
  description: "EduTech — Namangandagi IT, AI, digital va kreativ yoʻnalishlar boʻyicha taʼlim markazi va media studiya. Falsafamiz, jamoamiz va muhitimiz.",
  path: "/biz-haqimizda",
});

const pillars = [
  { k: "IT", t: "Dasturlash va muhandislik", d: "Web, mobil, backend — bozor talab qiladigan stack bilan." },
  { k: "AI", t: "Sunʼiy intellekt", d: "Maʼlumotlar, modellar va AI vositalari bilan ishlash." },
  { k: "Digital", t: "Marketing va oʻsish", d: "SMM, target, permission marketing — natijaga ishlaydigan raqamli marketing." },
  { k: "Creative", t: "Media va prodakshn", d: "Kamera, montaj, kontent — gʻoyadan ekrangacha." },
];

export default async function AboutPage() {
  const [settings, teachers, gallery, courses, services, branches] = await Promise.all([
    getSiteSettings(),
    getPublishedTeachers(),
    getPublishedGallery(),
    getPublishedCourses(),
    getPublishedServices(),
    getActiveBranches(),
  ]);
  const campus = gallery.filter((g) => g.category === "CAMPUS" || g.category === "CLASSROOM").slice(0, 3);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Bosh sahifa", path: "/" }, { name: "Biz haqimizda", path: "/biz-haqimizda" }])} />
      <JsonLd data={webPageJsonLd("AboutPage", "Biz haqimizda — EduTech", "/biz-haqimizda")} />
      <PageHeader eyebrow={`EduTech · ${settings.city}`} title="Zamonaviy kasblar akademiyasi." accent={["kasblar"]} lead="IT + AI + Digital + Creative. Biz toʻrt yoʻnalishni bitta muhitda birlashtirdik — chunki zamonaviy kasb chegaralarda emas, kesishmalarda tugʻiladi." />

      <section className="section-y pt-0" aria-labelledby="pillars-title">
        <div className="container-x">
          <Reveal stagger={0.08} className="grid gap-px overflow-hidden rounded-(--radius-xl) border border-(--line) bg-(--line) md:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p) => (
              <div key={p.k} className="bg-paper p-8">
                <p className="font-display text-4xl font-bold text-orange">{p.k}</p>
                <h2 id={p.k === "IT" ? "pillars-title" : undefined} className="t-h4 mt-6">
                  {p.t}
                </h2>
                <p className="mt-2 text-(--fg-muted)">{p.d}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="section-y bg-paper-2" aria-labelledby="philosophy-title">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Eyebrow className="mb-4">Falsafa</Eyebrow>
            <SplitHeading as="h2" id="philosophy-title" text="Oʻrganish — bu loyiha. Bitiruv — bu boshlanish." accent={["loyiha.", "boshlanish."]} className="t-h1" />
          </div>
          <Reveal className="space-y-6 text-lg leading-relaxed text-(--fg-muted) lg:col-span-6 lg:col-start-7">
            <p>Biz taʼlimni maʼruza deb emas, ish jarayoni deb qaraymiz. Har bir oʻquvchi birinchi haftadan boshlab real vazifa ustida ishlaydi, mentor esa ustoz emas — jamoadagi tajribali hamkasb.</p>
            <p>EduTech ikki dunyodan iborat: taʼlim va media. Media studiyamiz bizneslar uchun kontent yaratadi — va aynan shu studiya oʻquvchilarimiz uchun amaliyot maydoni. Nazariya darsda, tajriba esa real mijoz loyihasida.</p>
            <p>Missiyamiz oddiy: {settings.city} yoshlariga bugun bozorda kerak boʻlgan kasbni berish — va shu shaharda ishlaydigan bizneslarga zamonaviy kontent orqali oʻsish imkonini yaratish.</p>
          </Reveal>
        </div>
      </section>

      {teachers.length ? (
        <section className="section-y" aria-labelledby="team-title">
          <div className="container-x">
            <SectionHeading eyebrow="Jamoa" title={<span id="team-title">Mentorlar va jamoa</span>} lead="Oʻz sohasida ishlaydigan mutaxassislar — darsga real tajriba olib kelishadi." align="split" />
            <Reveal stagger={0.06} className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {teachers.map((t) => (
                <article key={t.id} className="group">
                  <PlaceholderImage src={t.photo} alt={t.name} className="aspect-[4/5] rounded-(--radius-lg) transition-transform duration-500 group-hover:scale-[1.01]" sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" />
                  <h3 className="t-h4 mt-4">{t.name}</h3>
                  <p className="text-sm text-orange">{t.title}</p>
                  {t.courses.length ? <p className="t-meta mt-2 text-(--fg-muted)">{t.courses.map((c) => c.course.title).join(" · ")}</p> : null}
                </article>
              ))}
            </Reveal>
          </div>
        </section>
      ) : null}

      <section className="section-y bg-ink text-white" data-world="media" aria-labelledby="env-title">
        <div className="container-x">
          <SectionHeading eyebrow="Muhit" title={<span id="env-title">Studiya. Sinf. Jamoa.</span>} lead="Oʻquv xonalari, prodakshn studiyasi va jamoa maydoni — bir binoda. Oʻrganish va yaratish yonma-yon." align="split" />
          <Reveal stagger={0.08} className="mt-12 grid gap-4 md:grid-cols-3">
            {(campus.length ? campus : [null, null, null]).map((g, i) => (
              <PlaceholderImage key={g?.id ?? i} src={g?.image} alt={g?.alt ?? "EduTech muhiti"} label={g ? undefined : ["Sinf xonasi", "Studiya", "Jamoa maydoni"][i]} className={`rounded-(--radius-lg) ${i === 0 ? "aspect-[4/5] md:row-span-2" : "aspect-[4/3]"}`} sizes="(min-width:768px) 33vw, 100vw" />
            ))}
          </Reveal>
        </div>
      </section>

      <Conversion courses={courses.map((c) => ({ value: c.slug, label: c.title }))} services={services.map((s) => ({ value: s.slug, label: s.title }))} branches={branches.map((b) => ({ value: b.id, label: b.name }))} settings={settings} />
    </>
  );
}
