import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuth, listUsers } from "@/server/modules/auth/service";
import { listAudit } from "@/server/modules/audit/service";
import { getSiteSettings } from "@/server/modules/settings/service";
import { roleAtLeast } from "@/components/admin/labels";
import { Forbidden } from "@/components/admin/ui/forbidden";
import { PageHeader } from "@/components/admin/ui/page-header";
import { AuditTable } from "@/components/admin/settings/audit-table";
import { PasswordForm } from "@/components/admin/settings/password-form";
import { SettingsTabs, type SettingsTab } from "@/components/admin/settings/settings-tabs";
import { SiteSettingsForm } from "@/components/admin/settings/site-settings-form";
import { UsersPanel } from "@/components/admin/settings/users-panel";

export const metadata: Metadata = { title: "Sozlamalar" };

const TABS: SettingsTab[] = ["site", "users", "audit", "password"];

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [auth, sp] = await Promise.all([getAuth(), searchParams]);
  if (!auth) redirect("/admin/login");
  const isSuper = roleAtLeast(auth.user.role, "SUPER_ADMIN");
  const requested = TABS.includes(sp.tab as SettingsTab) ? (sp.tab as SettingsTab) : "site";

  if (requested !== "password" && !isSuper) return <Forbidden description="Sayt sozlamalari, foydalanuvchilar va audit faqat super admin uchun. Parolni oʻzgartirish sizga ochiq." />;

  let body: React.ReactNode;
  switch (requested) {
    case "site":
      body = <SiteSettingsForm initial={await getSiteSettings()} />;
      break;
    case "users":
      body = <UsersPanel users={await listUsers()} meId={auth.user.id} />;
      break;
    case "audit":
      body = <AuditTable rows={await listAudit(100)} />;
      break;
    default:
      body = <PasswordForm />;
  }

  return (
    <>
      <PageHeader eyebrow="Tizim" title="Sozlamalar" description={isSuper ? "Sayt maʼlumotlari, jamoa va xavfsizlik." : "Hisobingiz xavfsizligi."} />
      <SettingsTabs active={requested} isSuper={isSuper} />
      {body}
    </>
  );
}
