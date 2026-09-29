"use client";

import { useLocale } from "next-intl";
import { useEffect } from "react";
import { captureAttribution, type TouchDefaults } from "@/lib/attribution";

/**
 * Records where this session came from and reports the session's first page view once
 * (no cookies, no personal data). Mounted by the public layouts; renders nothing.
 */
export function AttributionTracker({ defaults }: { defaults?: TouchDefaults }) {
  const locale = useLocale();

  useEffect(() => {
    const { sessionId, isNewSession, touch } = captureAttribution(defaults);
    if (!isNewSession) return;
    void fetch("/api/v1/public/visits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId, touch, locale }),
      keepalive: true,
    }).catch(() => undefined);
    // Only the first mount of a page load matters; attribution does not change on client navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
