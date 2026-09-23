# EduTech — Architecture Decision Record

**Status:** accepted · **Date:** 2026-09-23

## 1. Context

EduTech needs one deployable product that covers four things at once:

1. A premium public website (EDU + MEDIA worlds) with heavy scroll storytelling.
2. A lead pipeline (education / media / general) with real-time Telegram notifications and Excel reporting.
3. A content management admin panel (courses, services, teachers, results, testimonials, media projects, gallery, FAQ, settings).
4. A foundation that can later grow into a platform (student accounts, LMS features, payments) without a rewrite.

The team is small, there is a single deployment target and no need for independent scaling of an API tier today.

## 2. Decision: **Modular Monolith on Next.js 16**

```
edutech-platform/
├── prisma/                 # schema, migrations, seed
├── src/
│   ├── app/                # Next.js App Router (routes only, no business logic)
│   │   ├── (site)/         # public website — Server Components by default
│   │   ├── admin/          # admin panel (authenticated, dynamic)
│   │   └── api/v1/         # REST API: /public/*, /admin/*, /telegram/*
│   ├── components/
│   │   ├── ui/             # design-system primitives (Button, Input, Glass, Eyebrow…)
│   │   ├── site/           # public-site sections & layouts
│   │   ├── motion/         # GSAP wrappers, reduced-motion aware
│   │   └── admin/          # admin-only UI (data tables, forms, charts)
│   ├── server/             # domain layer — the only place that touches Prisma
│   │   ├── db.ts           # Prisma client singleton
│   │   ├── modules/        # bounded contexts: auth, leads, content, telegram, excel, uploads, audit, settings
│   │   ├── http/           # route-handler helpers: responses, errors, auth guards, rate limiting, CSRF
│   │   └── cache.ts        # cache tags for content revalidation
│   ├── lib/                # framework-agnostic utilities (env, cn, formatters, slugify)
│   ├── config/             # site config, navigation, SEO defaults, design tokens (TS mirror)
│   └── types/              # shared TypeScript types / DTOs
├── tests/                  # unit (vitest), integration (vitest + real DB), e2e (playwright)
├── docker/                 # nginx config, compose files
└── docs/                   # ADR, design system, UX architecture, runbooks
```

### Why not `apps/web` + `apps/api` monorepo?

* One deployable and one team ⇒ a separate API service adds network hops, duplicated types, two CI pipelines and two deploy targets for zero present benefit.
* Next.js Route Handlers already give us a proper REST layer with its own authorization boundary.
* Module boundaries live in `src/server/modules/*`. Each module exposes a `service.ts` (business logic), `schema.ts` (Zod contracts) and `repository.ts` where the query surface is large. An `api/` package could be extracted later by moving `src/server` behind an HTTP boundary — nothing in `src/app` imports Prisma directly.

### Why Next.js App Router + Server Components

* Public pages render on the server from PostgreSQL ⇒ SEO friendly HTML, no client data fetching for content.
* Client Components are used only where interaction demands it (GSAP, forms, nav, admin tables).
* Route Handlers give REST endpoints; `proxy.ts` gives us a single place for security headers + CSP nonces + admin auth gating.

### Data

* **PostgreSQL** is the source of truth. **Prisma 6** for schema, migrations and typed access.
* Enums for `Role`, `LeadType`, `LeadStatus`, `ContentStatus`, `CourseLevel`, `CourseFormat`, `ResultKind`, `FaqScope`, `GalleryCategory`.
* Every table has `createdAt`/`updatedAt`; foreign keys with explicit `onDelete`; unique slugs; indexes on all filter columns used by the admin.
* Content entities share a `status: DRAFT | PUBLISHED | ARCHIVED` lifecycle; public queries always filter `PUBLISHED`. Admin preview renders the same page components with a draft-capable loader.

### Authentication & authorization

* Admin-only auth. Password hashing with bcrypt (cost 12). Login issues an opaque session id stored hashed in `Session`, delivered as an `HttpOnly; Secure; SameSite=Lax` cookie. A signed JWT (jose, HS256) wraps the session id so `proxy.ts` can reject unauthenticated requests at the edge without a DB call; the DB session is checked on every API call and server render for revocation.
* RBAC: `SUPER_ADMIN` (users, settings, everything), `ADMIN` (leads + content), `EDITOR` (content only). Enforced by `requireRole()` in `src/server/http/auth.ts`.
* Brute force: per-IP rate limit on `/api/v1/admin/auth/login` and per-account lockout after 5 failures for 15 minutes.

### Leads → Telegram → Excel

* `leads/service.ts` is the single write path (used by the public API). It validates, sanitises, stores, then enqueues a Telegram notification (`telegram/service.ts`) — failures are logged to `AuditLog` and never block the user.
* Telegram inline buttons hit `/api/v1/telegram/webhook` (guarded by `X-Telegram-Bot-Api-Secret-Token`) and update `Lead.status`; the original message is edited to reflect the new status.
* Excel export is a reporting layer over PostgreSQL: `/api/v1/admin/leads/export` streams an `.xlsx` built with ExcelJS using the same filters as the leads table.

### Files

* `uploads/service.ts` exposes a `StorageProvider` interface. The default `LocalStorageProvider` writes optimised WebP variants to `/public/uploads` (a Docker volume). An S3-compatible provider can be dropped in without touching callers.

### Caching

* Public content reads are wrapped in `unstable_cache` with tags per entity (`courses`, `services`, …). Admin mutations call `revalidateTag(tag, 'max')`.

### Security

* `proxy.ts`: per-request CSP nonce, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy, admin auth gate.
* All inputs are Zod-validated; free-text is stripped of HTML; Telegram messages are HTML-escaped.
* State-changing API requests must pass a same-origin check (`Origin`/`Sec-Fetch-Site`) in addition to cookies ⇒ CSRF protection without a token round-trip.
* In-memory sliding-window rate limiter behind an interface so Redis can replace it for multi-instance deployments.
* Audit log for every admin mutation and auth event.

### Testing

* Unit (Vitest): validation, sanitisation, Telegram message formatting, Excel builder, rate limiter, auth helpers.
* Integration (Vitest + real Postgres): lead creation path, status transitions, repository filters.
* E2E (Playwright): course → detail → application → API → DB → Telegram (mock Bot API server), and media service → inquiry.

### Production

* `Dockerfile` multi-stage, `output: 'standalone'`, non-root `node` user.
* `docker-compose.yml`: `web`, `postgres`, `nginx` (TLS termination, gzip, static cache). The API lives inside `web`.

## 3. Consequences

* + One codebase, one deploy, shared types end-to-end, fast iteration.
* + Clean seams (`src/server/modules`) for a future API extraction or a student-facing platform.
* − Single-process rate limiting; must switch to Redis when scaling horizontally (interface already in place).
* − Next.js couples UI and API deploys; acceptable for this stage.
