"use client";

import { Play } from "lucide-react";
import { useState } from "react";
import { PlaceholderImage } from "@/components/ui/placeholder-image";

function toEmbed(url: string): { kind: "iframe" | "file"; src: string } {
  const yt = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/.exec(url);
  if (yt) return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0` };
  const vimeo = /vimeo\.com\/(\d+)/.exec(url);
  if (vimeo) return { kind: "iframe", src: `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1` };
  return { kind: "file", src: url };
}

/** Click-to-play: nothing loads until the user asks — better LCP and privacy. */
export function VideoEmbed({ url, title, poster }: { url: string; title: string; poster?: string | null }) {
  const [playing, setPlaying] = useState(false);
  const embed = toEmbed(url);
  return (
    <div className="relative aspect-video overflow-hidden rounded-(--radius-xl) bg-ink-2">
      {playing ? (
        embed.kind === "iframe" ? (
          <iframe src={embed.src} title={title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="absolute inset-0 size-full" />
        ) : (
          <video src={embed.src} controls autoPlay playsInline className="absolute inset-0 size-full object-cover" />
        )
      ) : (
        <button type="button" onClick={() => setPlaying(true)} aria-label={`${title} — videoni ijro etish`} className="group absolute inset-0">
          <PlaceholderImage src={poster} alt="" className="absolute inset-0" sizes="100vw" />
          <span className="absolute inset-0 grid place-items-center bg-black/20 transition-colors group-hover:bg-black/30">
            <span className="glass grid size-20 place-items-center rounded-full text-white transition-transform group-hover:scale-110">
              <Play size={28} fill="currentColor" />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
