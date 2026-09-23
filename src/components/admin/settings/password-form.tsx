"use client";

import { KeyRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { adminApi, errorMessage, isApiError } from "@/lib/admin-api";
import { changePasswordSchema } from "@/server/modules/auth/schema";
import { Button } from "@/components/admin/ui/button";
import { Card, CardBody, CardHeader } from "@/components/admin/ui/card";
import { Input } from "@/components/admin/ui/field";
import { useToast } from "@/components/admin/ui/toast";

interface Values {
  currentPassword: string;
  newPassword: string;
  confirm: string;
}

export function PasswordForm() {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ defaultValues: { currentPassword: "", newPassword: "", confirm: "" } });

  const submit = handleSubmit(async (values) => {
    if (values.newPassword !== values.confirm) {
      setError("confirm", { message: "Parollar mos kelmadi" });
      return;
    }
    const parsed = changePasswordSchema.safeParse({ currentPassword: values.currentPassword, newPassword: values.newPassword });
    if (!parsed.success) {
      for (const i of parsed.error.issues) {
        const k = i.path[0];
        if (k === "currentPassword" || k === "newPassword") setError(k, { message: i.message });
      }
      return;
    }
    try {
      await adminApi.post("/auth/password", parsed.data);
      reset();
      toast.success("Parol oʻzgartirildi", "Boshqa qurilmalardagi sessiyalar yopildi.");
    } catch (e) {
      if (isApiError(e) && e.status === 401) setError("currentPassword", { message: e.message });
      else toast.error("Parolni oʻzgartirib boʻlmadi", errorMessage(e));
    }
  });

  return (
    <Card className="max-w-lg">
      <CardHeader title="Parolni oʻzgartirish" description="Kamida 10 ta belgi, bitta katta harf va bitta raqam." />
      <CardBody>
        <form onSubmit={submit} noValidate className="space-y-4">
          <Input label="Joriy parol" type="password" autoComplete="current-password" required error={errors.currentPassword?.message} {...register("currentPassword")} />
          <Input label="Yangi parol" type="password" autoComplete="new-password" required error={errors.newPassword?.message} {...register("newPassword")} />
          <Input label="Yangi parolni tasdiqlang" type="password" autoComplete="new-password" required error={errors.confirm?.message} {...register("confirm")} />
          <Button type="submit" icon={<KeyRound />} loading={isSubmitting}>
            Parolni yangilash
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
