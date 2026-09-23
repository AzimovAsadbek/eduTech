import { adminRoute } from "@/server/http/admin";
import { parseQuery } from "@/server/http/request";
import { audit } from "@/server/modules/audit/service";
import { buildLeadsWorkbook } from "@/server/modules/excel/service";
import { leadFilterSchema } from "@/server/modules/leads/schema";
import { findLeadsForExport } from "@/server/modules/leads/service";

export const GET = adminRoute("ADMIN", async (req, { auth, ip }) => {
  const filter = parseQuery(req, leadFilterSchema.omit({ page: true, pageSize: true }));
  const leads = await findLeadsForExport(filter);
  const buffer = await buildLeadsWorkbook(leads);
  await audit({ userId: auth.user.id, action: "EXPORT", entity: "Lead", ip, meta: { rows: leads.length, filter: JSON.parse(JSON.stringify(filter)) } });
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="edutech-leads-${stamp}.xlsx"`,
      "cache-control": "no-store",
    },
  });
});
