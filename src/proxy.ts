import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionJwt } from "@/server/modules/auth/token";

const isDev = process.env.NODE_ENV !== "production";

function buildCsp(nonce: string) {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "font-src 'self' data:",
    "connect-src 'self'" + (isDev ? " ws: wss:" : ""),
    "frame-src 'self' https://www.google.com https://maps.google.com https://yandex.com https://yandex.uz https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "worker-src 'self' blob:",
  ];
  if (!isDev) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}

function applySecurityHeaders(res: NextResponse, csp: string) {
  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  if (!isDev) res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
}

export async function proxy(req: NextRequest) {
  const nonce = btoa(crypto.getRandomValues(new Uint8Array(16)).join(","));
  const csp = buildCsp(nonce);
  const { pathname } = req.nextUrl;

  // ── Admin gate (edge-cheap JWT check; full DB session check happens in the layout/API) ──
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const jwt = req.cookies.get(SESSION_COOKIE)?.value;
    const claims = jwt ? await verifySessionJwt(jwt, process.env.AUTH_SECRET ?? "") : null;
    if (!claims) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      const res = NextResponse.redirect(url);
      applySecurityHeaders(res, csp);
      return res;
    }
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  applySecurityHeaders(res, csp);
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/v1/admin")) {
    res.headers.set("Cache-Control", "no-store");
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return res;
}

export const config = {
  matcher: [
    // Skip static assets and Next internals; include pages and API routes.
    "/((?!_next/static|_next/image|favicon.ico|uploads/|icons/|images/|fonts/|robots.txt|sitemap.xml|manifest.webmanifest).*)",
  ],
};
