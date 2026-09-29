import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { MotionRuntime } from "@/components/motion/motion-runtime";
import { NavigationProgress } from "@/components/site/navigation-progress";
import { pickClientMessages } from "@/i18n/client-messages";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  // Only the namespaces client components use go to the browser (see i18n/client-messages.ts).
  const messages = pickClientMessages(await getMessages());
  return (
    <NextIntlClientProvider messages={messages}>
      <NavigationProgress />
      {children}
      <MotionRuntime />
    </NextIntlClientProvider>
  );
}
