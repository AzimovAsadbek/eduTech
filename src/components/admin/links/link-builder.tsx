"use client";

import { ExternalLink, Lightbulb, TriangleAlert } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { InstagramGlyph } from "@/components/brand/social-icons";
import { CHANNEL_COLORS, CHANNEL_LABELS, INSTAGRAM_PLACEMENTS, type ChannelKey } from "@/lib/channels";
import { cn } from "@/lib/utils";
import { placementLabel } from "@/server/modules/analytics/metrics";
import { classifyChannel } from "@/server/modules/attribution/channel";
import { ChannelBadge, INSTAGRAM_GRADIENT, INSTAGRAM_GRADIENT_H } from "@/components/admin/analytics/channel-badge";
import { Button } from "@/components/admin/ui/button";
import { Card, CardBody, CardHeader } from "@/components/admin/ui/card";
import { CopyButton } from "@/components/admin/ui/copy-button";
import { Input } from "@/components/admin/ui/field";
import { Segmented } from "@/components/admin/ui/segmented";
import { SelectMenu, type MenuOption } from "@/components/admin/ui/select-menu";
import { buildTaggedUrl, LINK_LOCALES, normalizePath, toUtmValue, type LinkLocale } from "./utm";

export interface LinkCourse {
  slug: string;
  title: string;
}

type Preset = "instagram" | "telegram" | "facebook" | "other";

const PRESETS: { value: Preset; label: string; dot: string }[] = [
  { value: "instagram", label: "Instagram", dot: CHANNEL_COLORS.INSTAGRAM },
  { value: "telegram", label: "Telegram", dot: CHANNEL_COLORS.TELEGRAM },
  { value: "facebook", label: "Facebook", dot: CHANNEL_COLORS.FACEBOOK },
  { value: "other", label: "Boshqa", dot: CHANNEL_COLORS.OTHER },
];

/** utm_source written for each preset ("other" takes it from the form). */
const PRESET_SOURCE: Record<Exclude<Preset, "other">, string> = { instagram: "instagram", telegram: "telegram", facebook: "facebook" };

const MEDIUM_EXAMPLES: Record<Exclude<Preset, "instagram">, string> = {
  telegram: "masalan: kanal, guruh, post",
  facebook: "masalan: post, ads, guruh",
  other: "masalan: banner, email, sms",
};

const CUSTOM = "custom";

/** Pill radio group with roving focus (←/→ move and select), wraps on narrow screens. */
function ChipGroup<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; dot?: string }[];
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const current = options.findIndex((o) => o.value === value);
    const next = (current + step + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2" onKeyDown={onKeyDown}>
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] font-semibold whitespace-nowrap transition-[background-color,border-color,color] duration-150",
              active ? "border-ink bg-ink text-white" : "bg-paper text-ink hover:bg-paper-3 border-(--line-strong)",
            )}
          >
            {o.dot ? <span aria-hidden className={cn("size-2 rounded-full", active && "ring-2 ring-white/70")} style={{ background: o.dot }} /> : null}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Step({ n, title, hint, children }: { n: number; title: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="w-full">
        <span className="flex items-center gap-2.5">
          <span aria-hidden className="t-meta bg-paper-3 text-ink grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold">
            {n}
          </span>
          <span className="font-display text-ink text-[15px] font-semibold tracking-[-0.01em]">{title}</span>
        </span>
      </legend>
      {hint ? <p className="text-muted mt-1 text-[13px] sm:pl-[34px]">{hint}</p> : null}
      <div className="mt-3 space-y-3 sm:pl-[34px]">{children}</div>
    </fieldset>
  );
}

