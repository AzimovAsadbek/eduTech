import { describe, expect, it } from "vitest";
import { z } from "zod";
import { assertSameOrigin, clientIp, paginationSchema, parseJson, parseQuery } from "@/server/http/request";

const SITE = "http://localhost:3000";
const req = (method: string, headers: Record<string, string> = {}, url = `${SITE}/api/v1/public/leads`) => new Request(url, { method, headers });

describe("assertSameOrigin", () => {
  it("always allows safe methods", () => {
    for (const m of ["GET", "HEAD", "OPTIONS"]) {
      expect(() => assertSameOrigin(req(m, { origin: "https://evil.example" }), SITE)).not.toThrow();
    }
  });

  it("allows same-origin Origin header", () => {
    expect(() => assertSameOrigin(req("POST", { origin: SITE }), SITE)).not.toThrow();
  });

  it("allows an Origin matching the request URL origin even if it differs from the site URL", () => {
    const r = req("POST", { origin: "http://127.0.0.1:3000" }, "http://127.0.0.1:3000/api/v1/public/leads");
    expect(() => assertSameOrigin(r, SITE)).not.toThrow();
  });

  it("allows Sec-Fetch-Site: same-origin / none regardless of Origin", () => {
    expect(() => assertSameOrigin(req("POST", { "sec-fetch-site": "same-origin", origin: "https://evil.example" }), SITE)).not.toThrow();
    expect(() => assertSameOrigin(req("POST", { "sec-fetch-site": "none" }), SITE)).not.toThrow();
  });

  it("allows non-browser clients that send neither Origin nor Sec-Fetch-Site", () => {
    expect(() => assertSameOrigin(req("POST"), SITE)).not.toThrow();
    expect(() => assertSameOrigin(req("PATCH"), SITE)).not.toThrow();
  });

  it("blocks a cross-origin Origin with 403", () => {
    expect(() => assertSameOrigin(req("POST", { origin: "https://evil.example" }), SITE)).toThrow(expect.objectContaining({ status: 403, code: "forbidden" }));
    expect(() => assertSameOrigin(req("DELETE", { origin: "http://localhost:3001" }), SITE)).toThrow(expect.objectContaining({ status: 403 }));
  });

  it("blocks browser cross-site requests that carry Sec-Fetch-Site but no Origin", () => {
    expect(() => assertSameOrigin(req("POST", { "sec-fetch-site": "cross-site" }), SITE)).toThrow(expect.objectContaining({ status: 403 }));
  });

  it("treats a null Origin as cross-origin", () => {
    expect(() => assertSameOrigin(req("POST", { origin: "null" }), SITE)).toThrow(expect.objectContaining({ status: 403 }));
  });
});

describe("clientIp", () => {
  it("prefers the first X-Forwarded-For hop", () => {
    expect(clientIp(req("GET", { "x-forwarded-for": "203.0.113.5, 10.0.0.1", "x-real-ip": "10.0.0.9" }))).toBe("203.0.113.5");
  });
  it("falls back to X-Real-IP then 0.0.0.0", () => {
    expect(clientIp(req("GET", { "x-real-ip": "10.0.0.9" }))).toBe("10.0.0.9");
    expect(clientIp(req("GET"))).toBe("0.0.0.0");
  });
});

describe("parseJson / parseQuery", () => {
  const schema = z.object({ a: z.coerce.number() });
  it("parses a JSON body against a schema", async () => {
    const r = new Request(SITE, { method: "POST", body: JSON.stringify({ a: "5" }), headers: { "content-type": "application/json" } });
    await expect(parseJson(r, schema)).resolves.toEqual({ a: 5 });
  });
  it("throws 400 for a non-JSON body", async () => {
    const r = new Request(SITE, { method: "POST", body: "not json" });
    await expect(parseJson(r, schema)).rejects.toMatchObject({ status: 400 });
  });
  it("throws a ZodError for an invalid body", async () => {
    const r = new Request(SITE, { method: "POST", body: JSON.stringify({ a: "x" }) });
    await expect(parseJson(r, schema)).rejects.toHaveProperty("issues");
  });
  it("parses query strings", () => {
    expect(parseQuery(new Request(`${SITE}/x?page=3&pageSize=10`), paginationSchema)).toEqual({ page: 3, pageSize: 10 });
    expect(parseQuery(new Request(`${SITE}/x`), paginationSchema)).toEqual({ page: 1, pageSize: 20 });
  });
});
