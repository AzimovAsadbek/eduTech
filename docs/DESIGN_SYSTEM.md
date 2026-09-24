# EduTech Design System

Direction: **Premium EdTech × Creative Studio × Editorial × Subtle Glass**.
Two worlds share one system: **EDU** (white, warm, orange energy) and **MEDIA** (deep brand green, cinematic, same orange). Colours come straight from the official logo files: orange `#FF6B1A`, charcoal `#3A3A39`, green `#00382C`.

## Logo

The lockup (E-mark + "DU TECH" + "ZAMONAVIY KASBLAR") is traced 1:1 from the brand PDFs into `src/components/brand/logo-data.ts` and rendered by `<Logo>` / `<LogoMark>` (`src/components/brand/logo.tsx`). On light surfaces the mark is fully orange and the wordmark charcoal; on dark surfaces the extruded "L" and wordmark turn white (`tone="dark"`). Minimum height: 24px without tagline, 40px with tagline. Static assets: `public/brand/logo-light.svg`, `public/brand/logo-dark.svg`, `public/icon.svg`, `public/apple-icon.svg`.

## Colour

| Token | Value | Use |
|---|---|---|
| `--c-orange` | `#FF6B1A` | Primary action, accents, ambient glow |
| `--c-orange-deep` | `#E5560A` | Hover / pressed |
| `--c-orange-soft` | `#FFF1E8` | Tints, chips, section washes |
| `--c-ink` | `#111111` | Headings, primary text |
| `--c-ink-2` | `#1A1A1A` | Media world surfaces |
| `--c-ink-3` | `#2A2A2A` | Media world elevated surfaces |
| `--c-muted` | `#737373` | Secondary text |
| `--c-line` | `rgba(17,17,17,.08)` | Hairlines |
| `--c-paper` | `#FFFFFF` | Page background |
| `--c-paper-2` | `#FAFAF9` | Alternate section background |

Contrast: orange text on white is reserved for ≥ 24px display sizes; body-size orange is only used on dark surfaces or as a background with white/ink text.

## Typography

| Role | Font | Size (desktop / mobile) | Tracking |
|---|---|---|---|
| Display | Bricolage Grotesque 700, opsz 96 | clamp(3rem, 7vw, 6.5rem) | -0.03em |
| H1 | Bricolage Grotesque 600 | clamp(2.5rem, 5vw, 4.25rem) | -0.025em |
| H2 | Bricolage Grotesque 600 | clamp(2rem, 3.6vw, 3rem) | -0.02em |
| H3 | Bricolage Grotesque 600 | clamp(1.375rem, 2vw, 1.75rem) | -0.015em |
| Eyebrow | JetBrains Mono 500, uppercase | 0.75rem | 0.14em |
| Body-L | Manrope 400 | 1.125rem / 1.6 | 0 |
| Body | Manrope 400 | 1rem / 1.6 | 0 |
| Caption | Manrope 500 | 0.875rem | 0 |
| Metadata | JetBrains Mono 400 | 0.75rem | 0.04em |

Headings never repeat the same size treatment in adjacent sections; the editorial rhythm alternates left-aligned H2 + eyebrow, centred display statements and split "index" headings.

## Spacing & Layout

* 4px base. Scale: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 · 160.
* Container: `max-width: 1280px`; gutters 16px (mobile) → 24px (≥ 640) → 40px (≥ 1024).
* Section rhythm: `--section-y: clamp(4rem, 10vw, 9rem)`.
* Grid: 12 columns desktop, 6 tablet, 4 mobile.

## Shape, Depth, Glass

* Radius: `--r-sm 6px`, `--r-md 12px`, `--r-lg 20px`, `--r-xl 28px`, `--r-pill 999px`. Big radii are for hero media and glass cards only — never for every card.
* Shadows are warm and low: `--shadow-sm`, `--shadow-md`, `--shadow-glow` (orange ambient).
* Glass (`.glass`): `backdrop-filter: blur(18px) saturate(1.4)`, white 55–70% on light, ink 45% on dark, 1px translucent border. Allowed on: nav, floating stats, hero cards, selected cards, CTA overlays, media controls.

## Motion

* Easings: `--ease-out: cubic-bezier(.16,1,.3,1)`, `--ease-in-out: cubic-bezier(.65,0,.35,1)`, `--ease-snap: cubic-bezier(.2,.8,.2,1)`.
* Durations: 150ms (hover), 300ms (UI), 600ms (reveal), 900–1200ms (hero / signature).
* Only `transform` and `opacity` animate. ScrollTriggers are created in `useGSAP` scopes and killed on unmount.
* `prefers-reduced-motion`: all timelines collapse to instant state; pinned sections become static.
* Mobile: no pinning, no horizontal scroll hijack, reveal only.

## Components

Button (primary / secondary / ghost / dark variants, sizes sm / md / lg, `magnetic` opt-in), Input / Textarea / Select (labelled, error state), Eyebrow, SectionHeading, Glass, Chip, Stat, Reveal, Marquee, Accordion, Dialog (accessible), Toast.

## Iconography

Lucide, 1.5px stroke, 20px default. Icons never carry meaning alone.

## Breakpoints

`sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536` (Tailwind defaults).
