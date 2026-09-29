import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { lockupPath, lockupSvg, type LogoTone } from "@/components/brand/logo-svg";

describe("static logo lockups", () => {
  for (const tone of ["light", "dark"] as LogoTone[]) {
    for (const tagline of [true, false]) {
      it(`${lockupPath(tone, tagline)} matches the logo geometry (run scripts/generate-brand-assets.ts if not)`, () => {
        const file = readFileSync(path.resolve(__dirname, "../../public", `.${lockupPath(tone, tagline)}`), "utf8");
        expect(file).toBe(lockupSvg(tone, tagline));
      });
    }
  }
});
