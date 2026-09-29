import "server-only";
import ExcelJS from "exceljs";
import type { LeadListItem } from "@/server/modules/leads/service";
import { CHANNEL_LABELS } from "@/lib/channels";
import { STATUS_LABELS } from "@/server/modules/telegram/format";

const TYPE_LABELS: Record<string, string> = { EDUCATION: "Taʼlim", MEDIA: "Media", GENERAL: "Umumiy" };

/** Builds the leads report workbook. Pure: takes rows, returns a buffer. */
export async function buildLeadsWorkbook(leads: LeadListItem[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "EduTech Admin";
  wb.created = new Date();
  const ws = wb.addWorksheet("Leads", { views: [{ state: "frozen", ySplit: 1 }] });

  ws.columns = [
    { header: "Sana", key: "date", width: 18 },
    { header: "Turi", key: "type", width: 12 },
    { header: "Ism", key: "name", width: 24 },
    { header: "Telefon", key: "phone", width: 18 },
    { header: "Kurs / Xizmat", key: "subject", width: 28 },
    { header: "Filial", key: "branch", width: 18 },
    { header: "Kompaniya", key: "company", width: 22 },
    { header: "Byudjet", key: "budget", width: 14 },
    { header: "Status", key: "status", width: 14 },
    { header: "Kanal", key: "channel", width: 16 },
    { header: "Joylashuv (utm_medium)", key: "utmMedium", width: 18 },
    { header: "Kampaniya (utm_campaign)", key: "utmCampaign", width: 22 },
    { header: "utm_source", key: "utmSource", width: 14 },
    { header: "Kirish sahifasi", key: "landingPage", width: 26 },
    { header: "Forma", key: "source", width: 24 },
    { header: "Xabar", key: "message", width: 40 },
    { header: "Masʼul", key: "assignee", width: 18 },
    { header: "created_at", key: "createdAt", width: 22 },
    { header: "ID", key: "id", width: 28 },
  ];

  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF6B1A" } };
  header.alignment = { vertical: "middle" };
  header.height = 22;

  for (const lead of leads) {
    ws.addRow({
      date: lead.createdAt,
      type: TYPE_LABELS[lead.type] ?? lead.type,
      name: lead.name,
      phone: lead.phone,
      subject: lead.course?.title ?? lead.service?.title ?? lead.interest ?? "",
      branch: lead.branch?.name ?? "",
      company: lead.company ?? "",
      budget: lead.budget ?? "",
      status: STATUS_LABELS[lead.status],
      channel: CHANNEL_LABELS[lead.channel],
      utmMedium: lead.utmMedium ?? "",
      utmCampaign: lead.utmCampaign ?? "",
      utmSource: lead.utmSource ?? "",
      landingPage: lead.landingPage ?? "",
      source: lead.source ?? "",
      message: lead.message ?? "",
      assignee: lead.assignedTo?.name ?? "",
      createdAt: lead.createdAt.toISOString(),
      id: lead.id,
    });
  }
  ws.getColumn("date").numFmt = "dd.mm.yyyy hh:mm";
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, leads.length + 1), column: ws.columns.length } };

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
