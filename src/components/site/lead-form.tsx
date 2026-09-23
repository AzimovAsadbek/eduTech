"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";

export interface LeadFormOption {
  value: string;
  label: string;
}

const phone = z
  .string()
  .trim()
  .min(7, "Telefon raqamni kiriting")
  .regex(/^[+\d\s()-]+$/, "Faqat raqamlar");

const anySchema = z.object({
  name: z.string().trim().min(2, "Ismingizni kiriting"),
  phone,
  courseSlug: z.string().optional(),
  branchId: z.string().optional(),
  company: z.string().trim().max(150).optional(),
  serviceSlug: z.string().optional(),
  budget: z.string().optional(),
  interest: z.string().optional(),
  message: z.string().trim().max(1500).optional(),
});
type Values = z.infer<typeof anySchema>;

interface Props {
  type: "EDUCATION" | "MEDIA" | "GENERAL";
  courses?: LeadFormOption[];
  services?: LeadFormOption[];
  branches?: LeadFormOption[];
  defaultCourseSlug?: string;
  defaultServiceSlug?: string;
  source?: string;
  onDone?: () => void;
  className?: string;
  dark?: boolean;
  submitLabel?: string;
}

const BUDGETS = ["1 mln soʻmgacha", "1–3 mln soʻm", "3–10 mln soʻm", "10 mln soʻmdan yuqori", "Aniq emas"];
const INTERESTS = ["Kurslar", "Media xizmatlar", "Hamkorlik", "Boshqa"];

/** One form component for all three lead types. Posts JSON to the public API. */
export function LeadForm({ type, courses = [], services = [], branches = [], defaultCourseSlug, defaultServiceSlug, source, onDone, className, dark, submitLabel }: Props) {
  const startedAt = useMemo(() => Date.now(), []);
  const [state, setState] = useState<{ status: "idle" | "submitting" | "success" | "error"; message?: string }>({ status: "idle" });

  const form = useForm<Values>({
    resolver: zodResolver(anySchema),
    defaultValues: { courseSlug: defaultCourseSlug ?? "", serviceSlug: defaultServiceSlug ?? "", branchId: branches[0]?.value ?? "" },
  });
  const { register, handleSubmit, formState } = form;
  const err = (k: keyof Values) => formState.errors[k]?.message as string | undefined;

  const onSubmit = handleSubmit(async (values) => {
    setState({ status: "submitting" });
    const payload: Record<string, unknown> = { type, ...values, startedAt, website: "", source: source ?? (typeof window !== "undefined" ? window.location.pathname : undefined) };
    for (const k of Object.keys(payload)) if (payload[k] === "") delete payload[k];
    try {
      const res = await fetch("/api/v1/public/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        const details = json?.error?.details as { path: string; message: string }[] | undefined;
        setState({ status: "error", message: details?.[0] ? `${details[0].message}` : (json?.error?.message ?? "Xatolik yuz berdi") });
        return;
      }
      track(type === "MEDIA" ? "media_inquiry_submit" : "application_submit", { type, source: String(payload.source ?? "") });
      setState({ status: "success" });
    } catch {
      setState({ status: "error", message: "Tarmoq xatosi. Qayta urinib koʻring." });
    }
  });

  if (state.status === "success") {
    return (
      <div className={cn("rounded-(--radius-lg) border border-(--line) p-8 text-center", className)} role="status" aria-live="polite">
        <span className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-orange text-white">
          <Check size={26} />
        </span>
        <h3 className="t-h3 mb-2">Arizangiz qabul qilindi</h3>
        <p className="text-(--fg-muted)">Rahmat! Tez orada siz bilan bogʻlanamiz.</p>
        {onDone ? (
          <Button variant={dark ? "inverse" : "secondary"} className="mt-6" onClick={onDone}>
            Yopish
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className={cn("space-y-4", className)}>
      {/* Honeypot: hidden from humans, filled by naive bots */}
      <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden>
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Ismingiz" placeholder="Ism Familiya" autoComplete="name" required error={err("name")} {...register("name")} />
        <Input label="Telefon" placeholder="+998 90 123 45 67" type="tel" inputMode="tel" autoComplete="tel" required error={err("phone")} {...register("phone")} />
      </div>

      {type === "EDUCATION" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Qiziqqan kurs" options={courses} placeholder="Kursni tanlang" error={err("courseSlug")} {...register("courseSlug")} />
          {branches.length > 1 ? <Select label="Filial" options={branches} error={err("branchId")} {...register("branchId")} /> : null}
        </div>
      ) : null}

      {type === "MEDIA" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Kompaniya / brend" placeholder="Kompaniya nomi" autoComplete="organization" error={err("company")} {...register("company")} />
            <Select label="Xizmat" options={services} placeholder="Xizmatni tanlang" error={err("serviceSlug")} {...register("serviceSlug")} />
          </div>
          <Select label="Taxminiy byudjet" options={BUDGETS.map((b) => ({ value: b, label: b }))} placeholder="Tanlang" error={err("budget")} {...register("budget")} />
        </>
      ) : null}

      {type === "GENERAL" ? <Select label="Qiziqish" options={INTERESTS.map((b) => ({ value: b, label: b }))} placeholder="Tanlang" error={err("interest")} {...register("interest")} /> : null}

      <Textarea label="Xabar" placeholder={type === "MEDIA" ? "Loyiha haqida qisqacha…" : "Savolingiz yoki izoh…"} error={err("message")} {...register("message")} />

      {state.status === "error" ? (
        <p role="alert" className="rounded-(--radius-md) bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="t-meta text-(--fg-muted)">Maʼlumotlaringiz faqat bogʻlanish uchun ishlatiladi.</p>
        <Button type="submit" size="lg" disabled={state.status === "submitting"} icon={<ArrowRight size={18} />} className="sm:min-w-52">
          {state.status === "submitting" ? "Yuborilmoqda…" : (submitLabel ?? "Yuborish")}
        </Button>
      </div>
    </form>
  );
}
