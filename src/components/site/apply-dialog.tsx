"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { LeadForm, type LeadFormOption } from "./lead-form";

export type ApplyKind = "EDUCATION" | "MEDIA";

export interface ApplyPreset {
  type?: ApplyKind;
  courseSlug?: string;
  serviceSlug?: string;
}

interface Ctx {
  open: (preset?: ApplyPreset) => void;
  close: () => void;
}

const ApplyContext = createContext<Ctx>({ open: () => undefined, close: () => undefined });
export const useApplyDialog = () => useContext(ApplyContext);

/** Pages can announce a service so the global CTA opens a request for that service. */
export function readServiceContext(): string | undefined {
  return typeof document === "undefined" ? undefined : document.body.dataset.serviceSlug || undefined;
}

interface ProviderProps {
  children: React.ReactNode;
  courses: LeadFormOption[];
  services: LeadFormOption[];
  branches: LeadFormOption[];
}

/**
 * Global application dialog for both worlds: course application (EDUCATION) and service request (MEDIA).
 * Native <dialog> gives focus trapping, Esc and inert background; on phones it presents as an iOS-style bottom sheet.
 */
export function ApplyDialogProvider({ children, courses, services, branches }: ProviderProps) {
  const t = useTranslations("applyDialog");
  const tc = useTranslations("common.actions");
  const ref = useRef<HTMLDialogElement>(null);
  const [preset, setPreset] = useState<ApplyPreset>({});
  const [mounted, setMounted] = useState(false);

  const open = useCallback((p?: ApplyPreset) => {
    setPreset({ type: "EDUCATION", ...p });
    setMounted(true);
    requestAnimationFrame(() => {
      const d = ref.current;
      if (!d) return;
      d.showModal();
      // Start in the first field instead of on the close button.
      d.querySelector<HTMLInputElement>('input:not([type="hidden"])')?.focus({ preventScroll: true });
    });
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
  const isMedia = preset.type === "MEDIA";
  const source = typeof window !== "undefined" ? `dialog:${window.location.pathname}` : "dialog";

  return (
    <ApplyContext.Provider value={value}>
      {children}
      <dialog
        ref={ref}
        aria-labelledby="apply-title"
        data-world={isMedia ? "media" : undefined}
        className={[
          // Phones: bottom sheet. Desktop: centred card.
          "fixed inset-x-0 bottom-0 m-0 mt-auto w-full max-w-none max-h-[94dvh] overflow-y-auto overscroll-contain rounded-t-[32px] border-0 p-0 shadow-lg",
          "sm:inset-auto sm:m-auto sm:w-[min(100vw-2rem,40rem)] sm:max-h-[calc(100dvh-2rem)] sm:rounded-(--radius-xl)",
          "backdrop:bg-ink/55 backdrop:backdrop-blur-md open:animate-[sheet-in_.45s_var(--ease-out)] sm:open:animate-[dialog-in_.4s_var(--ease-out)]",
          isMedia ? "bg-[#141416] text-white" : "bg-paper text-ink",
        ].join(" ")}
      >
        {mounted ? (
          <div className="relative px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-8">
            <span aria-hidden className="mx-auto mb-4 block h-1.5 w-10 rounded-full bg-current opacity-20 sm:hidden" />
            <button
              type="button"
              onClick={close}
              aria-label={tc("close")}
              className={`absolute top-4 right-4 grid size-10 place-items-center rounded-full transition-colors sm:top-6 sm:right-6 ${isMedia ? "bg-white/10 text-white hover:bg-white/15" : "bg-ink/[0.06] text-ink hover:bg-ink/10"}`}
            >
              <X size={18} />
            </button>
            <p className="t-eyebrow mb-2 text-orange">{isMedia ? tc("order") : tc("apply")}</p>
            <h2 id="apply-title" className="t-h3 mb-2 pr-12">
              {isMedia ? t("media.title") : t("title")}
            </h2>
            <p className={isMedia ? "mb-6 text-white/65" : "mb-6 text-(--fg-muted)"}>{isMedia ? t("media.lead") : t("lead")}</p>
            {isMedia ? (
              <LeadForm type="MEDIA" services={services} defaultServiceSlug={preset.serviceSlug} source={source} onDone={close} dark />
            ) : (
              <LeadForm type="EDUCATION" courses={courses} branches={branches} defaultCourseSlug={preset.courseSlug} source={source} onDone={close} />
            )}
          </div>
        ) : null}
      </dialog>
      <style>{`@keyframes dialog-in{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}@keyframes sheet-in{from{transform:translateY(100%)}to{transform:none}}`}</style>
    </ApplyContext.Provider>
  );
}
