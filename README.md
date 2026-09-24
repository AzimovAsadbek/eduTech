# EduTech — Premium Digital Platform

EduTech'ning rasmiy web-platformasi: **EDU** (zamonaviy kasblar akademiyasi) va **MEDIA** (bizneslar uchun kontent va marketing studiyasi) — bitta premium digital tajriba, lead pipeline (Telegram + Excel) va toʻliq admin panel bilan.

```
Next.js 16 · React 19 · TypeScript · Tailwind v4 · GSAP · Prisma 6 · PostgreSQL · Docker
```

## Mundarija

1. [Project overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Folder structure](#3-folder-structure)
4. [Installation](#4-installation)
5. [Development](#5-development)
6. [Environment](#6-environment)
7. [Database](#7-database)
8. [Prisma](#8-prisma)
9. [Telegram](#9-telegram)
10. [Excel](#10-excel)
11. [Admin](#11-admin)
12. [Testing](#12-testing)
13. [Docker](#13-docker)
14. [Deployment](#14-deployment)
15. [Security](#15-security)
16. [SEO & Analytics](#16-seo--analytics)
17. [Content principles](#17-content-principles)
18. [Troubleshooting](#18-troubleshooting)

---

## 1. Project overview

| Yoʻnalish | Nima beradi |
|---|---|
| **Public site** | Bosh sahifa (ENTRY → DISCOVERY → TRUST → EXPLORATION → PROOF → MEDIA → CONVERSION), `/kurslar`, `/kurslar/[slug]`, `/media`, `/media/xizmatlar/[slug]`, `/media/portfolio`, `/media/portfolio/[slug]`, `/natijalar`, `/biz-haqimizda`, `/kontakt`, custom 404/500 |
| **Leads** | Uch xil lead (`EDUCATION`, `MEDIA`, `GENERAL`) → PostgreSQL → real-time Telegram xabar (inline status tugmalari bilan) → Excel export |
| **Admin panel** | `/admin` — dashboard, leads (filter/search/sort/status/notes/export), CMS (kurslar, xizmatlar, oʻqituvchilar, natijalar, fikrlar, media loyihalar, galereya, FAQ, filiallar), media library, sozlamalar, foydalanuvchilar (RBAC), audit log |
| **Platform readiness** | Modular monolith, REST API `/api/v1`, cache tags, storage abstraction, analytics facade, Docker production stack |

Dizayn tizimi va UX qarorlari: [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md), [`docs/HOMEPAGE_UX.md`](docs/HOMEPAGE_UX.md). Arxitektura qarori (ADR): [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## 2. Architecture

**Modular monolith on Next.js App Router.** Bitta deploy, bitta kod bazasi, toza modul chegaralari:

```
Browser ──► Next.js (RSC pages + Route Handlers /api/v1) ──► src/server/modules/* ──► Prisma ──► PostgreSQL
                                    │
                                    ├──► Telegram Bot API (leads)      ◄── webhook (inline actions)
                                    ├──► ExcelJS (reports)
                                    └──► Storage provider (local volume, S3-ready)
```

* **Server Components by default**, client komponentlar faqat interaktivlik uchun (GSAP, formalar, admin jadvallari).
* **`src/server/modules`** — yagona biznes-logika qatlami: `auth`, `leads`, `telegram`, `excel`, `content`, `settings`, `uploads`, `audit`. `src/app` hech qachon Prisma'ni toʻgʻridan-toʻgʻri chaqirmaydi.
* **Public API** (`/api/v1/public/*`) va **Admin API** (`/api/v1/admin/*`) alohida authorization qatlami bilan (`adminRoute(minRole, handler)`).
* **Cache**: public kontent `unstable_cache` + taglar; admin mutatsiyalari `revalidateTag` chaqiradi.
* Nega monorepo emas — ADR'da asoslangan.

## 3. Folder structure

```
├── prisma/                 schema.prisma, migrations/, seed.ts, seed-data/
├── docker/                 nginx config, entrypoint
├── docs/                   ARCHITECTURE, DESIGN_SYSTEM, HOMEPAGE_UX
├── scripts/                telegram-webhook.ts, create-admin.ts
├── src/
│   ├── app/
│   │   ├── (site)/         public sahifalar (RSC)
│   │   ├── admin/          admin panel
│   │   ├── api/v1/         public/, admin/, telegram/ route handlers
│   │   ├── layout.tsx      fontlar + global metadata
│   │   ├── globals.css     design tokens (@theme), typography utilities, glass, motion
│   │   ├── sitemap.ts · robots.ts · opengraph-image.tsx · not-found.tsx · error.tsx
│   ├── components/
│   │   ├── ui/             Button, Input/Textarea/Select, Chip, Accordion, SectionHeading, PlaceholderImage
│   │   ├── motion/         gsap.ts, Reveal, SplitHeading, Counter, Cursor, Marquee
│   │   ├── site/           Header, Footer, LeadForm, ApplyDialog, home/*, course/*, media/*
│   │   └── admin/          admin UI
│   ├── server/
│   │   ├── db.ts           Prisma singleton
│   │   ├── cache.ts        cache tags + invalidate()
│   │   ├── http/           errors, response, request (CSRF/IP/parse), rate-limit, admin guard
│   │   └── modules/        auth · leads · telegram · excel · content · settings · uploads · audit
│   ├── lib/                env.ts (Zod), utils.ts, sanitize.ts, analytics.ts
│   ├── config/site.ts      nav, routes, SEO defaults
│   └── proxy.ts            CSP nonce, security headers, admin gate
└── tests/                  unit/, integration/, e2e/
```

## 4. Installation

Talablar: **Node 22+**, **npm 10+**, **Docker** (PostgreSQL uchun) yoki lokal PostgreSQL 16.

```bash
git clone https://github.com/AzimovAsadbek/eduTech.git
cd eduTech
npm install
cp .env.example .env            # AUTH_SECRET va TELEGRAM_* ni toʻldiring
docker compose -f docker-compose.dev.yml up -d   # PostgreSQL :5433
npm run db:migrate              # migratsiyalar
npm run db:seed                 # admin + kurslar + xizmatlar + FAQ
npm run dev                     # http://localhost:3000
```

Admin: `http://localhost:3000/admin` — `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (`.env`).

Demo placeholder kontent (oʻqituvchi, fikr, natija, loyiha — hammasi “Namuna” deb belgilangan) kerak boʻlsa:

```bash
SEED_DEMO=1 npm run db:seed
```

## 5. Development

| Buyruq | Vazifa |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build && npm start` | Production build / start |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (Next + React Compiler qoidalari) |
| `npm run format` | Prettier (Tailwind class sorting) |
| `npm run db:studio` | Prisma Studio |
| `npm run test` / `test:e2e` | Testlar ([§12](#12-testing)) |

Kod qoidalari: strict TypeScript, `any` yoʻq, komponentlar kichik va kompozitsion, biznes-logika faqat `src/server/modules`, animatsiya faqat `transform/opacity`, har ScrollTrigger `useGSAP` scope ichida (avtomatik cleanup), `prefers-reduced-motion` hurmat qilinadi.

## 6. Environment

`.env.example` — toʻliq roʻyxat. Muhimlari:

| Oʻzgaruvchi | Izoh |
|---|---|
| `DATABASE_URL` | PostgreSQL ulanish satri |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL (SEO, CSRF origin, Telegram webhook) |
| `AUTH_SECRET` | ≥ 32 belgi, `openssl rand -base64 48` |
| `SESSION_TTL_HOURS` | Admin sessiya muddati (default 12) |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Lead xabarlari uchun bot va guruh/kanal |
| `TELEGRAM_WEBHOOK_SECRET` | `openssl rand -hex 24`; inline tugmalar uchun webhook himoyasi |
| `UPLOAD_DIR`, `UPLOAD_PUBLIC_PATH`, `UPLOAD_MAX_MB` | Rasm yuklash |

Frontend'ga faqat `NEXT_PUBLIC_*` oʻzgaruvchilar chiqadi. `src/lib/env.ts` ishga tushishda Zod bilan tekshiradi.

## 7. Database

PostgreSQL — source of truth. Asosiy jadvallar:

`AdminUser`, `Session`, `AuditLog`, `Branch`, `SiteSetting`, `CourseCategory`, `Course`, `Teacher`, `CourseTeacher`, `Service`, `MediaProject`, `Testimonial`, `Result`, `GalleryItem`, `Faq`, `Lead`, `LeadNote`, `Upload`.

Enumlar: `Role`, `LeadType`, `LeadStatus (NEW · CONTACTED · IN_PROGRESS · CONVERTED · LOST)`, `ContentStatus (DRAFT · PUBLISHED · ARCHIVED)`, `CourseLevel`, `CourseFormat`, `ResultKind`, `FaqScope`, `GalleryCategory`, `AuditAction`.

Har bir jadvalda `createdAt/updatedAt`, tashqi kalitlar aniq `onDelete`, unique sluglar, filtr ustunlarida indekslar.

## 8. Prisma

```bash
npm run db:migrate            # prisma migrate dev  (development)
npm run db:deploy             # prisma migrate deploy (production, Docker entrypoint avtomatik chaqiradi)
npm run db:reset              # DB'ni tozalab qayta migratsiya + seed
npx prisma generate           # client qayta generatsiya
```

Sxema: [`prisma/schema.prisma`](prisma/schema.prisma). Migratsiyalar `prisma/migrations/`.

## 9. Telegram

1. `@BotFather` orqali bot yarating → `TELEGRAM_BOT_TOKEN`.
2. Botni lead guruhiga qoʻshing, `TELEGRAM_CHAT_ID` ni oling (masalan `@userinfobot` yoki `getUpdates`).
3. Webhook (inline tugmalar uchun) — sayt HTTPS'da ishlayotganda:

```bash
npm run telegram:webhook set      # setWebhook → $NEXT_PUBLIC_SITE_URL/api/v1/telegram/webhook
npm run telegram:webhook info
```

Xabar formati (`src/server/modules/telegram/format.ts`):

```
🔔 NEW LEAD            🔔 NEW MEDIA LEAD
Type / Name / Phone    Company / Name / Phone
Course / Branch        Service / Budget
Comment / Time         Message / Time
[📞 Contacted] [⏳ In Progress]
[✅ Completed] [❌ Rejected]
```

Tugma bosilganda status DB'da yangilanadi, xabar tahrirlanadi, `AuditLog` yoziladi. Faqat `TELEGRAM_CHAT_ID` dan kelgan callbacklar qabul qilinadi; webhook `X-Telegram-Bot-Api-Secret-Token` bilan himoyalangan. Telegram ishlamasa lead baribir saqlanadi, xato `AuditLog`'ga `NOTIFY_FAILED` sifatida tushadi.

## 10. Excel

`GET /api/v1/admin/leads/export?type=&status=&from=&to=&q=&courseId=&serviceId=` — lead jadvalidagi filtrlar bilan bir xil. Ustunlar: Sana, Turi, Ism, Telefon, Kurs/Xizmat, Filial, Kompaniya, Byudjet, Status, Manba, Xabar, Masʼul, created_at, ID. Header muzlatilgan, autofilter yoqilgan. Har export `AuditLog`ga yoziladi.

## 11. Admin

* Kirish: `/admin/login`. Sessiya: DB'dagi `Session` + HttpOnly cookie (`SameSite=Lax`, `Secure` prod'da) ichida JWT (HS256).
* Rollar: `SUPER_ADMIN` (hamma narsa, foydalanuvchilar, sozlamalar, audit), `ADMIN` (leadlar + kontent), `EDITOR` (faqat kontent).
* Brute-force: 5 ta xato → 15 daqiqa blok; login endpoint IP boʻyicha cheklangan.
* Sahifalar: `/admin`, `/admin/leads`, `/admin/leads/[id]`, `/admin/courses`, `/admin/services`, `/admin/teachers`, `/admin/results`, `/admin/testimonials`, `/admin/media-projects`, `/admin/gallery`, `/admin/faq`, `/admin/branches`, `/admin/course-categories`, `/admin/uploads`, `/admin/settings`.
* Kontent lifecycle: `DRAFT → PUBLISHED → ARCHIVED`; `?preview=1` bilan admin draft sahifani koʻra oladi.
* Yangi admin (UI'siz): `npm run admin:create -- email@x.uz "Parol123!" "Ism" SUPER_ADMIN`.

REST API qisqacha:

| Endpoint | Rol |
|---|---|
| `POST /api/v1/public/leads` | — (rate limit 5/10min/IP, honeypot, timing) |
| `POST /api/v1/admin/auth/login` · `logout` · `GET me` · `POST password` | — / har qanday |
| `GET /api/v1/admin/leads` · `GET /:id` · `PATCH /:id` · `POST /:id/notes` · `GET /export` | ADMIN |
| `DELETE /api/v1/admin/leads/:id` | SUPER_ADMIN |
| `GET /api/v1/admin/stats?days=30` | ADMIN |
| `GET/POST /api/v1/admin/content/:resource` · `GET/PATCH/DELETE /:id` · `POST /reorder` | EDITOR (DELETE — ADMIN) |
| `GET/PATCH /api/v1/admin/settings` | EDITOR / SUPER_ADMIN |
| `GET/POST /api/v1/admin/uploads` · `DELETE /:id` | EDITOR / ADMIN |
| `GET/POST /api/v1/admin/users` · `PATCH /:id` · `GET /api/v1/admin/audit` | SUPER_ADMIN |
| `POST /api/v1/telegram/webhook` | secret header |

## 12. Testing

```bash
npm run test:unit          # Vitest — validation, sanitize, telegram format, excel, rate limiter, auth helpers
npm run test:integration   # Vitest + real PostgreSQL (edutech_test) — leads, status transitions, telegram mock, content CRUD
npm run test:e2e           # Playwright — kurs → detail → ariza → API → DB → Telegram (mock); media inquiry; smoke; a11y
```

E2E Telegram tekshiruvi uchun mock Bot API server (`tests/e2e/telegram-mock.ts`) 127.0.0.1:4141 da koʻtariladi; dev server `TELEGRAM_API_BASE=http://127.0.0.1:4141` bilan ishga tushirilsa, xabar yuborilgani tasdiqlanadi.

## 13. Docker

Production stack: `web` (Next.js standalone, non-root, migratsiyalar entrypoint'da), `postgres`, `nginx` (TLS, gzip, static cache, `/uploads` volume).

```bash
cp .env.production.example .env.production   # toʻldiring
docker compose build
docker compose up -d
docker compose exec web node node_modules/prisma/build/index.js db seed   # yoki: npx tsx prisma/seed.ts lokal DATABASE_URL bilan
```

Dev uchun faqat DB: `docker compose -f docker-compose.dev.yml up -d`.

## 14. Deployment

1. Server: Docker + Docker Compose, domen `NEXT_PUBLIC_SITE_URL` ga yoʻnaltirilgan.
2. Sertifikat: `docker/nginx/certs/fullchain.pem` va `privkey.pem` (certbot/Let's Encrypt). `docker/nginx/conf.d/edutech.conf` ichida `server_name` ni domenga oʻzgartiring.
3. `.env.production` — `AUTH_SECRET`, `POSTGRES_PASSWORD`, `TELEGRAM_*` majburiy.
4. `docker compose up -d --build` → `npm run telegram:webhook set` (lokal `.env`da prod qiymatlar bilan yoki konteyner ichida).
5. Birinchi kirishdan soʻng admin parolini almashtiring, `/admin/settings` da manzil, telefon, ijtimoiy tarmoqlar va statistikani kiriting.
6. Backup: `pgdata` va `uploads` volume'lari.

## 15. Security

* **CSP** (nonce, `strict-dynamic`), HSTS, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `nosniff` — `src/proxy.ts`.
* **CSRF**: cookie-auth'li state-changing soʻrovlar `Origin`/`Sec-Fetch-Site` same-origin tekshiruvidan oʻtadi; cookie `SameSite=Lax`.
* **Rate limiting**: public lead 5/10min, login 8/15min, admin API 300/min, upload 30/10min (in-memory; koʻp instansiya uchun Redis interfeysi tayyor) + nginx `limit_req`.
* **Validation & sanitization**: barcha inputlar Zod; matnlardan HTML olib tashlanadi; Telegram HTML escape; Prisma parametrlangan soʻrovlar (SQL injection yoʻq).
* **Auth**: bcrypt (cost 12), HttpOnly cookie, DB sessiya (bekor qilish mumkin), account lockout, parol talablari.
* **RBAC**: `requireRole` har admin endpointda; `proxy.ts` `/admin/*` ni edge darajasida gate qiladi.
* **Uploads**: magic-bytes orqali rasm tekshiruvi (sharp), metadata strip, WebP re-encode, random nom, hajm limiti.
* **Audit log**: login/logout/xato login, CRUD, status, export, upload, notify failed.
* **Secrets**: faqat server; `.env*` gitignore'da; Docker image'da placeholder.
* Admin va admin API `Cache-Control: no-store`, `X-Robots-Tag: noindex`.

## 15a. Koʻp tillilik (uz · ru · en)

* Routing: `next-intl` — oʻzbekcha asosiy (`/kurslar`), ruscha va inglizcha prefiks bilan (`/ru/kurslar`, `/en/kurslar`). Admin va API tildan mustaqil.
* Statik matnlar: `messages/<til>/{common,components,pages}.json` — uchala tilda bir xil kalitlar. Yangi matn qoʻshilganda uchala faylga ham yozing.
* Kontent (DB): har bir kontent jadvalida `translations` JSON ustuni (`{ ru: {...}, en: {...} }`). Admin panelda har bir yozuv formasida **Oʻzbek | Русский | English** tugmalari orqali tarjima kiritiladi; boʻsh qoldirilgan maydon oʻzbekcha asl qiymatga tushadi (`src/i18n/localize.ts`).
* SEO: har sahifada `hreflang` (uz/ru/en + x-default), til boʻyicha canonical, sitemap barcha tillarni oʻz ichiga oladi, `<html lang>` va OpenGraph `locale` toʻgʻri.
* Til almashtirgich header va mobil menyuda — foydalanuvchi oʻsha sahifada qoladi.

## 16. SEO & Analytics

* Har sahifa `metadata` (title template, description, canonical, OpenGraph, generated OG image).
* `sitemap.xml` (dinamik: kurslar, xizmatlar, loyihalar), `robots.txt` (admin/api yopiq).
* JSON-LD: `EducationalOrganization`/`LocalBusiness`, `Course`, `Service`, `BreadcrumbList` — Namangan uchun local SEO.
* Semantik HTML, `lang="uz"`, skip-link, ARIA, focus ringlar, reduced-motion.
* Analytics facade `src/lib/analytics.ts` — cookie'siz `window.dataLayer` eventlari: `cta_click`, `course_view`, `service_view`, `application_submit`, `media_inquiry_submit`, `phone_click`, `telegram_click`, `instagram_click`. GTM/GA4 yoki Plausible ulash uchun tayyor.

## 17. Content principles

* Statistika (`500+ / 9+ / 100+`) — sozlamalardan, uydirma emas.
* Oʻqituvchi, fikr, natija, loyiha, galereya — **faqat real** maʼlumot; boʻsh boʻlsa boʻlimlar avtomatik yashirinadi yoki halol placeholder koʻrsatadi (stock rasm yoʻq).
* Seed'dagi kurs davomiyligi / jadval / yosh chegarasi — tahririy boshlangʻich qiymatlar; **nashrdan oldin admin panelda tasdiqlang**. Narx maydoni boʻsh — “Konsultatsiyada aniqlanadi”.
* Manzil, telefon, Telegram, Instagram, xarita — `/admin/settings`.

## 18. Troubleshooting

| Muammo | Yechim |
|---|---|
| `Invalid environment configuration` | `.env` da `AUTH_SECRET` ≥ 32 belgi, `DATABASE_URL` toʻgʻri |
| `P1001 Can't reach database` | `docker compose -f docker-compose.dev.yml up -d`; port 5433 band emasligini tekshiring |
| Yangi sahifa 404 beradi (dev) | Turbopack route keshi — dev serverni qayta ishga tushiring |
| Telegram xabar kelmayapti | `TELEGRAM_BOT_TOKEN`/`CHAT_ID`; bot guruhda adminmi; `AuditLog` da `NOTIFY_FAILED` |
| Inline tugmalar ishlamayapti | `npm run telegram:webhook info` — URL HTTPS boʻlishi shart; `TELEGRAM_WEBHOOK_SECRET` mos |
| 403 `Cross-site request blocked` | `NEXT_PUBLIC_SITE_URL` sayt domeni bilan bir xil boʻlishi kerak |
| Rasm yuklanmayapti | `UPLOAD_DIR` yozish huquqi; hajm `UPLOAD_MAX_MB`; format JPEG/PNG/WebP/GIF/AVIF |
| Tashqi rasm URL | `https://` URL qabul qilinadi (optimizatsiyasiz koʻrsatiladi); `/uploads/...` kutubxona rasmlari WebP ga optimallashtiriladi |
| Prod'da fontlar yoʻq | Build vaqtida Google Fonts'ga internet kerak (`next/font` self-host qiladi) |
