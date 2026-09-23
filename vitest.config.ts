import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/** Aliases that let server modules (which import `server-only` / `next/cache`) load under Vitest. */
const serverAliases = [
  { find: /^server-only$/, replacement: r("./tests/helpers/server-only.ts") },
  { find: /^next\/cache$/, replacement: r("./tests/helpers/next-cache.ts") },
  { find: /^@\//, replacement: `${r("./src")}/` },
];

export default defineConfig({
  plugins: [react()],
  test: {
    globals: false,
    passWithNoTests: false,
    projects: [
      {
        extends: true,
        resolve: { alias: serverAliases },
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
          setupFiles: ["tests/setup/unit.ts"],
          // *.test.tsx files opt into jsdom with a `// @vitest-environment jsdom` docblock.
        },
      },
      {
        extends: true,
        resolve: {
          alias: [...serverAliases, { find: /^next\/headers$/, replacement: r("./tests/helpers/next-headers.ts") }],
        },
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.test.ts"],
          setupFiles: ["tests/setup/integration.ts"],
          // One shared database: run files one at a time so truncation does not race.
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 30_000,
        },
      },
    ],
  },
});
