"use client";

import { KeyRound, Plus, UserRoundX, UserRoundCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import type { Role } from "@prisma/client";
import { adminApi, errorMessage, isApiError } from "@/lib/admin-api";
import type { SafeUser } from "@/server/modules/auth/service";
import { adminUserCreateSchema, adminUserUpdateSchema, type AdminUserCreateInput } from "@/server/modules/auth/schema";
import { DateText } from "@/components/admin/ui/date-text";
import { ROLE_LABELS } from "@/components/admin/labels";
import { Button } from "@/components/admin/ui/button";
import { Card, CardHeader } from "@/components/admin/ui/card";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { Input, Select } from "@/components/admin/ui/field";
import { RoleBadge } from "@/components/admin/ui/status-badge";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/admin/ui/table";
import { useToast } from "@/components/admin/ui/toast";

const ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as Role[]).map((r) => ({ value: r, label: ROLE_LABELS[r] }));

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-[min(440px,calc(100vw-2rem))] rounded-(--radius-lg) border border-(--line) bg-paper p-0 text-ink shadow-lg backdrop:bg-ink/40 backdrop:backdrop-blur-[2px]"
    >
      <div className="flex items-center justify-between border-b border-(--line) px-5 py-3">
        <h2 className="t-h4">{title}</h2>
        <button type="button" onClick={onClose} aria-label="Yopish" className="grid size-9 place-items-center rounded-md text-muted hover:bg-ink/5 hover:text-ink">
          <X size={18} />
        </button>
      </div>
      <div className="p-5">{open ? children : null}</div>
    </dialog>
  );
}

function CreateUserForm({ onDone }: { onDone: () => void }) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AdminUserCreateInput>({ defaultValues: { email: "", name: "", password: "", role: "EDITOR" } });

  const submit = handleSubmit(async (values) => {
    const parsed = adminUserCreateSchema.safeParse(values);
    if (!parsed.success) {
      for (const i of parsed.error.issues) setError(i.path[0] as keyof AdminUserCreateInput, { message: i.message });
      return;
    }
    try {
      await adminApi.post("/users", parsed.data);
      toast.success("Foydalanuvchi yaratildi", parsed.data.email);
      onDone();
    } catch (e) {
      if (isApiError(e)) for (const d of e.details) setError(d.path as keyof AdminUserCreateInput, { message: d.message });
      toast.error("Yaratib boʻlmadi", errorMessage(e));
    }
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Input label="Ism" required autoComplete="off" error={errors.name?.message} {...register("name")} />
      <Input label="Email" type="email" required autoComplete="off" error={errors.email?.message} {...register("email")} />
      <Input label="Parol" type="password" required autoComplete="new-password" hint="Kamida 10 ta belgi, katta harf va raqam" error={errors.password?.message} {...register("password")} />
      <Select label="Rol" options={ROLE_OPTIONS} error={errors.role?.message} {...register("role")} />
      <Button type="submit" loading={isSubmitting} className="w-full">
        Yaratish
      </Button>
    </form>
  );
}

function ResetPasswordForm({ user, onDone }: { user: SafeUser; onDone: () => void }) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<{ password: string }>({ defaultValues: { password: "" } });
  const submit = handleSubmit(async (values) => {
    const parsed = adminUserUpdateSchema.pick({ password: true }).safeParse(values);
    if (!parsed.success) {
      setError("password", { message: parsed.error.issues[0]?.message });
      return;
    }
    try {
      await adminApi.patch(`/users/${user.id}`, { password: values.password });
      toast.success("Parol yangilandi", "Foydalanuvchining barcha sessiyalari yopildi.");
      onDone();
    } catch (e) {
      toast.error("Parolni yangilab boʻlmadi", errorMessage(e));
    }
  });
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <p className="text-sm text-muted">
        <span className="font-semibold text-ink">{user.name}</span> ({user.email}) uchun yangi parol.
      </p>
      <Input label="Yangi parol" type="password" required autoComplete="new-password" hint="Kamida 10 ta belgi, katta harf va raqam" error={errors.password?.message} {...register("password")} />
      <Button type="submit" loading={isSubmitting} className="w-full">
        Parolni yangilash
      </Button>
    </form>
  );
}

