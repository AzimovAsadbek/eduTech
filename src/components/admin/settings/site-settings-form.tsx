"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { adminApi, errorMessage, isApiError } from "@/lib/admin-api";
import type { SiteSettings } from "@/server/modules/settings/service";
import { Button } from "@/components/admin/ui/button";
import { Card, CardBody, CardHeader } from "@/components/admin/ui/card";
import { Input, Textarea } from "@/components/admin/ui/field";
import { Switch } from "@/components/admin/ui/switch";
import { useToast } from "@/components/admin/ui/toast";

export function SiteSettingsForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SiteSettings>({ defaultValues: initial });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const { data } = await adminApi.patch<SiteSettings>("/settings", values);
      reset(data);
      toast.success("Sozlamalar saqlandi");
      router.refresh();
    } catch (e) {
      if (isApiError(e)) {
        for (const d of e.details) setError(d.path as keyof SiteSettings, { message: d.message });
      }
      toast.error("Saqlab boʻlmadi", errorMessage(e));
    }
  });

  const telegramOn = useWatch({ control, name: "telegramNotifications" });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-5">
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
            <Textarea label="Xarita embed URL" hint="Google/Yandex xaritadan iframe src manzili" wrapClassName="sm:col-span-2" className="min-h-20 font-mono text-[13px]" error={errors.mapEmbedUrl?.message} {...register("mapEmbedUrl")} />
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
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card>
          <CardHeader title="Bildirishnomalar" />
          <CardBody>
            <Switch label="Telegram xabarlari" hint="Yangi lid kelganda guruhga xabar yuboriladi" checked={telegramOn} onChange={(v) => setValue("telegramNotifications", v, { shouldDirty: true })} />
          </CardBody>
        </Card>
        <Card>
          <CardBody className="space-y-2">
            <Button type="submit" icon={<Save />} loading={isSubmitting} disabled={!isDirty} className="w-full">
              Saqlash
            </Button>
            {isDirty ? <p className="t-meta text-center text-orange">Saqlanmagan oʻzgarishlar bor</p> : <p className="t-meta text-center text-muted">Oʻzgarishlar darhol saytda koʻrinadi</p>}
          </CardBody>
        </Card>
      </aside>
    </form>
  );
}
