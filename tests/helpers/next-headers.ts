/**
 * In-memory replacement for `next/headers` `cookies()` so the auth service can be exercised
 * outside a Next request scope. Tests inspect/clear the jar via `cookieJar`.
 */
export interface StoredCookie {
  name: string;
  value: string;
  options?: Record<string, unknown>;
}

const store = new Map<string, StoredCookie>();

export const cookieJar = {
  all: () => Array.from(store.values()),
  get: (name: string) => store.get(name),
  clear: () => store.clear(),
};

const api = {
  get(name: string) {
    return store.get(name);
  },
  getAll() {
    return Array.from(store.values());
  },
  has(name: string) {
    return store.has(name);
  },
  set(name: string | { name: string; value: string; [k: string]: unknown }, value?: string, options?: Record<string, unknown>) {
    if (typeof name === "object") {
      const { name: n, value: v, ...opts } = name;
      store.set(n, { name: n, value: v, options: opts });
    } else {
      store.set(name, { name, value: value ?? "", options });
    }
    return api;
  },
  delete(name: string) {
    store.delete(name);
    return api;
  },
};

export async function cookies() {
  return api;
}

export async function headers() {
  return new Headers();
}
