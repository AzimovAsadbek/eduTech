import { redirect } from "next/navigation";
import { getAuth } from "@/server/modules/auth/service";
import { AdminShell } from "@/components/admin/shell/shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuth();
  if (!auth) redirect("/admin/login");
  return <AdminShell user={auth.user}>{children}</AdminShell>;
}
