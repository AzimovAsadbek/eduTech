"use client";

import { Copy, Languages, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { adminApi, errorMessage, isApiError } from "@/lib/admin-api";
import type { SiteSettings } from "@/server/modules/settings/service";
import { LOCALE_LABELS, TRANSLATION_LOCALES, type FormLocale, type TranslationLocale } from "@/components/admin/resources/config";
import { Button } from "@/components/admin/ui/button";
import { Card, CardBody, CardHeader } from "@/components/admin/ui/card";
import { Input, Textarea } from "@/components/admin/ui/field";
import { LanguageSwitch } from "@/components/admin/ui/language-switch";
import { Switch } from "@/components/admin/ui/switch";
import { useToast } from "@/components/admin/ui/toast";

/** Site-level copy that gets a Russian / English variant. */
const TRANSLATABLE = [
  { name: "tagline", label: "Tagline" },
  { name: "address", label: "Manzil" },
  { name: "workingHours", label: "Ish vaqti", placeholder: "Пн–Сб 09:00–19:00" },
] as const;
type TranslatableKey = (typeof TRANSLATABLE)[number]["name"];
type LocaleCopy = Record<TranslatableKey, string>;

/** Form shape: every translation slot is a concrete string so the inputs stay controlled. */
type FormValues = Omit<SiteSettings, "translations"> & { translations: Record<TranslationLocale, LocaleCopy> };

function toFormValues(s: SiteSettings): FormValues {
  // `translations` may be missing on values cached before the field existed; treat that as "nothing translated".
  const stored: SiteSettings["translations"] = s.translations ?? {};
  const translations = Object.fromEntries(
    TRANSLATION_LOCALES.map((l) => [l, Object.fromEntries(TRANSLATABLE.map((f) => [f.name, stored[l]?.[f.name] ?? ""])) as LocaleCopy]),
  ) as Record<TranslationLocale, LocaleCopy>;
  return { ...s, translations };
}

/** Blank translations are dropped so the site falls back to the Uzbek value. */
function toPayload(v: FormValues): SiteSettings {
  const translations: SiteSettings["translations"] = {};
  for (const l of TRANSLATION_LOCALES) {
    const copy: Partial<LocaleCopy> = {};
    for (const f of TRANSLATABLE) {
      const s = v.translations[l][f.name].trim();
      if (s) copy[f.name] = s;
    }
    if (Object.keys(copy).length) translations[l] = copy;
  }
  return { ...v, translations };
}

export function SiteSettingsForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter();
  const toast = useToast();
  const [lang, setLang] = useState<FormLocale>("uz");
  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    setValue,
    getValues,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({ defaultValues: toFormValues(initial) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const { data } = await adminApi.patch<SiteSettings>("/settings", toPayload(values));
      reset(toFormValues(data));
      toast.success("Sozlamalar saqlandi");
      router.refresh();
    } catch (e) {
      if (isApiError(e)) {
        for (const d of e.details) setError(d.path as FieldPath<FormValues>, { message: d.message });
      }
      toast.error("Saqlab boʻlmadi", errorMessage(e));
    }
  });

  const telegramOn = useWatch({ control, name: "telegramNotifications" });
  const translations = useWatch({ control, name: "translations" });
  const originals = useWatch({ control, name: ["tagline", "address", "workingHours"] });
  const progress = useMemo(
    () =>
      Object.fromEntries(
        TRANSLATION_LOCALES.map((l) => [
          l,
          { done: TRANSLATABLE.filter((f) => (translations?.[l]?.[f.name] ?? "").trim() !== "").length, total: TRANSLATABLE.length },
        ]),
      ) as Record<TranslationLocale, { done: number; total: number }>,
    [translations],
  );

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted text-[13px]">Tagline, manzil va ish vaqti uchun tarjimalar.</p>
          <LanguageSwitch value={lang} onChange={setLang} progress={progress} />
        </div>
        {lang !== "uz" ? (
          <Card>
            <CardHeader
              title={`${LOCALE_LABELS[lang]} tarjimasi`}
              description="Boʻsh qoldirilgan maydonlar saytda oʻzbekcha matn bilan koʻrsatiladi."
              actions={<Languages size={18} className="text-orange" aria-hidden />}
            />
            <CardBody className="grid gap-4">
              {TRANSLATABLE.map((f, i) => {
                const original = originals[i] ?? "";
                const path = `translations.${lang}.${f.name}` as const;
                return (
                  <div key={`${lang}-${f.name}`} data-field={path} className="space-y-1.5">
                    <Input
                      label={f.label}
                      placeholder={"placeholder" in f ? f.placeholder : undefined}
                      error={errors.translations?.[lang]?.[f.name]?.message}
                      {...register(path)}
                    />
                    <div className="bg-paper-2 text-muted flex items-start gap-2 rounded-[8px] px-2.5 py-1.5 text-[12px] leading-relaxed">
                      <span
                        aria-hidden
                        className="bg-paper-3 text-muted-2 mt-0.5 inline-flex h-4 shrink-0 items-center rounded px-1 font-mono text-[10px] font-bold"
                      >
                        UZ
                      </span>
                      <span className="sr-only">Oʻzbekcha asl matn:</span>
                      <span className="line-clamp-2 min-w-0 flex-1 break-words">
                        {original.trim() ? original : <span className="text-muted-2 italic">— boʻsh —</span>}
                      </span>
                      <Button
                        variant="ghost"
                        size="xs"
                        icon={<Copy />}
                        className="text-muted hover:text-orange -my-1 -mr-1 h-7 shrink-0 text-[12px]"
                        disabled={!original.trim()}
                        onClick={() => setValue(path, getValues(f.name), { shouldDirty: true })}
                      >
                        Oʻzbekchadan nusxa olish
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardBody>
          </Card>
        ) : null}
        {/* Uzbek fields stay mounted (hidden) so their registrations and values survive tab switches. */}
        <div hidden={lang !== "uz"} className="space-y-5">
          <Card>
            <CardHeader title="Brend" description="Sayt sarlavhasi va slogan" />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <Input label="Brend nomi" error={errors.brandName?.message} {...register("brandName")} />
              <Input label="Tagline" error={errors.tagline?.message} {...register("tagline")} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Aloqa" description="Footer, kontakt sahifasi va JSON-LD uchun" />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <Input label="Shahar" error={errors.city?.message} {...register("city")} />
              <Input label="Ish vaqti" placeholder="Du–Sh 09:00–19:00" error={errors.workingHours?.message} {...register("workingHours")} />
              <Input label="Manzil" wrapClassName="sm:col-span-2" error={errors.address?.message} {...register("address")} />
              <Input label="Telefon" type="tel" inputMode="tel" placeholder="+998 .." error={errors.phone?.message} {...register("phone")} />
              <Input label="Qoʻshimcha telefon" type="tel" inputMode="tel" error={errors.phoneSecondary?.message} {...register("phoneSecondary")} />
              <Input label="Email" type="email" inputMode="email" error={errors.email?.message} {...register("email")} />
              <Input label="Telegram" placeholder="@edutech" error={errors.telegram?.message} {...register("telegram")} />
              <Input label="Instagram" placeholder="@edutech" error={errors.instagram?.message} {...register("instagram")} />
              <Input label="YouTube" placeholder="https://youtube.com/@edutech" error={errors.youtube?.message} {...register("youtube")} />
              <Textarea
                label="Xarita embed URL"
                hint="Google/Yandex xaritadan iframe src manzili"
                wrapClassName="sm:col-span-2"
                className="min-h-20 font-mono text-[13px]"
                error={errors.mapEmbedUrl?.message}
                {...register("mapEmbedUrl")}
              />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Statistika" description="Bosh sahifadagi raqamlar (matn sifatida)" />
            <CardBody className="grid gap-4 sm:grid-cols-3">
              <Input label="Talabalar" placeholder="500+" error={errors.stats?.students?.message} {...register("stats.students")} />
              <Input label="Kurslar" placeholder="9+" error={errors.stats?.courses?.message} {...register("stats.courses")} />
              <Input label="Loyihalar" placeholder="100+" error={errors.stats?.projects?.message} {...register("stats.projects")} />
            </CardBody>
          </Card>
        </div>
      </div>
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card>
          <CardHeader title="Bildirishnomalar" />
          <CardBody>
            <Switch
              label="Telegram xabarlari"
              hint="Yangi lid kelganda guruhga xabar yuboriladi"
              checked={telegramOn}
              onChange={(v) => setValue("telegramNotifications", v, { shouldDirty: true })}
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody className="space-y-2">
            <Button type="submit" icon={<Save />} loading={isSubmitting} disabled={!isDirty} className="w-full">
              Saqlash
            </Button>
            {isDirty ? (
              <p className="t-meta text-orange text-center">Saqlanmagan oʻzgarishlar bor</p>
            ) : (
              <p className="t-meta text-muted text-center">Oʻzgarishlar darhol saytda koʻrinadi</p>
            )}
          </CardBody>
        </Card>
      </aside>
    </form>
  );
}
