# Performance

How the public site was measured, what was slow, what changed and what is left. Numbers are medians of
three Lighthouse 13.5 runs unless noted. Nothing here is estimated: where a metric could not be measured,
the table says so.

## Method

- **Build:** `next build` (Next 16.3, Turbopack), run as the Docker image does: the standalone server
  with `HOSTNAME=0.0.0.0`-equivalent routing, production env, local PostgreSQL, warm data cache.
- **Lab:** Lighthouse 13.5 with its default mobile profile (Moto G Power, simulated slow 4G, 4× CPU
  slowdown) on six pages, and the desktop preset on two pages. Headless Chrome for Testing on an Intel
  MacBook, so absolute CPU numbers (TBT) are pessimistic; before and after ran under the same conditions.
- **Server:** median time to first byte of 9 requests per page, and HTML size raw and gzip.
- **INP** needs real interactions and cannot be measured in a lab navigation run. Total Blocking Time is
  the lab proxy for it.

## Baseline (before)

Mobile, median of 3:

| Page | Score | FCP | LCP | TBT | CLS | JS | Fonts | HTML | Requests |
|---|---|---|---|---|---|---|---|---|---|
| `/` | 66 | 1.41 s | 5.53 s | 506 ms | 0 | 362 KB | 287 KB | 49 KB | 35 |
| `/kurslar` | 74 | 1.36 s | 5.50 s | 282 ms | 0 | 358 KB | 287 KB | 49 KB | 36 |
| `/kurslar/dasturlash` | 74 | 1.21 s | 5.34 s | 311 ms | 0 | 355 KB | 287 KB | 40 KB | 34 |
| `/media` | 71 | 1.36 s | 5.50 s | 351 ms | 0 | 356 KB | 287 KB | 45 KB | 39 |
| `/ig` | 77 | 1.21 s | 5.19 s | 229 ms | 0 | 337 KB | 287 KB | 27 KB | 34 |
| `/kontakt` | 76 | 1.21 s | 5.34 s | 240 ms | 0 | 349 KB | 287 KB | 31 KB | 34 |

Desktop: `/` 98 (LCP 1.12 s), `/media` 98 (LCP 1.11 s). Transfer sizes are compressed.

Server: time to first byte 11–24 ms locally (content comes from the tagged data cache). On the Vercel
demo, from Uzbekistan, it was 0.87–1.14 s, of which about 0.36 s is connection and TLS.

## Bottlenecks found

| Severity | Finding | Evidence |
|---|---|---|
| CRITICAL | Every page preloaded 8 font files (284 KB). Bricolage Grotesque shipped its full variable file (opsz, wdth and wght axes: 128 KB for Latin alone) although the CSS pinned opsz 96 and wdth 100. Cyrillic and latin-ext were preloaded on Uzbek pages that never use them. | `Link` preload headers; build media folder |
| CRITICAL | zod (with all its locale tables) was in the browser bundle for the lead form: a 90 KB gzip chunk on every page, 87% unused. | Lighthouse unused-JS; chunk contents |
| CRITICAL | The hero lead paragraph (the mobile LCP element) was painted, then hidden by GSAP after hydration and faded back in, so LCP waited for all JavaScript (5.5 s). | Lighthouse LCP element and breakdown |
| HIGH | GSAP + ScrollTrigger (about 45 KB gzip) on every page for simple entrances, with one ScrollTrigger per reveal and forced layouts on start. The journey animated `left` and `top` on every scroll frame. | Chunk contents; forced-reflow insight |
| HIGH | Favicons (`/icon.svg`, `/apple-icon.png`), PWA icons and the JSON-LD logo answered 404 with a 39 KB HTML page, because the proxy sent public files through the locale router. | curl on production and the demo |
| HIGH | All message namespaces (about 18 KB) and every course's stored translations for all languages (about 20 KB) were serialised into each page. | Decoded RSC payload |
| MEDIUM | Logo path data three times per page (header, footer, RSC payload). | HTML analysis |
| MEDIUM | Header and dock scroll handlers queried the DOM, read layout and hit-tested on every scroll event. | Code review |
| MEDIUM | Navigations wait for a full server render (per-request CSP nonce) with no visible feedback. | Code review; demo timings |
| LOW | Shared loaders (courses, settings, branches, services) read the data cache up to three times per request. | Code review |

## Changes

