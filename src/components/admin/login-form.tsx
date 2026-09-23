"use client";

import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { adminApi, errorMessage, isApiError } from "@/lib/admin-api";
import { loginSchema, type LoginInput } from "@/server/modules/auth/schema";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/field";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ defaultValues: { email: "", password: "" } });

  const safeNext = next && next.startsWith("/admin") && !next.startsWith("/admin/login") ? next : "/admin";

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "email" || key === "password") setError(key, { message: issue.message });
      }
      return;
    }
    try {
      await adminApi.post("/auth/login", parsed.data);
      router.push(safeNext);
      router.refresh();
    } catch (e) {
      if (isApiError(e) && e.details.length) {
        for (const d of e.details) {
          if (d.path === "email" || d.path === "password") setError(d.path, { message: d.message });
        }
      }
      setServerError(errorMessage(e, "Kirish amalga oshmadi"));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {serverError ? (
        <div role="alert" className="rounded-[10px] border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {serverError}
        </div>
      ) : null}
      <Input
        label="Email"
        type="email"
        autoComplete="username"
        inputMode="email"
        placeholder="admin@edutech.uz"
        leading={<Mail />}
        error={errors.email?.message}
        className="h-12"
        {...register("email")}
      />
      <div className="relative">
        <Input
          label="Parol"
          type={show ? "text" : "password"}
          autoComplete="current-password"
          placeholder="••••••••••"
          leading={<Lock />}
          error={errors.password?.message}
          className="h-12 pr-12"
          {...register("password")}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Parolni yashirish" : "Parolni koʻrsatish"}
          aria-pressed={show}
          className="absolute top-[30px] right-1.5 grid size-9 place-items-center rounded-md text-muted hover:bg-ink/5 hover:text-ink"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      <Button type="submit" size="md" className="h-12 w-full text-[15px]" loading={isSubmitting} icon={<ArrowRight />}>
        Kirish
      </Button>
      <p className="t-meta text-center text-muted">Sessiya 12 soat davom etadi · faqat xodimlar uchun</p>
    </form>
  );
}
