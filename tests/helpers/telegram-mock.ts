/**
 * Tiny in-process stand-in for the Telegram Bot API.
 * Records every POST (path + JSON body), answers `{ ok: true, result: { message_id: n } }`,
 * and exposes GET /__requests (JSON list) and POST /__reset for out-of-process consumers (Playwright).
 */
import http from "node:http";
import type { AddressInfo } from "node:net";

export interface RecordedRequest {
  path: string;
  /** Bot API method name, e.g. "sendMessage" (last path segment). */
  method: string;
  body: unknown;
  receivedAt: number;
}

export interface TelegramMock {
  url: string;
  port: number;
  requests: RecordedRequest[];
  reset(): void;
  /** Resolves once a request for `method` has been recorded (or rejects after `timeoutMs`). */
  waitFor(method: string, timeoutMs?: number): Promise<RecordedRequest>;
  close(): Promise<void>;
}

export function startTelegramMock(opts: { port?: number; host?: string } = {}): Promise<TelegramMock> {
  const requests: RecordedRequest[] = [];
  let nextMessageId = 1000;

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://mock");
    const send = (status: number, payload: unknown) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(payload));
    };

    if (req.method === "GET" && url.pathname === "/__requests") return send(200, requests);
    if (req.method === "POST" && url.pathname === "/__reset") {
      requests.length = 0;
      return send(200, { ok: true });
    }
    if (req.method === "GET" && url.pathname === "/__health") return send(200, { ok: true });

    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      let body: unknown = null;
      try {
        body = raw ? JSON.parse(raw) : null;
      } catch {
        body = raw;
      }
      const method = url.pathname.split("/").filter(Boolean).pop() ?? "";
      requests.push({ path: url.pathname, method, body, receivedAt: Date.now() });
      if (method === "sendMessage") return send(200, { ok: true, result: { message_id: nextMessageId++ } });
      if (method === "editMessageText" || method === "answerCallbackQuery") return send(200, { ok: true, result: true });
      return send(200, { ok: true, result: null });
    });
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(opts.port ?? 0, opts.host ?? "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      const url = `http://${opts.host ?? "127.0.0.1"}:${port}`;
      resolve({
        url,
        port,
        requests,
        reset: () => {
          requests.length = 0;
        },
        waitFor(method, timeoutMs = 5_000) {
          return new Promise((res, rej) => {
            const started = Date.now();
            const tick = () => {
              const hit = requests.find((r) => r.method === method);
              if (hit) return res(hit);
              if (Date.now() - started > timeoutMs) return rej(new Error(`telegram mock: no ${method} within ${timeoutMs}ms`));
              setTimeout(tick, 50);
            };
            tick();
          });
        },
        close: () => new Promise<void>((res) => server.close(() => res())),
      });
    });
  });
}
