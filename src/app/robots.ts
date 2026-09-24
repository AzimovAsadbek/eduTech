import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/*?preview=1"] },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: new URL(absoluteUrl("/")).host,
  };
}
