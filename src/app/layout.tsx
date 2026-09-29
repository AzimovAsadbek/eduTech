import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Manrope } from "next/font/google";
import localFont from "next/font/local";
import { getLocale } from "next-intl/server";
import { siteConfig, absoluteUrl } from "@/config/site";
import "./globals.css";

/*
 * Font budget: only the Latin files of the three faces are preloaded (~94 KB, down from 284 KB).
 * - Bricolage Grotesque is self-hosted as Google's static instance at its display optical size
 *   (opsz 96, width 100, variable weight). Headings always used opsz 96, but the full variable file
 *   (opsz + wdth + wght axes) costs 128 KB for Latin alone; the pinned instance is 40 KB.
 * - Manrope and JetBrains Mono keep every subset available through unicode-range (Cyrillic loads on
 *   demand for Russian pages); only Latin is preloaded. Measured: not preloading the mono face made the
 *   simulated FCP about 150 ms worse (its request then waited for the CSS), so it is preloaded too.
 */
const bricolage = localFont({
  src: "./fonts/bricolage-grotesque-opsz96-latin.woff2",
  weight: "200 800",
  style: "normal",
  display: "swap",
  variable: "--font-bricolage",
  adjustFontFallback: "Arial",
  // Google Fonts' "latin" range (font loader options must be literals): Uzbek Latin incl. ʻ U+02BB / ʼ U+02BC, English, punctuation.
  declarations: [
    {
      prop: "unicode-range",
      value: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
    },
  ],
});
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
// If it arrives after the first paint it swaps in, so its stand-in must be monospace too: the default
// fallback is Arial scaled to 135%, which wraps labels differently and shifts the layout on swap.
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500"],
  adjustFontFallback: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "Liberation Mono", "monospace"],
});

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
