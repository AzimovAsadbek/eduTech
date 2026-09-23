import { db } from "@/server/db";
import { ok } from "@/server/http/response";

export async function GET() {
  await db.$queryRaw`SELECT 1`;
  return ok({ status: "ok", time: new Date().toISOString() });
}
