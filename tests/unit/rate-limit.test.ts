import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "@/server/http/errors";
import { limiter, limits, MemoryRateLimiter } from "@/server/http/rate-limit";

describe("MemoryRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-23T10:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("allows N requests and throws a 429 HttpError on the N+1th", async () => {
    const rl = new MemoryRateLimiter(3, 60_000);
    expect((await rl.consume("ip-a")).remaining).toBe(2);
    expect((await rl.consume("ip-a")).remaining).toBe(1);
    expect((await rl.consume("ip-a")).remaining).toBe(0);
    await expect(rl.consume("ip-a")).rejects.toMatchObject({ status: 429, code: "rate_limited" });
    await expect(rl.consume("ip-a")).rejects.toBeInstanceOf(HttpError);
  });

  it("keeps keys independent", async () => {
    const rl = new MemoryRateLimiter(1, 60_000);
    await rl.consume("a");
    await expect(rl.consume("a")).rejects.toMatchObject({ status: 429 });
    await expect(rl.consume("b")).resolves.toMatchObject({ remaining: 0 });
  });

  it("slides the window: old hits expire individually", async () => {
    const rl = new MemoryRateLimiter(2, 10_000);
    await rl.consume("k"); // t=0
    vi.advanceTimersByTime(6_000);
    await rl.consume("k"); // t=6s
    await expect(rl.consume("k")).rejects.toMatchObject({ status: 429 });
    vi.advanceTimersByTime(4_500); // t=10.5s → first hit expired, second still counts
    expect((await rl.consume("k")).remaining).toBe(0);
    await expect(rl.consume("k")).rejects.toMatchObject({ status: 429 });
    vi.advanceTimersByTime(10_001); // everything expired
    expect((await rl.consume("k")).remaining).toBe(1);
  });

  it("reports resetAt one window ahead of the accepted hit", async () => {
    const rl = new MemoryRateLimiter(5, 1_000);
    const { resetAt } = await rl.consume("k");
    expect(resetAt).toBe(Date.now() + 1_000);
  });

  it("sweeps idle buckets after a window without leaking state", async () => {
    const rl = new MemoryRateLimiter(1, 1_000);
    await rl.consume("old");
    vi.advanceTimersByTime(2_000);
    await rl.consume("new"); // triggers sweep
    const buckets = (rl as unknown as { buckets: Map<string, unknown> }).buckets;
    expect(buckets.has("old")).toBe(false);
    expect(buckets.has("new")).toBe(true);
  });
});

describe("limiter registry", () => {
  it("returns the same instance for the same name (process-global)", () => {
    expect(limiter("x-test", 1, 1000)).toBe(limiter("x-test", 99, 1));
  });
  it("public lead limit is 5 requests per 10 minutes", async () => {
    const rl = limits.publicLead();
    const key = `probe-${Date.now()}`;
    for (let i = 0; i < 5; i++) await rl.consume(key);
    await expect(rl.consume(key)).rejects.toMatchObject({ status: 429 });
  });
});
