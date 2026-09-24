"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

export function ServiceView({ slug }: { slug: string }) {
  useEffect(() => {
    track("service_view", { service: slug });
    // Lets the global CTA (header / mobile dock) open a request for this exact service.
    document.body.dataset.serviceSlug = slug;
    return () => {
      delete document.body.dataset.serviceSlug;
    };
  }, [slug]);
  return null;
}
