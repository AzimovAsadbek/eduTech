"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef } from "react";

/**
 * Meta (Instagram / Facebook) Pixel. Rendered only when NEXT_PUBLIC_META_PIXEL_ID is set.
 * The base code tracks the first PageView; client-side navigations are reported here.
 * Conversions (Lead, Contact, ViewContent) are sent through the analytics facade in `@/lib/analytics`,
 * and Lead events share their id with the server-side Conversions API event for de-duplication.
 */
export function MetaPixel({ pixelId, nonce }: { pixelId: string; nonce?: string }) {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.fbq?.("track", "PageView");
  }, [pathname]);

  if (!/^\d+$/.test(pixelId)) return null;
  return (
    <Script id="meta-pixel" nonce={nonce} strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`}
    </Script>
  );
}
