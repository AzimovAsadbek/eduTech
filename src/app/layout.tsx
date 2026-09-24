import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, JetBrains_Mono, Manrope } from "next/font/google";
import { getLocale } from "next-intl/server";
import { siteConfig, absoluteUrl } from "@/config/site";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  variable: "--font-bricolage",
  axes: ["opsz", "wdth"],
  display: "swap",
});
const manrope = Manrope({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-manrope", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-jetbrains", display: "swap", weight: ["400", "500"] });

const title = `${siteConfig.name} — Zamonaviy kasblar akademiyasi | Namangan`;

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl("/")),
  title: { default: title, template: `%s — ${siteConfig.name}` },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name, url: absoluteUrl("/") }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: "education",
  referrer: "strict-origin-when-cross-origin",
  formatDetection: { telephone: true, email: true, address: true },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    title,
    description: siteConfig.description,
    url: absoluteUrl("/"),
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${siteConfig.name} — ${siteConfig.city}` }],
  },
  twitter: { card: "summary_large_image", title, description: siteConfig.description, images: ["/opengraph-image"] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION, other: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION ? { "yandex-verification": process.env.NEXT_PUBLIC_YANDEX_VERIFICATION } : undefined }
    : undefined,
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#ffffff" }, { media: "(prefers-color-scheme: dark)", color: "#0b0b0c" }],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} data-scroll-behavior="smooth" className={`${bricolage.variable} ${manrope.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