export function UsersPanel({ users, meId }: { users: SafeUser[]; meId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [create, setCreate] = useState(false);
  const [reset, setReset] = useState<SafeUser | null>(null);
  const [toggle, setToggle] = useState<SafeUser | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const patch = async (u: SafeUser, body: { role?: Role; isActive?: boolean }, okMsg: string) => {
    setBusyId(u.id);
    try {
      await adminApi.patch(`/users/${u.id}`, body);
      toast.success(okMsg, u.email);
      router.refresh();
    } catch (e) {
      toast.error("Amalga oshmadi", errorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader
          title="Foydalanuvchilar"
          description="Rollar: Super admin — hamma narsa · Admin — lidlar va kontent · Muharrir — faqat kontent"
          actions={
            <Button size="sm" icon={<Plus />} onClick={() => setCreate(true)}>
              Foydalanuvchi qoʻshish
            </Button>
          }
        />
        <Table>
          <THead>
            <tr>
              <Th>Foydalanuvchi</Th>
              <Th className="w-44">Rol</Th>
              <Th className="w-24">Holat</Th>
              <Th className="w-40 hidden lg:table-cell">Oxirgi kirish</Th>
              <Th className="w-40" align="right">
                <span className="sr-only">Amallar</span>
              </Th>
            </tr>
          </THead>
          <TBody>
            {users.map((u) => {
              const me = u.id === meId;
              return (
                <Tr key={u.id} className={u.isActive ? undefined : "opacity-60"}>
                  <Td>
                    <span className="block font-semibold text-ink">
                      {u.name} {me ? <span className="t-meta ml-1 text-orange">siz</span> : null}
                    </span>
                    <span className="block text-xs text-muted">{u.email}</span>
                  </Td>
                  <Td>
                    {me ? (
                      <RoleBadge role={u.role} />
                    ) : (
                      <Select aria-label={`${u.name} roli`} value={u.role} disabled={busyId === u.id} options={ROLE_OPTIONS} onChange={(e) => patch(u, { role: e.target.value as Role }, "Rol yangilandi")} className="h-8 text-[13px]" />
                    )}
                  </Td>
                  <Td>
                    <span className={u.isActive ? "inline-flex items-center gap-1.5 text-xs font-semibold text-success" : "inline-flex items-center gap-1.5 text-xs font-semibold text-muted"}>
                      <span aria-hidden className={u.isActive ? "size-1.5 rounded-full bg-success" : "size-1.5 rounded-full bg-muted-2"} />
                      {u.isActive ? "Faol" : "Nofaol"}
                    </span>
                  </Td>
                  <Td className="hidden lg:table-cell">
                    {u.lastLoginAt ? <DateText value={u.lastLoginAt} className="t-meta text-muted" /> : <span className="t-meta text-muted">—</span>}
                  </Td>
                  <Td align="right">
                    <span className="inline-flex items-center gap-0.5">
                      <Button variant="ghost" size="xs" iconOnly icon={<KeyRound />} onClick={() => setReset(u)}>
                        Parolni tiklash
                      </Button>
                      {!me ? (
                        <Button variant="ghost" size="xs" iconOnly icon={u.isActive ? <UserRoundX /> : <UserRoundCheck />} className={u.isActive ? "text-muted hover:text-danger" : "text-muted hover:text-success"} onClick={() => setToggle(u)} disabled={busyId === u.id}>
                          {u.isActive ? "Bloklash" : "Faollashtirish"}
                        </Button>
                      ) : null}
                    </span>
                  </Td>
                </Tr>
              );
            })}
          </TBody>
        </Table>
      </Card>

      <Modal open={create} onClose={() => setCreate(false)} title="Yangi foydalanuvchi">
        <CreateUserForm
          onDone={() => {
            setCreate(false);
            router.refresh();
          }}
        />
      </Modal>
      <Modal open={reset !== null} onClose={() => setReset(null)} title="Parolni tiklash">
        {reset ? <ResetPasswordForm user={reset} onDone={() => setReset(null)} /> : null}
      </Modal>
      <ConfirmDialog
        open={toggle !== null}
        title={toggle?.isActive ? "Foydalanuvchini bloklaysizmi?" : "Foydalanuvchini faollashtirasizmi?"}
        description={toggle?.isActive ? `${toggle.name} tizimga kira olmaydi, barcha sessiyalari yopiladi.` : `${toggle?.name} yana tizimga kira oladi.`}
        confirmLabel={toggle?.isActive ? "Bloklash" : "Faollashtirish"}
        tone={toggle?.isActive ? "danger" : "default"}
        onConfirm={async () => {
          if (!toggle) return;
          await patch(toggle, { isActive: !toggle.isActive }, toggle.isActive ? "Bloklandi" : "Faollashtirildi");
          setToggle(null);
        }}
        onClose={() => setToggle(null)}
      />
    </>
  );
}
