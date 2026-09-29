import type { Channel, LeadStatus, LeadType } from "@prisma/client";
import { CHANNEL_LABELS } from "@/lib/channels";
import { escapeHtml } from "@/lib/sanitize";

export interface LeadForTelegram {
  id: string;
  type: LeadType;
  status: LeadStatus;
  name: string;
  phone: string;
  email?: string | null;
  company?: string | null;
  budget?: string | null;
  message?: string | null;
  interest?: string | null;
  source?: string | null;
  channel?: Channel | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  createdAt: Date;
  course?: { title: string } | null;
  service?: { title: string } | null;
  branch?: { name: string } | null;
}

export const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "Yangi",
  CONTACTED: "Bogʻlanildi",
  IN_PROGRESS: "Jarayonda",
  CONVERTED: "Yakunlandi",
  LOST: "Rad etildi",
};

const STATUS_EMOJI: Record<LeadStatus, string> = {
  NEW: "🆕",
  CONTACTED: "📞",
  IN_PROGRESS: "⏳",
  CONVERTED: "✅",
  LOST: "❌",
};

const fmtTime = (d: Date) =>
  new Intl.DateTimeFormat("uz-UZ", {
    timeZone: "Asia/Tashkent",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);

const CHANNEL_EMOJI: Record<Channel, string> = {
  INSTAGRAM: "📸",
  FACEBOOK: "📘",
  TELEGRAM: "✈️",
  GOOGLE: "🔎",
  YANDEX: "🔎",
  YOUTUBE: "▶️",
  DIRECT: "🔗",
  REFERRAL: "🌐",
  OTHER: "•",
};

/** "📸 Instagram · story · autumn_intake" — shown so staff can prioritise and follow up per channel. */
export function formatChannel(lead: Pick<LeadForTelegram, "channel" | "utmMedium" | "utmCampaign">): string | null {
  if (!lead.channel) return null;
  return [`${CHANNEL_EMOJI[lead.channel]} ${CHANNEL_LABELS[lead.channel]}`, lead.utmMedium, lead.utmCampaign].filter(Boolean).join(" · ");
}

const line = (label: string, value?: string | null) => (value ? `<b>${label}:</b> ${escapeHtml(value)}\n` : "");

/** Telegram HTML message for a lead; safe against injection because every value is escaped. */
export function formatLeadMessage(lead: LeadForTelegram, actor?: string): string {
  const header =
    lead.type === "MEDIA" ? "🔔 <b>NEW MEDIA LEAD</b>" : lead.type === "EDUCATION" ? "🔔 <b>NEW LEAD</b>" : "🔔 <b>NEW REQUEST</b>";

  let body = `${header}\n\n`;
  body += line("Type", lead.type);
  if (lead.type === "MEDIA") {
    body += line("Company", lead.company);
    body += line("Name", lead.name);
    body += line("Phone", lead.phone);
    body += line("Service", lead.service?.title);
    body += line("Budget", lead.budget);
    body += line("Message", lead.message);
  } else {
    body += line("Name", lead.name);
    body += line("Phone", lead.phone);
    body += line("Course", lead.course?.title ?? lead.interest);
    body += line("Branch", lead.branch?.name);
    body += line("Comment", lead.message);
  }
  body += line("Email", lead.email);
  body += line("Channel", formatChannel(lead));
  body += line("Source", lead.source);
  body += line("Time", fmtTime(lead.createdAt));
  body += `\n${STATUS_EMOJI[lead.status]} <b>Status:</b> ${STATUS_LABELS[lead.status]}`;
  if (actor) body += ` <i>(${escapeHtml(actor)})</i>`;
  body += `\n<code>#${lead.id.slice(-8)}</code>`;
  return body;
}

export function leadKeyboard(leadId: string) {
  const btn = (text: string, status: LeadStatus) => ({ text, callback_data: `lead:${leadId}:${status}` });
  return {
    inline_keyboard: [
      [btn("📞 Contacted", "CONTACTED"), btn("⏳ In Progress", "IN_PROGRESS")],
      [btn("✅ Completed", "CONVERTED"), btn("❌ Rejected", "LOST")],
    ],
  };
}

export function parseCallback(data: string): { leadId: string; status: LeadStatus } | null {
  const m = /^lead:([A-Za-z0-9_-]{6,64}):(NEW|CONTACTED|IN_PROGRESS|CONVERTED|LOST)$/.exec(data);
  if (!m) return null;
  return { leadId: m[1], status: m[2] as LeadStatus };
}
