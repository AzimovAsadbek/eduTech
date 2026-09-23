import { z } from "zod";
import { adminRoute } from "@/server/http/admin";
import { badRequest } from "@/server/http/errors";
import { limits } from "@/server/http/rate-limit";
import { parseQuery } from "@/server/http/request";
import { created, paginated } from "@/server/http/response";
import { listUploads, uploadImage } from "@/server/modules/uploads/service";

export const GET = adminRoute("EDITOR", async (req) => {
  const { page, pageSize } = parseQuery(req, z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(40) }));
  const result = await listUploads(page, pageSize);
  return paginated(result.items, { page, pageSize, total: result.total });
});

export const POST = adminRoute("EDITOR", async (req, { auth, ip }) => {
  await limits.upload().consume(ip);
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw badRequest("`file` maydoni kerak");
  const alt = typeof form?.get("alt") === "string" ? (form.get("alt") as string) : undefined;
  return created(await uploadImage(file, auth.user.id, alt));
});
