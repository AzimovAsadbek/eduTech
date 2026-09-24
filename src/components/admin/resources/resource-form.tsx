"use client";

import { ArrowLeft, Copy, ExternalLink, Languages, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ContentStatus, Role } from "@prisma/client";
import { adminApi, errorMessage, isApiError } from "@/lib/admin-api";
import { slugify } from "@/lib/utils";
import { DateText } from "@/components/admin/ui/date-text";
import { roleAtLeast } from "@/components/admin/labels";
import { Button } from "@/components/admin/ui/button";
import { Card, CardBody, CardHeader } from "@/components/admin/ui/card";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { Input } from "@/components/admin/ui/field";
import { LanguageSwitch } from "@/components/admin/ui/language-switch";
import { Segmented } from "@/components/admin/ui/segmented";
import { ContentStatusBadge } from "@/components/admin/ui/status-badge";
import { Switch } from "@/components/admin/ui/switch";
import { useToast } from "@/components/admin/ui/toast";
import {
  LOCALE_LABELS,
  RESOURCES,
  TRANSLATION_LOCALES,
  type FormLocale,
  type Option,
  type RelationKey,
  type ResourceKey,
  type TranslationLocale,
} from "./config";
import { FieldRenderer } from "./field-renderer";
import { localizeIssue, toFormValues, toPayload, type FieldErrors } from "./form-values";
import { TranslationField } from "./translation-field";
import { translationProgress, translationsSchemaFor, type TranslationValues } from "./translations";
import { useFormState } from "./use-form-state";

const STATUS_OPTIONS: { value: ContentStatus; label: string; dot: string }[] = [
  { value: "DRAFT", label: "Qoralama", dot: "#737373" },
  { value: "PUBLISHED", label: "Nashr", dot: "#16A34A" },
  { value: "ARCHIVED", label: "Arxiv", dot: "#D97706" },
];

export interface ResourceFormProps {
  resource: ResourceKey;
  mode: "create" | "edit";
  /** Prisma row for edit, or a template for duplicate. */
  item: Record<string, unknown> | null;
  relations: Partial<Record<RelationKey, Option[]>>;
  role: Role;
}

