import { describe, expect, it } from "vitest";
import { formatLeadMessage, leadKeyboard, parseCallback, STATUS_LABELS, type LeadForTelegram } from "@/server/modules/telegram/format";

const createdAt = new Date("2026-09-23T10:30:00Z");

const eduLead: LeadForTelegram = {
  id: "clx1234567890abcdefgh",
  type: "EDUCATION",
  status: "NEW",
  name: "Ali <b>Valiyev</b>",
  phone: "+998901234567",
  message: "Savol: 1 < 2 & \"quotes\"",
  source: "course:dasturlash",
  createdAt,
  course: { title: "Dasturlash & Web" },
  branch: { name: "Markaz" },
};

const mediaLead: LeadForTelegram = {
  id: "clxmedia0000000000001",
  type: "MEDIA",
  status: "IN_PROGRESS",
  name: "Bobur",
  phone: "+998901112233",
  company: "Acme <Corp>",
  budget: "3–10 mln soʻm",
  message: "Reels kerak",
  email: "bobur@acme.uz",
  createdAt,
  service: { title: "Reels Production" },
};

describe("formatLeadMessage", () => {
  it("escapes HTML in every user-supplied value", () => {
    const msg = formatLeadMessage(eduLead);
    expect(msg).toContain("Ali &lt;b&gt;Valiyev&lt;/b&gt;");
    expect(msg).toContain("1 &lt; 2 &amp; &quot;quotes&quot;");
    expect(msg).toContain("Dasturlash &amp; Web");
    expect(msg).not.toContain("<b>Valiyev</b>");
  });

  it("renders EDUCATION lines: header, Name, Phone, Course, Branch, Comment, Status, short id", () => {
    const msg = formatLeadMessage(eduLead);
    expect(msg.startsWith("🔔 <b>NEW LEAD</b>")).toBe(true);
    expect(msg).toContain("<b>Type:</b> EDUCATION");
    expect(msg).toContain("<b>Name:</b> ");
    expect(msg).toContain("<b>Phone:</b> +998901234567");
    expect(msg).toContain("<b>Course:</b> Dasturlash &amp; Web");
    expect(msg).toContain("<b>Branch:</b> Markaz");
    expect(msg).toContain("<b>Comment:</b> ");
    expect(msg).toContain("<b>Source:</b> course:dasturlash");
    expect(msg).toContain("<b>Time:</b> ");
    expect(msg).toContain(`🆕 <b>Status:</b> ${STATUS_LABELS.NEW}`);
    expect(msg).toContain("<code>#0abcdefgh</code>".replace("0abcdefgh", eduLead.id.slice(-8)));
    expect(msg).not.toContain("<b>Company:</b>");
    expect(msg).not.toContain("<b>Budget:</b>");
  });

  it("renders MEDIA lines: header, Company, Service, Budget, Message, Email", () => {
    const msg = formatLeadMessage(mediaLead);
    expect(msg.startsWith("🔔 <b>NEW MEDIA LEAD</b>")).toBe(true);
    expect(msg).toContain("<b>Company:</b> Acme &lt;Corp&gt;");
    expect(msg).toContain("<b>Service:</b> Reels Production");
    expect(msg).toContain("<b>Budget:</b> 3–10 mln soʻm");
    expect(msg).toContain("<b>Message:</b> Reels kerak");
    expect(msg).toContain("<b>Email:</b> bobur@acme.uz");
    expect(msg).toContain(`⏳ <b>Status:</b> ${STATUS_LABELS.IN_PROGRESS}`);
    expect(msg).not.toContain("<b>Course:</b>");
    expect(msg).not.toContain("<b>Comment:</b>");
  });

  it("uses NEW REQUEST header and interest as Course for GENERAL leads", () => {
    const msg = formatLeadMessage({ ...eduLead, type: "GENERAL", course: null, branch: null, interest: "Hamkorlik" });
    expect(msg.startsWith("🔔 <b>NEW REQUEST</b>")).toBe(true);
    expect(msg).toContain("<b>Course:</b> Hamkorlik");
  });

  it("omits empty optional lines", () => {
    const msg = formatLeadMessage({ id: "clx000000000000000000", type: "GENERAL", status: "NEW", name: "X Y", phone: "+998", createdAt });
    expect(msg).not.toContain("<b>Course:</b>");
    expect(msg).not.toContain("<b>Email:</b>");
    expect(msg).not.toContain("<b>Source:</b>");
  });

  it("appends the escaped actor label next to the status", () => {
    const msg = formatLeadMessage(eduLead, "@ad<min>");
    expect(msg).toContain(`<b>Status:</b> ${STATUS_LABELS.NEW} <i>(@ad&lt;min&gt;)</i>`);
  });
});

describe("leadKeyboard", () => {
  it("produces a 2x2 inline keyboard with lead:<id>:<STATUS> callback data", () => {
    const kb = leadKeyboard("clx1234567890abcdefgh");
    expect(kb.inline_keyboard).toHaveLength(2);
    expect(kb.inline_keyboard[0]).toHaveLength(2);
    const data = kb.inline_keyboard.flat().map((b) => b.callback_data);
    expect(data).toEqual([
      "lead:clx1234567890abcdefgh:CONTACTED",
      "lead:clx1234567890abcdefgh:IN_PROGRESS",
      "lead:clx1234567890abcdefgh:CONVERTED",
      "lead:clx1234567890abcdefgh:LOST",
    ]);
    // Telegram limits callback_data to 64 bytes
    for (const d of data) expect(Buffer.byteLength(d)).toBeLessThanOrEqual(64);
  });

  it("round-trips through parseCallback", () => {
    for (const btn of leadKeyboard("clx1234567890abcdefgh").inline_keyboard.flat()) {
      expect(parseCallback(btn.callback_data)).toEqual({ leadId: "clx1234567890abcdefgh", status: expect.any(String) });
    }
  });
});

describe("parseCallback", () => {
  it("accepts well-formed data", () => {
    expect(parseCallback("lead:abc123:CONTACTED")).toEqual({ leadId: "abc123", status: "CONTACTED" });
    expect(parseCallback("lead:abc_123-XYZ:NEW")).toEqual({ leadId: "abc_123-XYZ", status: "NEW" });
  });
  it("rejects unknown statuses, short ids, wrong prefix and injection attempts", () => {
    expect(parseCallback("lead:abc123:DONE")).toBeNull();
    expect(parseCallback("lead:abc:CONTACTED")).toBeNull();
    expect(parseCallback("user:abc123:CONTACTED")).toBeNull();
    expect(parseCallback("lead:abc123:CONTACTED;DROP")).toBeNull();
    expect(parseCallback("lead:abc 123:CONTACTED")).toBeNull();
    expect(parseCallback("")).toBeNull();
    expect(parseCallback(`lead:${"a".repeat(65)}:CONTACTED`)).toBeNull();
  });
});
