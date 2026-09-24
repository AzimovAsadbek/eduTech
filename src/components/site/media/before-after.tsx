"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { isExternalImage } from "@/components/ui/placeholder-image";

/** Accessible comparison slider: a range input drives the clip, keyboard works out of the box. */
export function BeforeAfter({ before, after, alt }: { before: string; after: string; alt: string }) {
  const t = useTranslations("beforeAfter");
  const [pos, setPos] = useState(50);
  const id = useId();
  return (
    <div className="relative aspect-[16/9] select-none overflow-hidden rounded-(--radius-xl)">
      <Image src={before} alt={t("beforeAlt", { alt })} fill sizes="100vw" className="object-cover" unoptimized={isExternalImage(before)} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
        <Image src={after} alt={t("afterAlt", { alt })} fill sizes="100vw" className="object-cover" unoptimized={isExternalImage(after)} />
      </div>
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,.2)]" style={{ left: `${pos}%` }} aria-hidden>
        <span className="absolute top-1/2 left-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-ink shadow-md">⇔</span>
      </div>
      <span className="t-meta absolute top-4 left-4 rounded-full bg-black/50 px-2.5 py-1 text-white backdrop-blur">{t("before")}</span>
      <span className="t-meta absolute top-4 right-4 rounded-full bg-orange px-2.5 py-1 text-white">{t("after")}</span>
      <label htmlFor={id} className="sr-only">
        {t("label")}
      </label>
      <input id={id} type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
    </div>
  );
}
