import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/admin/ui/toast";

export const metadata: Metadata = {
  title: { default: "EduTech Admin", template: "%s — EduTech Admin" },
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = { themeColor: "#111111", width: "device-width", initialScale: 1 };

export const dynamic = "force-dynamic";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
