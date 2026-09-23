import { adminRoute } from "@/server/http/admin";
import { parseJson } from "@/server/http/request";
import { created } from "@/server/http/response";
import { leadNoteSchema } from "@/server/modules/leads/schema";
import { addLeadNote } from "@/server/modules/leads/service";

export const POST = adminRoute<{ id: string }>("ADMIN", async (req, { params, auth }) => {
  const { text } = await parseJson(req, leadNoteSchema);
  return created(await addLeadNote(params.id, text, auth.user.id));
});
