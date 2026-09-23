import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "./errors";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function created<T>(data: T) {
  return NextResponse.json({ ok: true, data }, { status: 201 });
}

export function paginated<T>(items: T[], meta: { page: number; pageSize: number; total: number }) {
  return NextResponse.json({
    ok: true,
    data: items,
    meta: { ...meta, pages: Math.max(1, Math.ceil(meta.total / meta.pageSize)) },
  });
}

/**
 * `instanceof` alone is not enough: objects cached on `globalThis` (e.g. the rate limiter) keep throwing
 * the HttpError class of a previous module instance after a dev-server reload, which turned 429s into 500s.
 */
function isHttpError(error: unknown): error is HttpError {
  if (error instanceof HttpError) return true;
  const e = error as { name?: unknown; status?: unknown; code?: unknown; message?: unknown } | null;
  return typeof e === "object" && e !== null && e.name === "HttpError" && typeof e.status === "number" && typeof e.code === "string" && typeof e.message === "string";
}

export function fail(error: unknown) {
  if (isHttpError(error)) {
    return NextResponse.json(
      { ok: false, error: { code: error.code, message: error.message, details: error.details ?? null } },
      { status: error.status, headers: error.status === 429 ? { "retry-after": "60" } : undefined },
    );
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "validation_error",
          message: "Maʼlumotlar notoʻgʻri toʻldirilgan",
          details: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        },
      },
      { status: 422 },
    );
  }
  console.error("[api] unhandled", error);
  return NextResponse.json(
    { ok: false, error: { code: "internal_error", message: "Ichki xatolik. Keyinroq urinib koʻring." } },
    { status: 500 },
  );
}

/** Wraps a route handler with uniform error handling. */
export function handler<Ctx>(fn: (req: Request, ctx: Ctx) => Promise<Response>) {
  return async (req: Request, ctx: Ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      return fail(e);
    }
  };
}
