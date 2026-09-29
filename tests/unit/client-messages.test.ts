import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CLIENT_NAMESPACES, CLIENT_SUBTREES, pickClientMessages } from "@/i18n/client-messages";

const SRC = path.resolve(__dirname, "../../src");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : /\.tsx?$/.test(name) ? [full] : [];
  });
}

/** Every `useTranslations("…")` namespace in public "use client" files (the admin has no next-intl provider). */
function clientNamespaces(): { file: string; ns: string }[] {
  return walk(SRC)
    .filter((f) => !f.includes(`${path.sep}admin${path.sep}`))
    .flatMap((file) => {
      const code = readFileSync(file, "utf8");
      if (!/^["']use client["']/m.test(code)) return [];
      return [...code.matchAll(/useTranslations\(\s*(?:["']([^"']*)["'])?\s*\)/g)].map((m) => ({ file: path.relative(SRC, file), ns: m[1] ?? "" }));
    });
}

describe("client message namespaces", () => {
  it("covers every namespace a client component asks for", () => {
    const allowed = (ns: string) => {
      const [root, child] = ns.split(".");
      if ((CLIENT_NAMESPACES as readonly string[]).includes(root)) return true;
      return CLIENT_SUBTREES.some(([r, c]) => r === root && c === child);
    };
    const used = clientNamespaces();
    expect(used.length).toBeGreaterThan(10);
    expect(used.filter((u) => u.ns === "")).toEqual([]);
    expect(used.filter((u) => !allowed(u.ns))).toEqual([]);
  });

  it("lists no namespace that no client component uses (every entry is shipped to the browser)", () => {
    const roots = new Set(clientNamespaces().map((u) => u.ns.split(".")[0]));
    expect(CLIENT_NAMESPACES.filter((ns) => !roots.has(ns))).toEqual([]);
  });

  it("keeps only client namespaces and the listed subtrees", () => {
    const picked = pickClientMessages({
      common: { a: "1" },
      leadForm: { b: "2" },
      footer: { c: "3" },
      pages: { error: { title: "x" }, home: { seo: "y" } },
    });
    expect(picked).toEqual({ common: { a: "1" }, leadForm: { b: "2" }, pages: { error: { title: "x" } } });
  });
});