export function ResourceForm({ resource, mode, item, relations, role }: ResourceFormProps) {
  const ui = RESOURCES[resource];
  const router = useRouter();
  const toast = useToast();
  const initial = useMemo(() => toFormValues(ui, item), [ui, item]);
  const { values, setValue, errors, setErrors, reset, dirty } = useFormState(initial);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lang, setLang] = useState<FormLocale>("uz");
  // A duplicate template already carries a "-nusxa" slug: keep it instead of regenerating from the "(nusxa)" title.
  const slugTouched = useRef(mode === "edit" || item !== null);
  const firstErrorRef = useRef<string | null>(null);

  const slugField = useMemo(() => ui.sections.flatMap((s) => s.fields).find((f) => f.type === "slug"), [ui]);
  const slugSource = slugField && slugField.type === "slug" ? values[slugField.from] : undefined;

  // Auto-slug from the source field until the user edits the slug manually.
  useEffect(() => {
    if (!slugField || slugTouched.current) return;
    setValue(slugField.name, slugify(typeof slugSource === "string" ? slugSource : ""));
  }, [slugField, slugSource, setValue]);

  const id = typeof item?.id === "string" && mode === "edit" ? item.id : null;
  const title = mode === "create" ? `Yangi ${ui.singular.toLowerCase()}` : String(values[ui.titleField] || ui.singular);

  const translations = useMemo(() => (values.translations ?? {}) as TranslationValues, [values.translations]);
  const translationSchema = useMemo(() => translationsSchemaFor(ui), [ui]);
  const progress = useMemo(
    () =>
      Object.fromEntries(TRANSLATION_LOCALES.map((l) => [l, translationProgress(ui, translations, l)])) as Record<
        TranslationLocale,
        { done: number; total: number }
      >,
    [ui, translations],
  );
  const translatedSections = useMemo(
    () => ui.sections.map((s) => ({ ...s, fields: s.fields.filter((f) => ui.translatable.includes(f.name)) })).filter((s) => s.fields.length),
    [ui],
  );

  const setTranslation = useCallback(
    (locale: TranslationLocale, name: string, v: unknown) => {
      const current = (values.translations ?? {}) as TranslationValues;
      setValue("translations", { ...current, [locale]: { ...(current[locale] ?? {}), [name]: v } });
    },
    [values.translations, setValue],
  );

  const applyIssues = useCallback(
    (issues: { path: string; message: string }[]) => {
      const map: FieldErrors = {};
      for (const i of issues) if (!map[i.path]) map[i.path] = i.message;
      setErrors(map);
      const first = issues[0]?.path ?? null;
      if (!first) return;
      // Translation fields live under their locale tab; open it before scrolling to the field.
      const parts = first.split(".");
      const locale =
        parts[0] === "translations" && (TRANSLATION_LOCALES as readonly string[]).includes(parts[1] ?? "") ? (parts[1] as TranslationLocale) : null;
      firstErrorRef.current = locale ? parts.slice(0, 3).join(".") : parts[0];
      setLang(locale ?? "uz");
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>(`[data-field="${firstErrorRef.current}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" }),
      );
    },
    [setErrors],
  );

  const save = async (statusOverride?: ContentStatus) => {
    const payload = toPayload(ui, statusOverride ? { ...values, status: statusOverride } : values);
    const parsed = ui.schema.safeParse(payload);
    const parsedTranslations = translationSchema.safeParse(payload.translations);
    if (!parsed.success || !parsedTranslations.success) {
      const issues = [
        ...(parsed.success ? [] : parsed.error.issues.map((i) => ({ path: i.path.join("."), message: localizeIssue(i) }))),
        ...(parsedTranslations.success
          ? []
          : parsedTranslations.error.issues.map((i) => ({ path: ["translations", ...i.path].join("."), message: localizeIssue(i) }))),
      ];
      applyIssues(issues);
      toast.error("Formada xatoliklar bor", "Belgilangan maydonlarni tekshiring.");
      return;
    }
    setSaving(true);
    try {
      if (id) {
        const { data } = await adminApi.patch<Record<string, unknown>>(`/content/${resource}/${id}`, parsed.data);
        reset(toFormValues(ui, data));
        toast.success("Saqlandi", `${ui.singular} yangilandi.`);
        router.refresh();
      } else {
        const { data } = await adminApi.post<{ id: string }>(`/content/${resource}`, parsed.data);
        reset(values);
        toast.success("Yaratildi", `${ui.singular} qoʻshildi.`);
        router.push(`/admin/${resource}/${data.id}`);
        router.refresh();
      }
    } catch (e) {
      if (isApiError(e) && e.details.length)
        applyIssues(e.details.map((d) => ({ path: d.path, message: localizeIssue({ code: "custom", message: d.message }) })));
      toast.error(id ? "Saqlab boʻlmadi" : "Yaratib boʻlmadi", errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!id) return;
    try {
      await adminApi.delete(`/content/${resource}/${id}`);
      toast.success("Oʻchirildi");
      router.push(`/admin/${resource}`);
      router.refresh();
    } catch (e) {
      toast.error("Oʻchirib boʻlmadi", errorMessage(e));
      setConfirmDelete(false);
    }
  };

  const previewHref = id && ui.preview ? ui.preview(item ?? {}) : null;
  const status = typeof values.status === "string" ? (values.status as ContentStatus) : "DRAFT";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      noValidate
      className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"
    >
      <div className="min-w-0 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button href={`/admin/${resource}`} variant="ghost" size="sm" icon={<ArrowLeft />}>
            {ui.label}
          </Button>
          {ui.translatable.length ? <LanguageSwitch value={lang} onChange={setLang} progress={progress} /> : null}
        </div>
        {lang !== "uz" ? (
          <>
            <p className="bg-paper-2 text-muted flex items-start gap-2 rounded-[10px] border border-(--line) px-4 py-3 text-[13px]">
              <Languages size={16} className="text-orange mt-0.5 shrink-0" aria-hidden />
              <span>
                <strong className="text-ink font-semibold">{LOCALE_LABELS[lang]}</strong> tarjimasi. Boʻsh qoldirilgan maydonlar saytda oʻzbekcha matn bilan
                koʻrsatiladi.
              </span>
            </p>
            {translatedSections.map((section) => (
              <Card key={`${lang}-${section.title}`}>
                <CardHeader title={section.title} description={`${LOCALE_LABELS[lang]} · ${section.fields.length} ta maydon`} />
                <CardBody className="grid gap-4 sm:grid-cols-2">
                  {section.fields.map((f) => (
                    <div
                      key={f.name}
                      className={f.span === 2 || (["textarea", "string-list", "json-list"].includes(f.type) && f.span !== 1) ? "sm:col-span-2" : undefined}
                    >
                      <TranslationField
                        field={f}
                        locale={lang}
                        value={translations[lang]?.[f.name]}
                        original={values[f.name]}
                        onChange={(v) => setTranslation(lang, f.name, v)}
                        errors={errors}
                      />
                    </div>
                  ))}
                </CardBody>
              </Card>
            ))}
          </>
        ) : null}
        {/* Uzbek sections stay mounted while a translation tab is open so list drafts and error anchors survive tab switches. */}
        <div hidden={lang !== "uz"} className="space-y-5">
          {ui.sections.map((section) => (
            <Card key={section.title}>
              <CardHeader title={section.title} description={section.description} />
              <CardBody className="grid gap-4 sm:grid-cols-2">
                {section.fields.map((f) => (
                  <div
                    key={f.name}
                    data-field={f.name}
                    className={
                      f.span === 2 || (["textarea", "image", "string-list", "json-list", "socials", "multiselect"].includes(f.type) && f.span !== 1)
                        ? "sm:col-span-2"
                        : undefined
                    }
                  >
                    <FieldRenderer
                      field={f}
                      value={values[f.name]}
                      onChange={(v) => setValue(f.name, v)}
                      errors={errors}
                      relations={relations}
                      onSlugTouched={() => {
                        slugTouched.current = true;
                      }}
                    />
                  </div>
                ))}
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card>
          <CardHeader
            title={mode === "create" ? "Yaratish" : "Nashr"}
            actions={ui.hasStatus && mode === "edit" && typeof item?.status === "string" ? <ContentStatusBadge status={item.status as ContentStatus} /> : null}
          />
          <CardBody className="space-y-4">
            {ui.hasStatus ? (
              <div data-field="status">
                <p className="text-ink mb-1.5 text-[13px] font-semibold">Holat</p>
                <Segmented<ContentStatus>
                  label="Holat"
                  value={status}
                  options={STATUS_OPTIONS}
                  onChange={(v) => setValue("status", v)}
                  className="w-full [&>button]:flex-1"
                />
                {errors.status ? <p className="text-danger mt-1 text-[13px]">{errors.status}</p> : null}
              </div>
            ) : null}
            {ui.panelToggle ? (
              <Switch
                label={ui.panelToggle.label}
                hint={ui.panelToggle.hint}
                checked={Boolean(values[ui.panelToggle.name])}
                onChange={(v) => setValue(ui.panelToggle!.name, v)}
              />
            ) : null}
            <div data-field="order">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                label="Tartib"
                hint="Kichik raqam oldinroq chiqadi"
                value={String(values.order ?? "0")}
                onChange={(e) => setValue("order", e.target.value)}
                error={errors.order}
              />
            </div>
            <div className="flex flex-col gap-2 border-t border-(--line) pt-4">
              <Button type="submit" icon={<Save />} loading={saving} disabled={mode === "edit" && !dirty}>
                {mode === "create" ? "Yaratish" : "Saqlash"}
              </Button>
              {ui.hasStatus && status !== "PUBLISHED" ? (
                <Button variant="secondary" onClick={() => save("PUBLISHED")} loading={saving}>
                  {mode === "create" ? "Yaratish va nashr etish" : "Saqlash va nashr etish"}
                </Button>
              ) : null}
              {dirty ? <p className="t-meta text-orange text-center">Saqlanmagan oʻzgarishlar bor</p> : null}
            </div>
          </CardBody>
        </Card>

        {id ? (
          <Card>
            <CardHeader title="Amallar" />
            <CardBody className="space-y-2">
              {previewHref ? (
                <Button href={previewHref} variant="outline" size="sm" icon={<ExternalLink />} className="w-full">
                  Oldindan koʻrish
                </Button>
              ) : null}
              <Button href={`/admin/${resource}/new?from=${id}`} variant="outline" size="sm" icon={<Copy />} className="w-full">
                Nusxa olish
              </Button>
              {roleAtLeast(role, "ADMIN") ? (
                <Button variant="danger" size="sm" icon={<Trash2 />} className="w-full" onClick={() => setConfirmDelete(true)}>
                  Oʻchirish
                </Button>
              ) : null}
              <dl className="t-meta text-muted space-y-1 border-t border-(--line) pt-3">
                <div className="flex justify-between gap-2">
                  <dt>ID</dt>
                  <dd className="text-ink truncate">{id}</dd>
                </div>
                {item?.createdAt instanceof Date || typeof item?.createdAt === "string" ? (
                  <div className="flex justify-between gap-2">
                    <dt>Yaratildi</dt>
                    <dd className="text-ink">
                      <DateText value={item.createdAt as Date | string} />
                    </dd>
                  </div>
                ) : null}
                {item?.updatedAt instanceof Date || typeof item?.updatedAt === "string" ? (
                  <div className="flex justify-between gap-2">
                    <dt>Yangilandi</dt>
                    <dd className="text-ink">
                      <DateText value={item.updatedAt as Date | string} />
                    </dd>
                  </div>
                ) : null}
              </dl>
            </CardBody>
          </Card>
        ) : null}
      </aside>

      <ConfirmDialog
        open={confirmDelete}
        title={`${ui.singular}ni oʻchirasizmi?`}
        description={`«${title}» butunlay oʻchiriladi. Bu amalni qaytarib boʻlmaydi.`}
        confirmLabel="Oʻchirish"
        tone="danger"
        onConfirm={remove}
        onClose={() => setConfirmDelete(false)}
      />
    </form>
  );
}
