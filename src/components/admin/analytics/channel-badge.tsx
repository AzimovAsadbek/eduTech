import { CHANNEL_COLORS, CHANNEL_LABELS, type ChannelKey } from "@/lib/channels";
import { cn } from "@/lib/utils";

/** Instagram's brand gradient — used sparingly as an accent (never as a data colour). */
export const INSTAGRAM_GRADIENT = "linear-gradient(45deg, #FEDA75 0%, #FA7E1E 22%, #D62976 50%, #962FBF 76%, #4F5BD5 100%)";
export const INSTAGRAM_GRADIENT_H = "linear-gradient(90deg, #FA7E1E 0%, #D62976 40%, #962FBF 72%, #4F5BD5 100%)";

/** "story · kuz_qabul" — placement and campaign of a lead, when tagged. */
export function channelDetail(medium?: string | null, campaign?: string | null): string | null {
  const parts = [medium, campaign].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

/** Channel pill: colour dot + label. The dot carries identity; the text stays in ink. */
export function ChannelBadge({ channel, detail, className }: { channel: ChannelKey; detail?: string | null; className?: string }) {
  return (
    <span
      title={detail ?? undefined}
      className={cn(
        "bg-paper text-ink inline-flex h-6 max-w-full items-center gap-1.5 rounded-full border border-(--line) px-2.5 text-xs font-medium whitespace-nowrap",
        className,
      )}
    >
      <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: CHANNEL_COLORS[channel] }} />
      <span className="truncate">{CHANNEL_LABELS[channel]}</span>
      {detail ? <span className="sr-only">, {detail}</span> : null}
    </span>
  );
}
