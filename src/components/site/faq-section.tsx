import type { Faq } from "@prisma/client";
import { Accordion } from "@/components/ui/accordion";
import { SectionHeading } from "@/components/ui/section-heading";

export function FaqSection({ faqs, title = "Koʻp beriladigan savollar", eyebrow = "FAQ" }: { faqs: Faq[]; title?: string; eyebrow?: string }) {
  if (!faqs.length) return null;
  return (
    <section className="section-y" aria-labelledby="faq-title">
      <div className="container-x grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHeading eyebrow={eyebrow} title={<span id="faq-title">{title}</span>} />
        </div>
        <div className="lg:col-span-8">
          <Accordion items={faqs.map((f, i) => ({ id: f.id, title: f.question, content: <p>{f.answer}</p>, meta: String(i + 1).padStart(2, "0") }))} defaultOpen={faqs[0]?.id} />
        </div>
      </div>
    </section>
  );
}
