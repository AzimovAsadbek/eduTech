"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export interface LeadFormOption {
  value: string;
  label: string;
}

function buildSchema(msg: { name: string; phone: string; phoneFormat: string }) {
  return z.object({
    name: z.string().trim().min(2, msg.name),
    phone: z
      .string()
      .trim()
      .min(7, msg.phone)
      .regex(/^[+\d\s()-]+$/, msg.phoneFormat),
    courseSlug: z.string().optional(),
    branchId: z.string().optional(),
    company: z.string().trim().max(150).optional(),
    serviceSlug: z.string().optional(),
    budget: z.string().optional(),
    interest: z.string().optional(),
    message: z.string().trim().max(1500).optional(),
    // Hidden input + valueAsNumber yields NaN until a field was focused; treat that as "unknown" instead of failing silently.
    startedAt: z.number().optional().catch(undefined),
  });
}
type Values = z.infer<ReturnType<typeof buildSchema>>;

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

/** One form component for all three lead types. Posts JSON to the public API. */
export function LeadForm({ type, courses = [], services = [], branches = [], defaultCourseSlug, defaultServiceSlug, source, onDone, className, dark, submitLabel }: Props) {
  const t = useTranslations("leadForm");
  const tc = useTranslations("common.actions");
  const [state, setState] = useState<{ status: "idle" | "submitting" | "success" | "error"; message?: string }>({ status: "idle" });

  const schema = useMemo(() => buildSchema({ name: t("errors.name"), phone: t("errors.phone"), phoneFormat: t("errors.phoneFormat") }), [t]);
  const budgets = (t.raw("budgets") as string[]).map((b) => ({ value: b, label: b }));
  const interests = (t.raw("interests") as string[]).map((b) => ({ value: b, label: b }));

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { courseSlug: defaultCourseSlug ?? "", serviceSlug: defaultServiceSlug ?? "", branchId: branches[0]?.value ?? "" },
  });
  const { register, handleSubmit, formState, setValue, getValues, control } = form;
  const err = (k: keyof Values) => formState.errors[k]?.message as string | undefined;

  const onSubmit = handleSubmit(async (values) => {
    setState({ status: "submitting" });
    const payload: Record<string, unknown> = { type, ...values, website: "", source: source ?? (typeof window !== "undefined" ? window.location.pathname : undefined) };
    for (const k of Object.keys(payload)) if (payload[k] === "") delete payload[k];
    try {
      const res = await fetch("/api/v1/public/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        const details = json?.error?.details as { path: string; message: string }[] | undefined;
        setState({ status: "error", message: details?.[0] ? `${details[0].message}` : (json?.error?.message ?? t("errors.generic")) });
        return;
      }
      track(type === "MEDIA" ? "media_inquiry_submit" : "application_submit", { type, source: String(payload.source ?? "") });
      setState({ status: "success" });
    } catch {
      setState({ status: "error", message: t("errors.network") });
    }
  });

  if (state.status === "success") {
    return (
      <div className={cn("rounded-(--radius-lg) border border-(--line) p-8 text-center", className)} role="status" aria-live="polite">
        <span className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-orange text-white">
          <Check size={26} />
        </span>
        <h3 className="t-h3 mb-2">{t("success.title")}</h3>
        <p className="text-(--fg-muted)">{t("success.text")}</p>
        {onDone ? (
          <Button variant={dark ? "inverse" : "secondary"} className="mt-6" onClick={onDone}>
            {tc("close")}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={cn("space-y-4", className)}
      // First interaction timestamp feeds the server-side "too fast to be human" check.
      onFocusCapture={() => {
        if (!getValues("startedAt")) setValue("startedAt", Date.now());
      }}
    >
      <input type="hidden" {...register("startedAt", { valueAsNumber: true })} />
      {/* Honeypot: hidden from humans, filled by naive bots */}
      <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden>
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={t("fields.name")} placeholder={t("fields.namePlaceholder")} autoComplete="name" required error={err("name")} {...register("name")} />
        <Input label={t("fields.phone")} placeholder={t("fields.phonePlaceholder")} type="tel" inputMode="tel" autoComplete="tel" required error={err("phone")} {...register("phone")} />
      </div>

      {type === "EDUCATION" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller name="courseSlug" control={control} render={({ field: f }) => <Select label={t("fields.course")} options={courses} placeholder={t("fields.coursePlaceholder")} error={err("courseSlug")} value={f.value ?? ""} onChange={f.onChange} name={f.name} />} />
          {branches.length > 1 ? <Controller name="branchId" control={control} render={({ field: f }) => <Select label={t("fields.branch")} options={branches} error={err("branchId")} value={f.value ?? ""} onChange={f.onChange} name={f.name} />} /> : null}
        </div>
      ) : null}

      {type === "MEDIA" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={t("fields.company")} placeholder={t("fields.companyPlaceholder")} autoComplete="organization" error={err("company")} {...register("company")} />
            <Controller name="serviceSlug" control={control} render={({ field: f }) => <Select label={t("fields.service")} options={services} placeholder={t("fields.servicePlaceholder")} error={err("serviceSlug")} value={f.value ?? ""} onChange={f.onChange} name={f.name} />} />
          </div>
          <Controller name="budget" control={control} render={({ field: f }) => <Select label={t("fields.budget")} options={budgets} placeholder={t("fields.selectPlaceholder")} error={err("budget")} value={f.value ?? ""} onChange={f.onChange} name={f.name} />} />
        </>
      ) : null}

      {type === "GENERAL" ? <Controller name="interest" control={control} render={({ field: f }) => <Select label={t("fields.interest")} options={interests} placeholder={t("fields.selectPlaceholder")} error={err("interest")} value={f.value ?? ""} onChange={f.onChange} name={f.name} />} /> : null}

      <Textarea label={t("fields.message")} placeholder={type === "MEDIA" ? t("fields.messagePlaceholderMedia") : t("fields.messagePlaceholder")} error={err("message")} {...register("message")} />

      {state.status === "error" ? (
        <p role="alert" className="rounded-(--radius-md) bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="t-meta text-(--fg-muted)">{t("privacy")}</p>
        <Button type="submit" size="lg" disabled={state.status === "submitting"} icon={<ArrowRight size={18} />} className="sm:min-w-52">
          {state.status === "submitting" ? t("submitting") : (submitLabel ?? tc("send"))}
        </Button>
      </div>
    </form>
  );
}
