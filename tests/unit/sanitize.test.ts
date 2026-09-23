import { describe, expect, it } from "vitest";
import { escapeHtml, stripHtml } from "@/lib/sanitize";

describe("stripHtml", () => {
  it("removes tags but keeps text", () => {
    expect(stripHtml("<b>Ali</b> <script>alert(1)</script>Valiyev")).toBe("Ali alert(1)Valiyev");
  });
  it("removes control characters", () => {
    expect(stripHtml("Ali\u0000\u0007 \u001fVali\u007f")).toBe("Ali Vali");
  });
  it("collapses whitespace and trims", () => {
    expect(stripHtml("  Ali \n\n  Valiyev\t ")).toBe("Ali Valiyev");
  });
  it("leaves plain text alone", () => {
    expect(stripHtml("Oʻzbekiston 2026")).toBe("Oʻzbekiston 2026");
  });
});

describe("escapeHtml", () => {
  it("escapes &, <, > and quotes", () => {
    expect(escapeHtml(`<a href="x">Tom & Jerry</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&lt;/a&gt;");
  });
  it("is idempotent on already safe text", () => {
    expect(escapeHtml("hello")).toBe("hello");
  });
  it("escapes ampersand first so entities are not double-decoded", () => {
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });
});