function TagChips({ tags }: { tags: [string, string][] }) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Teglar">
      {tags.map(([k, v]) => (
        <li key={k} className="t-meta bg-paper text-muted rounded-full border border-(--line) px-2 py-0.5 text-[11px]">
          {k}=<span className="text-ink">{v}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * UTM link builder: page + language + where the link is placed + campaign → a tagged URL.
 * Every lead that arrives through it is attributed to that channel, placement and campaign.
 */
export function LinkBuilder({ origin, courses, campaigns }: { origin: string; courses: LinkCourse[]; campaigns: string[] }) {
  const listId = useId();
  const [destination, setDestination] = useState("/ig");
  const [customPath, setCustomPath] = useState("");
  const [locale, setLocale] = useState<LinkLocale>("uz");
  const [preset, setPreset] = useState<Preset>("instagram");
  const [placement, setPlacement] = useState<string>("story");
  const [source, setSource] = useState("");
  const [medium, setMedium] = useState("");
  const [campaign, setCampaign] = useState("");
  const [content, setContent] = useState("");

  const destinations: MenuOption[] = [
    { value: "/", label: "Bosh sahifa", group: "Sahifalar" },
    { value: "/ig", label: "Instagram sahifasi (/ig)", group: "Sahifalar" },
    { value: "/kurslar", label: "Kurslar", group: "Sahifalar" },
    ...courses.map((c) => ({ value: `/kurslar/${c.slug}`, label: c.title, group: "Kurslar" })),
    { value: CUSTOM, label: "Boshqa sahifa…", group: "Boshqa" },
  ];

  const path = destination === CUSTOM ? normalizePath(customPath || "/") : destination;
  const utmSource = preset === "other" ? toUtmValue(source) : PRESET_SOURCE[preset];
  const utmMedium = preset === "instagram" ? placement : toUtmValue(medium);
  const utmCampaign = toUtmValue(campaign);
  const utmContent = toUtmValue(content);
  const ready = utmSource.length > 0;
  const url = buildTaggedUrl({ origin, path, locale, source: utmSource, medium: utmMedium, campaign: utmCampaign, content: utmContent });
  // Same classifier the server uses, so the preview matches what the reports will show.
  const channel: ChannelKey = ready ? classifyChannel({ utmSource }) : "DIRECT";
  const tags: [string, string][] = (
    [
      ["utm_source", utmSource],
      ["utm_medium", utmMedium],
      ["utm_campaign", utmCampaign],
      ["utm_content", utmContent],
    ] as [string, string][]
  ).filter(([, v]) => v);
  const reportLine = [CHANNEL_LABELS[channel], channel === "INSTAGRAM" ? placementLabel(utmMedium) : utmMedium, utmCampaign].filter(Boolean).join(" · ");
  const bioUrl = buildTaggedUrl({ origin, path: "/ig", locale: "uz", source: "instagram", medium: "bio" });

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
      <Card>
        <CardHeader title="Yangi havola" description="Toʻrt qadam — tayyor havola yonida chiqadi." />
        <CardBody className="space-y-7 py-5">
          <Step n={1} title="Qaysi sahifa ochilsin?">
            <SelectMenu label="Sahifa" hideLabel value={destination} onChange={setDestination} options={destinations} className="max-w-md" />
            {destination === CUSTOM ? (
              <Input
                label="Sahifa manzili"
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
                placeholder="/media/xizmatlar/reels"
                hint={`Havolada: ${path}`}
                wrapClassName="max-w-md"
                spellCheck={false}
                autoComplete="off"
              />
            ) : null}
          </Step>

          <Step n={2} title="Sahifa tili">
            <Segmented<LinkLocale> label="Sahifa tili" value={locale} onChange={setLocale} options={LINK_LOCALES} />
          </Step>

          <Step n={3} title="Havolani qayerga qoʻyasiz?">
            <ChipGroup<Preset> label="Kanal" value={preset} onChange={setPreset} options={PRESETS} />
            {preset === "instagram" ? (
              <div className="bg-paper-2 rounded-[12px] border border-(--line) p-3">
                <p className="t-eyebrow text-muted mb-2.5 text-[10px]">Instagramda joylashuv</p>
                <ChipGroup<string>
                  label="Instagramda joylashuv"
                  value={placement}
                  onChange={setPlacement}
                  options={INSTAGRAM_PLACEMENTS.map((p) => ({ value: p.value, label: p.label }))}
                />
              </div>
            ) : (
              <div className="grid max-w-xl gap-3 sm:grid-cols-2">
                {preset === "other" ? (
                  <Input
                    label="Manba (utm_source)"
                    required
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="masalan: kun_uz, afisha"
                    hint={utmSource ? `Havolada: ${utmSource}` : "Sayt, ilova yoki hamkor nomi"}
                    spellCheck={false}
                    autoComplete="off"
                  />
                ) : null}
                <Input
                  label="Joylashuv (ixtiyoriy)"
                  value={medium}
                  onChange={(e) => setMedium(e.target.value)}
                  placeholder={MEDIUM_EXAMPLES[preset]}
                  hint={utmMedium ? `Havolada: ${utmMedium}` : "utm_medium"}
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>
            )}
          </Step>

          <Step n={4} title="Kampaniya" hint="Bir xil nom — bitta qator hisobotda. Masalan, kuzgi qabul uchun hamma joyda «kuz-qabul».">
            <div className="grid max-w-xl gap-3 sm:grid-cols-2">
              <Input
                label="Kampaniya nomi"
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                placeholder="kuz-qabul"
                list={campaigns.length ? listId : undefined}
                hint={utmCampaign ? `Havolada: ${utmCampaign}` : "ixtiyoriy, lekin tavsiya etiladi"}
                spellCheck={false}
                autoComplete="off"
              />
              <Input
                label="Kontent (ixtiyoriy)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="video-1, banner-a"
                hint={utmContent ? `Havolada: ${utmContent}` : "bir kampaniyadagi postlarni ajratadi"}
                spellCheck={false}
                autoComplete="off"
              />
            </div>
            {campaigns.length ? (
              <datalist id={listId}>
                {campaigns.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            ) : null}
          </Step>
        </CardBody>
      </Card>

      <div className="space-y-4 xl:sticky xl:top-24">
        <Card>
          <CardHeader title="Tayyor havola" actions={ready ? <ChannelBadge channel={channel} /> : null} />
          <CardBody className="space-y-4">
            <p className="bg-paper-2 text-ink rounded-[10px] border border-(--line) p-3 font-mono text-[13px] leading-relaxed break-all" aria-live="polite">
              {url}
            </p>
            {ready ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <CopyButton value={url} toastDescription="Endi uni post, stories yoki bioga qoʻying.">
                    Havolani nusxalash
                  </CopyButton>
                  <Button href={url} variant="outline" size="sm" icon={<ExternalLink />}>
                    Ochib koʻrish
                  </Button>
                </div>
                <TagChips tags={tags} />
                <p className="text-muted text-[13px]">
                  Hisobotda: <span className="text-ink font-semibold">{reportLine}</span>
                </p>
              </>
            ) : (
              <p className="bg-orange-soft text-orange-deep flex items-start gap-2 rounded-[10px] px-3 py-2.5 text-[13px]">
                <TriangleAlert size={15} className="mt-0.5 shrink-0" aria-hidden />
                Manba (utm_source) kiriting — usiz havola kanalga bogʻlanmaydi.
              </p>
            )}
          </CardBody>
        </Card>

        <Card className="relative overflow-hidden">
          <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: INSTAGRAM_GRADIENT_H }} />
          <CardBody className="space-y-3 pt-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-[11px] text-white" style={{ background: INSTAGRAM_GRADIENT }}>
                <InstagramGlyph size={20} />
              </span>
              <div className="min-w-0">
                <p className="font-display text-ink text-[15px] font-semibold tracking-[-0.01em]">Instagram bio uchun</p>
                <p className="t-meta text-muted">bir marta qoʻying — doim ishlaydi</p>
              </div>
            </div>
            <p className="bg-paper-2 text-ink rounded-[10px] border border-(--line) p-3 font-mono text-[13px] break-all">{bioUrl}</p>
            <CopyButton value={bioUrl} variant="secondary" toastTitle="Bio havolasi nusxalandi" toastDescription="Instagram → Profilni tahrirlash → Havolalar.">
              Bio havolasini nusxalash
            </CopyButton>
            <p className="text-muted text-[13px] leading-relaxed">
              <span className="text-ink font-mono">/ig</span> sahifasi kurslar, 30 soniyalik ariza va aloqa tugmalarini bitta ekranda koʻrsatadi. Bio orqali
              kelgan har bir tashrif va ariza alohida hisoblanadi.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            <p className="font-display text-ink flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em]">
              <Lightbulb size={16} className="text-orange" aria-hidden />
              Nega havolani belgilash kerak?
            </p>
            <ul className="text-muted space-y-2 text-[13px] leading-relaxed">
              <li>
                <span className="text-ink font-semibold">Qayerdan kelgani aniq.</span> Bio, stories, reels yoki reklama — har bir tashrif va ariza oʻz joyiga
                yoziladi.
              </li>
              <li>
                <span className="text-ink font-semibold">Qaysi kampaniya oʻquvchi olib keldi.</span> Faqat arizalar emas, kursga yozilganlar ham kanal va
                kampaniya boʻyicha koʻrinadi.
              </li>
              <li>
                <span className="text-ink font-semibold">Tegsiz havola «belgilanmagan».</span> Instagram ilovasi koʻpincha manbani yashiradi — teg qoʻyilmasa,
                joylashuv va kampaniya nomaʼlum qoladi.
              </li>
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
