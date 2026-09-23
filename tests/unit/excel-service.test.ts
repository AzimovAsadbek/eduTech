import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { buildLeadsWorkbook } from "@/server/modules/excel/service";
import type { LeadListItem } from "@/server/modules/leads/service";

function lead(i: number, overrides: Partial<LeadListItem> = {}): LeadListItem {
  return {
    id: `clx${String(i).padStart(18, "0")}`,
    type: "EDUCATION",
    status: "NEW",
    name: `Talaba ${i}`,
    phone: `+99890000000${i}`,
    email: null,
    company: null,
    budget: null,
    message: i % 2 ? "Salom" : null,
    courseId: "c1",
    serviceId: null,
    branchId: null,
    interest: null,
    source: "/kurslar",
    utm: null,
    ip: null,
    telegramMessageId: null,
    telegramChatId: null,
    assignedToId: null,
    contactedAt: null,
    closedAt: null,
    createdAt: new Date(Date.UTC(2026, 8, 20, 9, 0, 0)),
    updatedAt: new Date(),
    course: { id: "c1", title: "Dasturlash", slug: "dasturlash" },
    service: null,
    branch: null,
    assignedTo: null,
    ...overrides,
  };
}

const HEADERS = ["Sana", "Turi", "Ism", "Telefon", "Kurs / Xizmat", "Filial", "Kompaniya", "Byudjet", "Status", "Manba", "Xabar", "Masʼul", "created_at", "ID"];

async function parse(buffer: Buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  return wb;
}

describe("buildLeadsWorkbook", () => {
  it("returns a Buffer containing an xlsx with a header row and no data rows for an empty list", async () => {
    const buf = await buildLeadsWorkbook([]);
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.subarray(0, 2).toString()).toBe("PK"); // zip magic
    const wb = await parse(buf);
    const ws = wb.getWorksheet("Leads");
    expect(ws).toBeDefined();
    expect(ws!.rowCount).toBe(1);
    const header = (ws!.getRow(1).values as unknown[]).slice(1);
    expect(header).toEqual(HEADERS);
  });

  it("writes one row per lead with labels and relations resolved", async () => {
    const leads = [
      lead(1),
      lead(2, { type: "MEDIA", status: "CONVERTED", courseId: null, course: null, service: { id: "s1", title: "Reels", slug: "reels" }, company: "Acme", budget: "1 mln" }),
      lead(3, { type: "GENERAL", status: "LOST", course: null, interest: "Hamkorlik", assignedTo: { id: "u1", name: "Admin" } }),
    ];
    const wb = await parse(await buildLeadsWorkbook(leads));
    const ws = wb.getWorksheet("Leads")!;
    expect(ws.rowCount).toBe(1 + leads.length);

    const row = (n: number) => (ws.getRow(n).values as unknown[]).slice(1);
    const r1 = row(2);
    expect(r1[1]).toBe("Taʼlim");
    expect(r1[2]).toBe("Talaba 1");
    expect(r1[3]).toBe("+998900000001");
    expect(r1[4]).toBe("Dasturlash");
    expect(r1[8]).toBe("Yangi");
    expect(r1[12]).toBe("2026-09-20T09:00:00.000Z");
    expect(r1[13]).toBe(leads[0].id);
    expect(r1[0]).toBeInstanceOf(Date);

    const r2 = row(3);
    expect(r2[1]).toBe("Media");
    expect(r2[4]).toBe("Reels");
    expect(r2[6]).toBe("Acme");
    expect(r2[7]).toBe("1 mln");
    expect(r2[8]).toBe("Yakunlandi");

    const r3 = row(4);
    expect(r3[1]).toBe("Umumiy");
    expect(r3[4]).toBe("Hamkorlik");
    expect(r3[8]).toBe("Rad etildi");
    expect(r3[11]).toBe("Admin");
  });

  it("freezes the header row and sets an autofilter over all rows", async () => {
    const wb = await parse(await buildLeadsWorkbook([lead(1), lead(2)]));
    const ws = wb.getWorksheet("Leads")!;
    expect(ws.views[0]).toMatchObject({ state: "frozen", ySplit: 1 });
    expect(ws.autoFilter).toBe("A1:N3");
    expect(ws.getRow(1).font?.bold).toBe(true);
  });
});
