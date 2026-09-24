import type { Faq } from "@prisma/client";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Accordion } from "@/components/ui/accordion";
import { Eyebrow } from "@/components/ui/eyebrow";
import { routes } from "@/config/site";
import { JsonLd, faqJsonLd } from "./json-ld";

interface Props {
  faqs: Faq[];
  title?: string;
  eyebrow?: string;
  lead?: string;
}

/** FAQ as an editorial split: sticky intro + contact nudge on the left, numbered accordion on the right. */
export function FaqSection({ faqs, title = "Koʻp beriladigan savollar", eyebrow = "FAQ", lead = "Javob topolmadingizmi? Bir xabar yozing — jamoamiz ish kuni davomida javob beradi." }: Props) {
  if (!faqs.length) return null;
  return (
    <section className="section-y border-t border-(--line)" aria-labelledby="faq-title">
      <JsonLd data={faqJsonLd(faqs)} />
      <div className="container-x grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <Eyebrow className="mb-4">{eyebrow}</Eyebrow>
            <h2 id="faq-title" className="t-h2">
              {title}
            </h2>
            <p className="mt-4 max-w-sm text-(--fg-muted)">{lead}</p>
            <Link href={routes.contact} className="group mt-6 inline-flex items-center gap-2 rounded-full border border-(--line) px-5 py-2.5 font-semibold transition-colors hover:border-orange hover:text-orange media-world:border-white/15">
              Savol berish
              <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:rotate-45" />
            </Link>
          </div>
        </div>
        <div className="lg:col-span-8">
          <Accordion
            defaultOpen={faqs[0]?.id}
            items={faqs.map((f, i) => ({
              id: f.id,
              title: f.question,
              content: <p className="max-w-2xl">{f.answer}</p>,
              meta: String(i + 1).padStart(2, "0"),
            }))}
          />
        </div>
      </div>
    </section>
  );
}
