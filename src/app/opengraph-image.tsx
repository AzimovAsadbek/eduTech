import { ImageResponse } from "next/og";
import { BRAND, LOGO } from "@/components/brand/logo-data";

export const runtime = "nodejs";
export const alt = "EduTech — Zamonaviy kasblar akademiyasi, Namangan";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Loads a Google font as TTF for Satori; falls back to the default sans if offline. */
async function loadFont(family: string, weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    // Without a modern User-Agent Google Fonts serves TTF, which Satori can consume (it cannot read woff2).
    const css = await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; EduTechOG/1.0)" },
    }).then((r) => r.text());
    const url = /url\(([^)]+)\)\s*format\('(?:truetype|opentype|woff)'\)/.exec(css)?.[1] ?? /url\(([^)]+\.ttf)\)/.exec(css)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

const HEADLINE = "Kelajak kasblarini bugundan oʻrganing.";

export default async function OgImage() {
  const [display, body] = await Promise.all([loadFont("Bricolage Grotesque", 700, HEADLINE), loadFont("Manrope", 500, "Namangan · IT + AI + Digital + Creative Kurslar · Media xizmatlar")]);
  const fonts = [
    ...(display ? [{ name: "Bricolage", data: display, weight: 700 as const, style: "normal" as const }] : []),
    ...(body ? [{ name: "Manrope", data: body, weight: 500 as const, style: "normal" as const }] : []),
  ];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#ffffff", position: "relative", fontFamily: "sans-serif" }}>
        <div style={{ position: "absolute", top: -300, right: -220, width: 820, height: 820, borderRadius: 9999, background: "rgba(255,107,26,0.10)" }} />
        <div style={{ position: "absolute", top: -120, right: -60, width: 460, height: 460, borderRadius: 9999, background: "rgba(255,107,26,0.12)" }} />
        <svg width={420} height={95} viewBox={`0 0 ${LOGO.width} ${LOGO.height}`}>
          <path d={LOGO.markE} fill={BRAND.orange} />
          <path d={LOGO.markL} fill={BRAND.orange} />
          <path d={LOGO.wordmark} fill={BRAND.charcoal} />
          <path d={LOGO.tagline} fill={BRAND.charcoal} />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontFamily: display ? "Bricolage" : "sans-serif", fontSize: 84, fontWeight: 700, letterSpacing: -4, lineHeight: 1, color: "#111111", display: "flex", flexWrap: "wrap", gap: 20 }}>
            <span>Kelajak kasblarini</span>
            <span style={{ color: BRAND.orange }}>bugundan</span>
            <span>oʻrganing.</span>
          </div>
          <div style={{ fontFamily: body ? "Manrope" : "sans-serif", fontSize: 28, color: "#737373", display: "flex", gap: 14 }}>
            <span>Namangan</span>
            <span>·</span>
            <span>IT + AI + Digital + Creative</span>
          </div>
        </div>
        <div style={{ position: "absolute", right: 72, bottom: 72, display: "flex", alignItems: "center", gap: 10, fontFamily: body ? "Manrope" : "sans-serif", fontSize: 22, color: BRAND.charcoal }}>
          <div style={{ width: 12, height: 12, borderRadius: 9999, background: BRAND.orange }} />
          <span>Kurslar · Media xizmatlar</span>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined },
  );
}
