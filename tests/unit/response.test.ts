import { describe, expect, it, vi } from "vitest";
import { z, ZodError } from "zod";
import { badRequest, conflict, HttpError, notFound, tooMany, unauthorized } from "@/server/http/errors";
import { created, fail, handler, ok, paginated } from "@/server/http/response";

describe("fail()", () => {
  it("maps HttpError to its status/code/message/details", async () => {
    const res = fail(new HttpError(418, "teapot", "teapot_code", { hint: "x" }));
    expect(res.status).toBe(418);
    await expect(res.json()).resolves.toEqual({ ok: false, error: { code: "teapot_code", message: "teapot", details: { hint: "x" } } });
  });

  it("maps the error factories", async () => {
    expect(fail(badRequest()).status).toBe(400);
    expect(fail(unauthorized()).status).toBe(401);
    expect(fail(notFound()).status).toBe(404);
    expect(fail(conflict()).status).toBe(409);
    expect(fail(tooMany()).status).toBe(429);
    await expect(fail(tooMany()).json()).resolves.toMatchObject({ error: { code: "rate_limited", details: null } });
  });

  it("maps ZodError to 422 with path/message details", async () => {
    const result = z.object({ name: z.string().min(2, "Ismingizni kiriting"), nested: z.object({ n: z.number() }) }).safeParse({ name: "a", nested: { n: "x" } });
    expect(result.success).toBe(false);
    const res = fail((result as { error: ZodError }).error);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("validation_error");
    expect(body.error.details).toEqual(expect.arrayContaining([{ path: "name", message: "Ismingizni kiriting" }, { path: "nested.n", message: expect.any(String) }]));
  });

  it("maps unknown errors to 500 without leaking the message", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = fail(new Error("database password is hunter2"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("internal_error");
    expect(JSON.stringify(body)).not.toContain("hunter2");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("success helpers", () => {
  it("ok / created wrap data", async () => {
    await expect(ok({ a: 1 }).json()).resolves.toEqual({ ok: true, data: { a: 1 } });
    const c = created({ id: "x" });
    expect(c.status).toBe(201);
    await expect(c.json()).resolves.toEqual({ ok: true, data: { id: "x" } });
  });
  it("paginated computes page count (at least 1)", async () => {
    await expect(paginated([1, 2], { page: 1, pageSize: 20, total: 45 }).json()).resolves.toMatchObject({ meta: { pages: 3 } });
    await expect(paginated([], { page: 1, pageSize: 20, total: 0 }).json()).resolves.toMatchObject({ meta: { pages: 1 } });
  });
});

describe("handler()", () => {
  it("passes through successful responses and converts thrown errors", async () => {
    const good = handler(async () => ok("fine"));
    const bad = handler(async () => {
      throw notFound("nope");
    });
    const req = new Request("http://localhost/x");
    expect((await good(req, {})).status).toBe(200);
    const res = await bad(req, {});
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toMatchObject({ error: { message: "nope" } });
  });
});
