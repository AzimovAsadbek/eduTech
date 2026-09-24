import { describe, expect, it } from "vitest";
import { cn, normalizePhone, pad2, slugify } from "@/lib/utils";

describe("normalizePhone", () => {
  it("prefixes 9-digit local numbers with +998", () => {
    expect(normalizePhone("90 123 45 67")).toBe("+998901234567");
    expect(normalizePhone("(90) 123-45-67")).toBe("+998901234567");
  });
  it("normalises 12-digit numbers starting with 998", () => {
    expect(normalizePhone("998901234567")).toBe("+998901234567");
    expect(normalizePhone("+998 90 123 45 67")).toBe("+998901234567");
  });
  it("returns trimmed input when it cannot be normalised", () => {
    expect(normalizePhone("  +1 415 555 0100 ")).toBe("+1 415 555 0100");
    expect(normalizePhone("12345")).toBe("12345");
  });
});

describe("slugify", () => {
  it("lowercases, removes Uzbek apostrophes and joins with dashes", () => {
    expect(slugify("Oʻzbek tili")).toBe("ozbek-tili");
    expect(slugify("Sunʼiy intellekt")).toBe("suniy-intellekt"); // ʼ (U+02BC) is stripped like ʻ (U+02BB)
  });
  it("strips leading/trailing dashes and special characters", () => {
    expect(slugify("  --Hello, World!--  ")).toBe("hello-world");
  });
  it("transliterates Cyrillic into a URL-safe Latin slug", () => {
    expect(slugify("Дастурлаш курси")).toBe("dasturlash-kursi");
    expect(slugify("Sunʼiy intellekt")).toBe("suniy-intellekt");
  });
  it("caps length at 80", () => {
    expect(slugify("a".repeat(120)).length).toBe(80);
  });
});

describe("pad2", () => {
  it("pads single digits", () => {
    expect(pad2(1)).toBe("01");
    expect(pad2(9)).toBe("09");
  });
  it("leaves two-digit and larger numbers alone", () => {
    expect(pad2(10)).toBe("10");
    expect(pad2(123)).toBe("123");
  });
});

describe("cn", () => {
  it("merges tailwind classes with the last one winning", () => {
    expect(cn("p-2", "p-4", false && "hidden")).toBe("p-4");
  });
});
