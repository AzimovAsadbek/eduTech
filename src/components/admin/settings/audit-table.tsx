import type { listAudit } from "@/server/modules/audit/service";
import { formatAdminDate } from "@/components/admin/format";
import { Card, CardHeader } from "@/components/admin/ui/card";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/admin/ui/table";

type AuditRow = Awaited<ReturnType<typeof listAudit>>[number];

const ACTION_LABELS: Record<AuditRow["action"], string> = {
  LOGIN: "Kirish",
  LOGIN_FAILED: "Kirish xatosi",
  LOGOUT: "Chiqish",
  CREATE: "Yaratish",
  UPDATE: "Yangilash",
  DELETE: "Oʻchirish",
  STATUS_CHANGE: "Holat",
  EXPORT: "Eksport",
  UPLOAD: "Yuklash",
  NOTIFY_FAILED: "Xabar xatosi",
};

const ACTION_TONE: Partial<Record<AuditRow["action"], string>> = {
  DELETE: "text-danger",
  LOGIN_FAILED: "text-danger",
  NOTIFY_FAILED: "text-warning",
  CREATE: "text-success",
};

export function AuditTable({ rows }: { rows: AuditRow[] }) {
  return (
    <Card>
      <CardHeader title="Audit jurnali" description="Oxirgi 100 ta amal" />
      {rows.length === 0 ? (
        <EmptyState compact title="Jurnal boʻsh" />
      ) : (
        <Table>
          <THead>
            <tr>
              <Th className="w-40">Vaqt</Th>
              <Th className="w-40">Foydalanuvchi</Th>
              <Th className="w-32">Amal</Th>
              <Th>Obyekt</Th>
              <Th className="hidden lg:table-cell">Tafsilot</Th>
            </tr>
          </THead>
          <TBody>
            {rows.map((r) => (
              <Tr key={r.id}>
                <Td>
                  <span className="t-meta text-muted">{formatAdminDate(r.createdAt)}</span>
                </Td>
                <Td>
                  <span className="block truncate text-ink">{r.user?.name ?? "—"}</span>
                  {r.ip ? <span className="t-meta block text-[10px] text-muted">{r.ip}</span> : null}
                </Td>
                <Td>
                  <span className={`t-meta font-medium ${ACTION_TONE[r.action] ?? "text-ink"}`}>{ACTION_LABELS[r.action]}</span>
                </Td>
                <Td>
                  <span className="text-ink">{r.entity}</span>
                  {r.entityId ? <span className="t-meta ml-2 text-muted">#{r.entityId.slice(-8)}</span> : null}
                </Td>
                <Td className="hidden lg:table-cell">
                  <code className="t-meta block max-w-md truncate text-muted">{r.meta ? JSON.stringify(r.meta) : ""}</code>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </Card>
  );
}
