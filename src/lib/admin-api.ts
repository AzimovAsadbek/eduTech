/**
 * Typed fetch client for /api/v1/admin/*.
 * Client-safe: no server imports. Every call is same-origin and JSON unless `upload` is used.
 */

export interface ApiIssue {
  path: string;
  message: string;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  pages: number;
}

export interface ApiResult<T> {
  data: T;
  meta?: PageMeta;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ApiIssue[];

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = Array.isArray(details) ? (details as ApiIssue[]).filter((d) => d && typeof d.path === "string") : [];
  }

  /** Field-level messages keyed by dotted path — handy for `setError`. */
  get fieldErrors(): Record<string, string> {
    return Object.fromEntries(this.details.map((d) => [d.path, d.message]));
  }
}

const BASE = "/api/v1/admin";

type Query = Record<string, string | number | boolean | null | undefined>;

export function toQueryString(query?: Query): string {
  if (!query) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

interface ErrorBody {
  ok: false;
  error: { code: string; message: string; details?: unknown };
}
interface OkBody<T> {
  ok: true;
  data: T;
  meta?: PageMeta;
}

async function parseBody<T>(res: Response): Promise<ApiResult<T>> {
  let body: OkBody<T> | ErrorBody | null = null;
  try {
    body = (await res.json()) as OkBody<T> | ErrorBody;
  } catch {
    body = null;
  }
  if (!res.ok || !body || body.ok === false) {
    const err = body && body.ok === false ? body.error : null;
    throw new ApiError(res.status, err?.code ?? "http_error", err?.message ?? `Soʻrov muvaffaqiyatsiz (${res.status})`, err?.details);
  }
  return { data: body.data, meta: body.meta };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      credentials: "same-origin",
      headers: { accept: "application/json", ...(init.body ? { "content-type": "application/json" } : {}), ...(init.headers ?? {}) },
      ...init,
    });
  } catch {
    throw new ApiError(0, "network_error", "Tarmoq xatosi. Internet aloqasini tekshiring.");
  }
  return parseBody<T>(res);
}

export const adminApi = {
  get<T>(path: string, query?: Query) {
    return request<T>(`${path}${toQueryString(query)}`, { method: "GET" });
  },
  post<T>(path: string, body?: unknown) {
    return request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });
  },
  patch<T>(path: string, body: unknown) {
    return request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
  },
  delete<T>(path: string) {
    return request<T>(path, { method: "DELETE" });
  },
  /** Multipart upload with progress (XHR — fetch has no upload progress). */
  upload<T>(path: string, form: FormData, onProgress?: (fraction: number) => void): Promise<ApiResult<T>> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${BASE}${path}`);
      xhr.withCredentials = true;
      xhr.responseType = "text";
      xhr.setRequestHeader("accept", "application/json");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
      };
      xhr.onerror = () => reject(new ApiError(0, "network_error", "Yuklashda tarmoq xatosi"));
      xhr.onload = () => {
        const res = new Response(xhr.responseText, { status: xhr.status, headers: { "content-type": "application/json" } });
        parseBody<T>(res).then(resolve, reject);
      };
      xhr.send(form);
    });
  },
};

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}

export function errorMessage(e: unknown, fallback = "Xatolik yuz berdi"): string {
  if (isApiError(e)) return e.message;
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}
