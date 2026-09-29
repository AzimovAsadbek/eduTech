/**
 * Writes the static logo lockups to public/brand from the same geometry as the inline <Logo>.
 * Run after changing components/brand/logo-data.ts:  npx tsx scripts/generate-brand-assets.ts
 * (tests/unit/brand-assets.test.ts fails while the files are out of date).
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { lockupPath, lockupSvg, type LogoTone } from "../src/components/brand/logo-svg";

for (const tone of ["light", "dark"] as LogoTone[]) {
  for (const tagline of [true, false]) {
    const file = path.join(process.cwd(), "public", lockupPath(tone, tagline));
    writeFileSync(file, lockupSvg(tone, tagline));
    console.log("wrote", path.relative(process.cwd(), file));
  }
}
