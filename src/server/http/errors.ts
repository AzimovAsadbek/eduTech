export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string = "error",
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const badRequest = (message = "Bad request", details?: unknown) =>
  new HttpError(400, message, "bad_request", details);
export const unauthorized = (message = "Unauthorized") => new HttpError(401, message, "unauthorized");
export const forbidden = (message = "Forbidden") => new HttpError(403, message, "forbidden");
export const notFound = (message = "Not found") => new HttpError(404, message, "not_found");
export const conflict = (message = "Conflict") => new HttpError(409, message, "conflict");
export const tooMany = (message = "Too many requests") => new HttpError(429, message, "rate_limited");