| Severity | Change | Why it is faster | Trade-off |
|---|---|---|---|
| CRITICAL | Fonts: Bricolage self-hosted as Google's static instance at opsz 96 (`src/app/fonts`, 40 KB instead of 128 KB); only the Latin files of the three faces are preloaded. Cyrillic and other subsets still load on demand through `unicode-range`. The mono face falls back to monospace fonts instead of a stretched Arial. | 3 preloads (about 94 KB) instead of 8 (284 KB) compete with the HTML, CSS and JS on slow networks. Leaving the mono face out of the preloads was tried and measured: simulated FCP got about 150 ms worse, so it stays preloaded. | Russian headings keep using the metric-matched fallback (Bricolage has no Cyrillic, as before). |
| CRITICAL | Lead form validates with react-hook-form rules; zod stays on the server, which validates every submission anyway. `@hookform/resolvers` removed. | A 90 KB gzip chunk, 87% unused, is gone from every page. | None: same rules and messages. |
| CRITICAL | Hero entrance moved to CSS keyframes that start with the first paint; the lead paragraph only rises and is never hidden. The hero is a server component with two small client islands. | The LCP element no longer waits for JavaScript. | The hero stats no longer count up on load; counters further down still do. |
| HIGH | GSAP and ScrollTrigger removed. `Reveal`, `SplitHeading` and `Counter` are server markup driven by one IntersectionObserver runtime (`MotionRuntime`) and CSS transitions; the journey section uses its own small observer. Only elements still below the fold are hidden, and only after JavaScript runs. | About 45 KB gzip less on every page, no forced layouts from dozens of ScrollTriggers, no per-frame `left`/`top` animation. | Entrances are time-based after the element enters, not scroll-scrubbed. |
| HIGH | Proxy matcher skips paths with a file extension. | Icons, the manifest icons and brand SVGs are served as files (they were 404 HTML pages); no server render per icon request. | Static files no longer receive the CSP headers the proxy adds (they are not documents). |
| HIGH | Only the message namespaces client components use are serialised (`src/i18n/client-messages.ts`, guarded by a unit test); `localize()` drops stored translations; course cards get a minimal DTO; the homepage course grid is server-rendered. | Smaller HTML and RSC payload on every page. | New client namespaces must be added to the list (the test fails otherwise). |
| MEDIUM | Navigation progress bar and intent prefetch (`experimental.dynamicOnHover`): links fetch the destination on hover or touchstart. | Taps get instant feedback, and the server round trip starts 100–300 ms earlier. | Hovered or touched links cost one extra request each. |
| MEDIUM | Footer logo is a cached static SVG (`public/brand/lockup-*.svg`, generated from the logo geometry and checked by a test). | About 10 KB less path data in every page's HTML and RSC payload. | None visible; the footer is below the fold. |
| MEDIUM | Header and dock scroll checks run at most once per frame with cached element lists; only full-width dark sections invert the header. | Less main-thread work while scrolling. It also fixes the header flashing dark over the hero's reel tile. | None. |
| LOW | Shared loaders wrapped in React `cache()` on top of `unstable_cache`. | One data-cache read per request instead of up to three (each is a network call on Vercel). | None. |

Evaluated and rejected:
- **`experimental.inlineCss`:** the homepage HTML grew from 30 KB to 93 KB gzip, because the CSS is inlined twice (style tags and the RSC payload). That is slower than one cached 20 KB stylesheet.
- **next-intl precompiled messages:** these would drop the ICU parser (about 12 KB). The loader rejects array messages and expects one file per locale, so it would need a rewrite of the message catalog.
- **Splitting admin CSS from the site CSS:** about 3.6 KB gzip, not worth a second Tailwind entry point.

## After

Mobile, median of 3 runs, before → after:

| Page | Score | FCP | LCP | TBT | CLS | Speed Index |
|---|---|---|---|---|---|---|
| `/` | 66 → **88** | 1.41 s → 1.22 s | 5.53 s → **3.68 s** (-34%) | 506 → **137 ms** (-73%) | 0 → 0 | 2.51 s → 1.50 s |
| `/kurslar` | 74 → **88** | 1.36 s → 1.22 s | 5.50 s → **3.69 s** (-33%) | 282 → **157 ms** (-44%) | 0 → 0 | 1.81 s → 1.22 s |
| `/kurslar/dasturlash` | 74 → **89** | 1.21 s → 1.21 s | 5.34 s → **3.52 s** (-34%) | 311 → **159 ms** (-49%) | 0 → 0 | 1.84 s → 1.21 s |
| `/media` | 71 → **88** | 1.36 s → 1.21 s | 5.50 s → **3.67 s** (-33%) | 351 → **163 ms** (-54%) | 0 → 0 | 2.15 s → 1.21 s |
| `/ig` | 77 → **89** | 1.21 s → 1.21 s | 5.19 s → **3.52 s** (-32%) | 229 → **147 ms** (-36%) | 0 → 0 | 1.76 s → 1.21 s |
| `/kontakt` | 76 → **89** | 1.21 s → 1.21 s | 5.34 s → **3.51 s** (-34%) | 240 → **151 ms** (-37%) | 0 → 0 | 1.91 s → 1.21 s |

Desktop: `/` 98 → 100, LCP 1.12 s → 0.76 s; `/media` 98 → 100, LCP 1.11 s → 0.74 s.

