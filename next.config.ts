import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Standalone output is for the Docker image; Vercel handles bundling itself.
  output: process.env.VERCEL ? undefined : "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 640, 828, 1080, 1280, 1600, 1920],
  },
  serverExternalPackages: ["exceljs", "bcryptjs"],
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
};

export default withNextIntl(nextConfig);
