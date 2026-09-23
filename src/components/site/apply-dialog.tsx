"use client";

import { X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { LeadForm, type LeadFormOption } from "./lead-form";

interface Ctx {
  open: (preset?: { courseSlug?: string }) => void;
  close: () => void;
}

const ApplyContext = createContext<Ctx>({ open: () => undefined, close: () => undefined });
export const useApplyDialog = () => useContext(ApplyContext);

/**
 * Global "Kursga yozilish" dialog. Native <dialog> gives focus trapping, Esc and inert background for free.
 */
export function ApplyDialogProvider({ children, courses, branches }: { children: React.ReactNode; courses: LeadFormOption[]; branches: LeadFormOption[] }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [preset, setPreset] = useState<{ courseSlug?: string }>({});
  const [mounted, setMounted] = useState(false);

  const open = useCallback((p?: { courseSlug?: string }) => {
    setPreset(p ?? {});
    setMounted(true);
    requestAnimationFrame(() => ref.current?.showModal());
  }, []);
  const close = useCallback(() => ref.current?.close(), []);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onClose = () => setMounted(false);
    const onClick = (e: MouseEvent) => {
      if (e.target === d) d.close();
    };
    d.addEventListener("close", onClose);
    d.addEventListener("click", onClick);
    return () => {
      d.removeEventListener("close", onClose);
      d.removeEventListener("click", onClick);
    };
  }, []);

  const value = useMemo(() => ({ open, close }), [open, close]);

  return (
    <ApplyContext.Provider value={value}>
      {children}
      <dialog
        ref={ref}
        aria-labelledby="apply-title"
        className="m-auto w-[min(100vw-2rem,40rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-(--radius-xl) border-0 bg-paper p-0 text-ink shadow-lg backdrop:bg-ink/60 backdrop:backdrop-blur-sm open:animate-[dialog-in_.4s_var(--ease-out)]"
      >
        {mounted ? (
          <div className="relative p-6 sm:p-8">
            <button type="button" onClick={close} aria-label="Yopish" className="absolute top-4 right-4 grid size-10 place-items-center rounded-full border border-(--line) hover:bg-ink/5">
              <X size={18} />
            </button>
            <p className="t-eyebrow mb-3 text-orange">Kursga yozilish</p>
            <h2 id="apply-title" className="t-h3 mb-2 pr-10">
              Bepul konsultatsiya oling
            </h2>
            <p className="mb-6 text-(--fg-muted)">Maʼlumotlaringizni qoldiring — bir ish kuni ichida bogʻlanamiz va sizga mos kursni tanlashga yordam beramiz.</p>
            <LeadForm type="EDUCATION" courses={courses} branches={branches} defaultCourseSlug={preset.courseSlug} source={typeof window !== "undefined" ? `dialog:${window.location.pathname}` : "dialog"} onDone={close} />
          </div>
        ) : null}
      </dialog>
      <style>{`@keyframes dialog-in{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}`}</style>
    </ApplyContext.Provider>
  );
}