Transferred per page (mobile, compressed), before → after:

| Page | JavaScript | Fonts | HTML | Total | Requests |
|---|---|---|---|---|---|
| `/` | 362 → 225 KB (-38%) | 287 → 96 KB | 49 → 34 KB | 733 → 388 KB (-47%) | 35 → 28 |
| `/kurslar` | 358 → 227 KB (-37%) | 287 → 96 KB | 49 → 28 KB | 730 → 386 KB (-47%) | 36 → 29 |
| `/kurslar/dasturlash` | 355 → 225 KB (-37%) | 287 → 96 KB | 40 → 27 KB | 713 → 378 KB (-47%) | 34 → 27 |
| `/media` | 356 → 226 KB (-37%) | 287 → 96 KB | 45 → 30 KB | 732 → 394 KB (-46%) | 39 → 32 |
| `/ig` | 337 → 206 KB (-39%) | 287 → 96 KB | 27 → 23 KB | 687 → 359 KB (-48%) | 34 → 27 |
| `/kontakt` | 349 → 217 KB (-38%) | 287 → 96 KB | 31 → 22 KB | 698 → 369 KB (-47%) | 34 → 27 |

CSS grew from 20 KB to 22 KB (new motion, journey and language-select styles).

Server, median of 9 requests (local, warm data cache), before → after:

| Page | Time to first byte | HTML (gzip) |
|---|---|---|
| `/` | 24 → 20 ms | 46.5 → 32.3 KB |
| `/kurslar` | 19 → 15 ms | 45.9 → 25.7 KB |
| `/kurslar/dasturlash` | 17 → 15 ms | 36.8 → 25.3 KB |
| `/media` | 18 → 13 ms | 41.7 → 27.5 KB |
| `/ig` | 11 → 10 ms | 24.5 → 20.4 KB |
| `/kontakt` | 12 → 10 ms | 28.0 → 20.1 KB |
| `/ru` | 17 → 18 ms | 49.2 → 34.9 KB |

Vercel demo, measured from Uzbekistan with curl, before → after (uncompressed HTML, as in the baseline):

| Page | Time to first byte | Full HTML |
|---|---|---|
| `/` | 1.14 → 0.93 s | 1.69 → 1.30 s |
| `/kurslar` | 0.88 → 0.84 s | 1.42 → 1.16 s |
| `/ig` | 0.87 → 0.89 s | 1.24 → 1.06 s |
| `/media` | 0.89 → 0.94 s | 1.41 → 1.50 s |

The demo's first byte is bound by the network path to Frankfurt and serverless overhead (see "Remaining
bottlenecks"). These single-machine timings vary by about ±0.15 s between runs.

Interaction to Next Paint could not be measured in the lab. Total Blocking Time, its lab proxy, fell
36–73% on mobile.

Navigation (production build, desktop): hovering a header link fetched the destination's full page
data, and the click then rendered it in 172 ms. The progress bar showed and finished.

## Remaining bottlenecks

- **Every page is rendered per request.** The CSP uses a per-request nonce, and a nonce needs dynamic
  rendering. So no page can be served from a CDN cache, and each navigation waits for the server. Locally
  that is 10–26 ms. On the Vercel demo (Frankfurt, reached from Uzbekistan) it is about 0.9 s, mostly
  network and serverless overhead. The fix is a product decision. Either host close to the visitors (the
  Docker image in an Uzbek data centre), or drop the nonce for a static CSP (`script-src 'self'
  'unsafe-inline'`) so pages can be cached. The second is weaker protection against injected scripts, so it
  was not done.
- **Framework baseline:** React DOM and the Next.js router are about 113 KB gzip of the roughly 220 KB of
  JavaScript per page.
- **Client-side message formatting:** next-intl ships its ICU formatter (about 12 KB) because client
  components translate in the browser.
- **Forms:** react-hook-form (about 12 KB) loads on every page, since the application dialog is global and
  most pages end with a form.
- **Serverless function size (Vercel):** 43 MB, mostly the Prisma query engine, which slows cold starts.
- **Back/forward cache:** dynamic HTML is sent with `Cache-Control: no-store`, which keeps Safari and
  Firefox from restoring pages from the back/forward cache.

## Recommended next steps

1. Deploy the Docker image close to the audience, or put a CDN in front for `/_next/static` and images.
2. Pass strings from server components instead of translating in client components. The client would
   then no longer need next-intl's formatter.
3. Load the lead form when its section approaches the viewport, and the dialog's form on first open.
4. Consider Prisma's Rust-free client (`engineType = "client"` with the `pg` adapter) for smaller
   serverless bundles.
5. When real photos arrive: use `next/image` with correct `sizes`, AVIF/WebP, and `priority` only for the
   hero image.
6. If the leads table grows past 100 000 rows, add a `pg_trgm` index for the admin's name/company search.
