import { tooMany } from "./errors";

export interface RateLimiter {
  /** Returns remaining tokens or throws 429. */
  consume(key: string): Promise<{ remaining: number; resetAt: number }>;
}

interface Bucket {
  hits: number[];
}

/**
 * Sliding-window limiter kept in process memory.
 * Swap for a Redis implementation (same interface) when running more than one instance.
 */
export class MemoryRateLimiter implements RateLimiter {
  private buckets = new Map<string, Bucket>();
  private lastSweep = Date.now();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  async consume(key: string) {
    const now = Date.now();
    this.sweep(now);
    const bucket = this.buckets.get(key) ?? { hits: [] };
    bucket.hits = bucket.hits.filter((t) => now - t < this.windowMs);
    if (bucket.hits.length >= this.limit) {
      const resetAt = bucket.hits[0] + this.windowMs;
      this.buckets.set(key, bucket);
      throw tooMany("Juda koʻp soʻrov yuborildi. Birozdan soʻng qayta urinib koʻring.");
    }
    bucket.hits.push(now);
    this.buckets.set(key, bucket);
    return { remaining: this.limit - bucket.hits.length, resetAt: now + this.windowMs };
  }

  private sweep(now: number) {
    if (now - this.lastSweep < this.windowMs) return;
    for (const [key, bucket] of this.buckets) {
      if (bucket.hits.every((t) => now - t >= this.windowMs)) this.buckets.delete(key);
    }
    this.lastSweep = now;
  }
}

const g = globalThis as unknown as { __limiters?: Record<string, RateLimiter> };
g.__limiters ??= {};

export function limiter(name: string, limit: number, windowMs: number): RateLimiter {
  return (g.__limiters![name] ??= new MemoryRateLimiter(limit, windowMs));
}

export const limits = {
  publicLead: () => limiter("public-lead", 5, 10 * 60 * 1000),
  login: () => limiter("login", 8, 15 * 60 * 1000),
  adminApi: () => limiter("admin-api", 300, 60 * 1000),
  upload: () => limiter("upload", 30, 10 * 60 * 1000),
};
