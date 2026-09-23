import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "EduTech — Zamonaviy kasblar akademiyasi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#ffffff", position: "relative", fontFamily: "sans-serif" }}>
        <div style={{ position: "absolute", top: -200, right: -100, width: 700, height: 700, borderRadius: 9999, background: "radial-gradient(closest-side, rgba(255,107,26,.35), transparent)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "#FF6B1A" }} />
          <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: -2, color: "#111" }}>
            Edu<span style={{ color: "#FF6B1A" }}>Tech</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 88, fontWeight: 800, letterSpacing: -4, lineHeight: 1, color: "#111", display: "flex", flexWrap: "wrap" }}>
            Kelajak kasblarini <span style={{ color: "#FF6B1A", marginLeft: 20 }}>bugundan</span> oʻrganing.
          </div>
          <div style={{ fontSize: 28, color: "#737373" }}>Namangan · IT + AI + Digital + Creative · edutech</div>
        </div>
      </div>
    ),
    size,
  );
}
