import { ChevronRight, Link2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Lead } from "@prisma/client";
import { placementLabel } from "@/server/modules/analytics/metrics";
import { ChannelBadge } from "@/components/admin/analytics/channel-badge";
import { describeUserAgent } from "@/components/admin/analytics/format";
import { Card, CardBody, CardHeader } from "@/components/admin/ui/card";
import { DateText } from "@/components/admin/ui/date-text";

type SourceFields = Pick<
  Lead,
  "channel" | "utmSource" | "utmMedium" | "utmCampaign" | "utmContent" | "landingPage" | "referrer" | "sessionId" | "source" | "utm"
>;

interface Snapshot {
  firstAt: number | null;
  lastAt: number | null;
  userAgent: string | null;
}

/** Reads the raw attribution snapshot defensively: `utm` is free-form JSON (older leads may lack fields). */
function readSnapshot(utm: Lead["utm"]): Snapshot {
  const obj = utm && typeof utm === "object" && !Array.isArray(utm) ? (utm as Record<string, unknown>) : {};
  const at = (touch: unknown) => {
    const v = touch && typeof touch === "object" && !Array.isArray(touch) ? (touch as Record<string, unknown>).at : null;
    return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;
  };
  return { firstAt: at(obj.first), lastAt: at(obj.last), userAgent: typeof obj.userAgent === "string" && obj.userAgent ? obj.userAgent : null };
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 py-2 text-sm">
      <dt className="t-meta text-muted pt-0.5">{label}</dt>
      <dd className="text-ink min-w-0 break-words">{children}</dd>
    </div>
  );
}

const mono = "font-mono text-xs";

/** Where the lead came from: channel, placement, campaign, landing page, device and the raw snapshot. */
export function LeadSourceCard({ lead }: { lead: SourceFields }) {
  const snap = readSnapshot(lead.utm);
  const device = describeUserAgent(snap.userAgent);
  const tagged = Boolean(lead.utmSource || lead.utmMedium || lead.utmCampaign);
  const sameTouch = snap.firstAt !== null && snap.firstAt === snap.lastAt;
  const hasRaw = lead.utm !== null && typeof lead.utm === "object" && Object.keys(lead.utm as object).length > 0;

  return (
    <Card>
      <CardHeader title="Manba" description="Lid qayerdan kelgani" />
      <CardBody className="pt-2">
        <dl className="divide-y divide-(--line)">
          <Row label="Kanal">
            <Link href={`/admin/leads?channel=${lead.channel}`} className="inline-flex rounded-full" title="Shu kanal lidlari">
              <ChannelBadge channel={lead.channel} className="hover:border-(--line-strong)" />
            </Link>
          </Row>
          {lead.utmMedium ? (
            <Row label="Joylashuv">
              {placementLabel(lead.utmMedium)}
              {placementLabel(lead.utmMedium) !== lead.utmMedium ? <span className={`${mono} text-muted ml-1.5`}>{lead.utmMedium}</span> : null}
            </Row>
          ) : null}
          {lead.utmCampaign ? (
            <Row label="Kampaniya">
              <Link
                href={`/admin/leads?channel=${lead.channel}&campaign=${encodeURIComponent(lead.utmCampaign)}`}
                className={`${mono} text-ink hover:text-orange font-medium underline-offset-4 hover:underline`}
                title="Shu kampaniya lidlari"
              >
                {lead.utmCampaign}
              </Link>
            </Row>
          ) : null}
          {lead.utmContent ? (
            <Row label="Kontent">
              <span className={mono}>{lead.utmContent}</span>
            </Row>
          ) : null}
          {lead.utmSource ? (
            <Row label="utm_source">
              <span className={mono}>{lead.utmSource}</span>
            </Row>
          ) : null}
          {lead.landingPage ? (
            <Row label="Kirish sahifasi">
              {/* Visitor-supplied value: only same-site paths become links. */}
              {/^\/(?!\/)/.test(lead.landingPage) ? (
                <a href={lead.landingPage} target="_blank" rel="noopener noreferrer" className={`${mono} hover:text-orange`}>
                  {lead.landingPage}
                </a>
              ) : (
                <span className={mono}>{lead.landingPage}</span>
              )}
            </Row>
          ) : null}
          {lead.referrer ? (
            <Row label="Yoʻnaltiruvchi">
              <span className={mono}>{lead.referrer}</span>
            </Row>
          ) : null}
          {device ? <Row label="Qurilma">{device}</Row> : null}
          <Row label="Forma">
            <span className={mono}>{lead.source ?? "—"}</span>
          </Row>
          {snap.firstAt !== null ? (
            <Row label={sameTouch ? "Tashrif" : "Birinchi tashrif"}>
              <DateText value={new Date(snap.firstAt)} className={mono} />
            </Row>
          ) : null}
          {snap.lastAt !== null && !sameTouch ? (
            <Row label="Oxirgi tashrif">
              <DateText value={new Date(snap.lastAt)} className={mono} />
            </Row>
          ) : null}
          {lead.sessionId ? (
            <Row label="Sessiya">
              <span className={`${mono} text-muted`}>{lead.sessionId}</span>
            </Row>
          ) : null}
        </dl>

        {!tagged ? (
          <p className="bg-paper-2 text-muted mt-3 flex items-start gap-2 rounded-[10px] px-3 py-2.5 text-[13px]">
            <Link2 size={15} className="text-orange mt-0.5 shrink-0" aria-hidden />
            <span>
              Havola UTM teglarisiz ochilgan.{" "}
              <Link href="/admin/links" className="text-ink hover:text-orange font-semibold underline-offset-4 hover:underline">
                Tegli havola yarating
              </Link>{" "}
              — joylashuv va kampaniya ham koʻrinadi.
            </span>
          </p>
        ) : null}

        {hasRaw ? (
          <details className="group mt-3 border-t border-(--line) pt-3">
            <summary className="t-meta text-muted hover:text-ink flex cursor-pointer list-none items-center gap-1 select-none [&::-webkit-details-marker]:hidden">
              <ChevronRight size={14} aria-hidden className="transition-transform group-open:rotate-90" />
              Xom maʼlumot
            </summary>
            <pre className="bg-paper-2 text-ink mt-2 max-h-72 overflow-auto rounded-[10px] p-3 font-mono text-[11px] leading-relaxed break-all whitespace-pre-wrap">
              {JSON.stringify(lead.utm, null, 2)}
            </pre>
          </details>
        ) : null}
      </CardBody>
    </Card>
  );
}
