<div align="center">

# ⚡ ActionInbox AI

**The multilingual AI inbox-to-action OS for small businesses.**

Turn WhatsApp voice notes, screenshots, PDFs, and emails into structured, approval-ready business actions — quotes, invoices, tasks, reminders, and follow-ups.

</div>

---

## 1. Overview

ActionInbox AI is a **multi-tenant B2B SaaS** that sits between messy communication channels (WhatsApp, email, uploads) and business execution. It ingests unstructured inbound content, runs an AI understanding pipeline (transcription → OCR → intent classification → entity extraction → confidence scoring), and generates **source-grounded action cards** that a human approves, edits, rejects, or defers. Every high-stakes output requires human approval, and every suggestion links back to its original evidence.

This repository is a **production-grade implementation** built from the product's PRD, SRS, App Flow, and TRD — not a prototype. It runs locally with **zero external services** thanks to a deterministic mock AI provider, an in-process job queue, and a local SQLite database, while keeping every provider behind a swappable abstraction for production.

### The core loop

```
Inbound item  →  AI understanding  →  Human review  →  Completed action  →  Tracked outcome
(WhatsApp/       (transcribe, OCR,    (approve/edit/    (quote, invoice,    (audit log,
 email/upload)    classify, extract)   reject/defer)     task, reminder)     analytics)
```

---

## 2. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 14** (App Router) + React 18 | Server Components + Route Handlers |
| Language | **TypeScript** (strict) | End-to-end type safety |
| Styling | **Tailwind CSS** + custom design system | Light/dark, tokens via CSS variables |
| UI primitives | Radix UI + hand-built component library | shadcn-style, fully owned |
| ORM / DB | **Prisma** + SQLite (dev) / PostgreSQL (prod) | Schema kept Postgres-portable |
| Auth | Custom — `jose` JWT sessions (httpOnly) + `bcryptjs` | DB-backed, revocable sessions |
| Validation | **Zod** | Shared by forms and API |
| AI gateway | Provider abstraction (`mock` / `anthropic` / `openai`) | Deterministic mock by default |
| Jobs | In-process queue behind a swappable interface | Redis/BullMQ-ready |
| Storage | Local-driver abstraction | S3/R2-ready |
| Charts | Recharts + custom SVG | |
| Toasts | Sonner | |

> **Architecture note.** The TRD recommends Next.js + a separate FastAPI service. We consolidated the backend into the Next.js server layer (TypeScript end-to-end) to ship **one cohesive, locally-runnable deployable** while preserving every TRD principle — modular boundaries, provider abstraction, event-driven async processing, tenant isolation, and cost logging. The seams (AI gateway, job queue, storage) are abstractions you can split into services under real scaling pressure.

---

## 3. Folder structure

```
src/
├── app/
│   ├── (marketing)/            # Public landing + pricing
│   ├── (auth)/                 # Login, signup, forgot-password
│   ├── onboarding/             # Workspace setup wizard
│   ├── invite/[token]/         # Team invitation acceptance
│   ├── (app)/                  # Authenticated app shell + all modules
│   │   ├── dashboard/  inbox/  actions/  tasks/
│   │   ├── quotes/  invoices/  customers/  catalog/  documents/
│   │   ├── workflows/  analytics/  settings/
│   └── api/                    # REST route handlers (consistent envelope)
├── components/
│   ├── ui/                     # Design-system primitives (button, dialog, table…)
│   ├── shared/                 # PageHeader, StatTile, FilterTabs, Pagination…
│   ├── layout/                 # Sidebar, topbar, command menu, notifications
│   └── <feature>/              # Feature components (inbox, commerce, settings…)
├── lib/
│   ├── ai/                     # Gateway, mock provider, pipeline, types
│   ├── auth/                   # Sessions, password, RBAC context
│   ├── api/                    # Envelope, errors, client
│   ├── services/               # Domain services (one per module)
│   ├── validation/             # Zod schemas
│   ├── constants/              # Enums, RBAC, nav, plans, options
│   ├── jobs/                   # Queue abstraction
│   ├── commerce/               # Pure money math (client-safe)
│   └── utils/                  # Formatting, cn, json helpers
├── middleware.ts               # Edge route protection
prisma/
├── schema.prisma               # Full data model (40+ entities)
└── seed.ts                     # Realistic demo workspace
tests/                          # Unit tests (node:test)
docs/                           # Build conventions
```

---

## 4. Getting started

### Prerequisites
- **Node.js 18.18+** (tested on Node 20/22/24) and npm.

### Setup (3 commands)

```bash
npm install          # install dependencies
cp .env.example .env # (a working dev .env is already included)
npm run setup        # prisma generate + db push + seed demo data
npm run dev          # start on http://localhost:3000
```

Then open **http://localhost:3000** and click **"Try the demo →"** on the login screen.

### Demo credentials

All six roles share the password **`Password123`**:

| Role | Email | Lands on |
|---|---|---|
| Owner | `owner@actioninbox.demo` | Dashboard |
| Admin | `admin@actioninbox.demo` | Dashboard |
| Manager | `manager@actioninbox.demo` | Actions |
| Agent | `agent@actioninbox.demo` | Inbox |
| Finance | `finance@actioninbox.demo` | Invoices |
| Viewer | `viewer@actioninbox.demo` | Analytics |

> Try signing in as different roles to see **role-based access control** in action — the sidebar, controls, and default landing screen all adapt.

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (`prisma generate` + `next build`) |
| `npm start` | Run the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Unit tests (Node test runner) |
| `npm run db:seed` | Seed demo data |
| `npm run db:reset` | Reset DB + reseed |
| `npm run db:studio` | Open Prisma Studio |

---

## 5. Environment variables

See [`.env.example`](.env.example) for the full list. Key ones:

| Variable | Purpose | Dev default |
|---|---|---|
| `DATABASE_URL` | Prisma connection string | `file:./dev.db` (SQLite) |
| `AUTH_SECRET` | JWT signing secret — **change in production** (`openssl rand -base64 48`) | dev placeholder |
| `AI_PROVIDER` | `mock` \| `anthropic` \| `openai` | `mock` |
| `STORAGE_DRIVER` | `local` \| `s3` | `local` |
| `QUEUE_DRIVER` | `inline` \| `redis` | `inline` |
| `BILLING_PROVIDER` | `mock` \| `stripe` \| `paddle` | `mock` |
| `WHATSAPP_*`, `SMTP_*`, `STRIPE_*` | Provider credentials | empty (stubbed) |

**Never hardcode secrets.** All configuration flows through the validated `src/lib/env.ts` schema, which fails fast on invalid values.

---

## 6. Database

- **Dev:** SQLite via `prisma db push` (zero-config, file at `prisma/dev.db`).
- **Prod (PostgreSQL):**
  1. Set `DATABASE_URL` to your Postgres URL.
  2. Change the `datasource` provider in `prisma/schema.prisma` from `sqlite` to `postgresql`.
  3. `npm run db:migrate` to create migrations.
- Money is stored as **integer minor units (cents)** to avoid floating-point error.
- JSON payloads use `String` columns (portable) parsed via `parseJson`; promote to `jsonb` on Postgres if desired.

---

## 7. Implemented modules

**Fully implemented, end-to-end:**

- ✅ **Auth & sessions** — email/password, JWT httpOnly sessions, magic-link/OAuth-ready, forgot-password flow
- ✅ **RBAC** — 6 roles (owner/admin/manager/agent/finance/viewer) with capability-based permissions, enforced server-side on every mutation
- ✅ **Multi-tenancy** — every query scoped by `organization_id`; tenant isolation verified
- ✅ **Onboarding wizard** — business profile, goal, channel, approvals, sample-data loading
- ✅ **Unified Inbox** — filters (unread/unprocessed/needs-review/mine/urgent/low-confidence), search, assignment, "simulate inbound"
- ✅ **AI pipeline** — language detection, transcription, OCR, intent classification, entity extraction, confidence scoring, source evidence (deterministic mock; real providers behind the same interface)
- ✅ **Action review** — 6 decision states (suggested/needs-review/approved/executed/rejected/deferred), approve/edit/reject/defer, feedback capture, audit trail
- ✅ **Quotes** — catalog-aware editor, PDF (print), send, convert-to-invoice, version history
- ✅ **Invoices & payments** — editor, send, record payment, mark paid, follow-up scheduling, overdue tracking
- ✅ **Customers/Vendors** — profiles, history, tags, blocking
- ✅ **Catalog** — products/services with SKU, pricing, tax, stock, and **Roman-Urdu aliases** for AI recognition
- ✅ **Documents** — upload, OCR text, extracted fields, obligation tracking
- ✅ **Tasks & reminders** — assignment, priorities, due dates, status
- ✅ **Workflows** — rule engine (trigger → conditions → actions): auto-assign, label, escalate, notify + templates
- ✅ **Analytics** — volume, automation rate, correction rate, confidence, receivables, cost
- ✅ **Settings** — organization, team & roles (invite/role/deactivate), channels, AI & automation, security & audit, data export
- ✅ **Billing** — plans, usage counters with limits, plan switching
- ✅ **Notifications & audit log** — in-app notifications, immutable audit trail

---

## 8. Pending integrations (abstraction layers ready)

These are stubbed behind clean interfaces so real providers drop in without touching feature code. Each is marked with a `// TODO` in the codebase.

| Integration | Where | What's needed |
|---|---|---|
| **Real AI** (Anthropic/OpenAI) | `src/lib/ai/gateway.ts` | Implement provider class; set `AI_PROVIDER` + API key |
| **WhatsApp Cloud API** | `src/app/api/inbox/ingest`, webhook receiver | Meta credentials; signature verification |
| **Email ingestion / SMTP** | channel abstraction | Forwarding/IMAP + SMTP creds |
| **Object storage** (S3/R2) | storage driver | Set `STORAGE_DRIVER=s3` + creds |
| **Redis / BullMQ** | `src/lib/jobs/queue.ts` | Set `QUEUE_DRIVER=redis` + `REDIS_URL` |
| **Stripe/Paddle billing** | `src/app/api/billing` | Checkout + webhook confirmation |
| **Server-side PDF** | quote/invoice detail | Currently browser print-to-PDF; add a PDF renderer |
| **Email delivery** (invites, resets) | invite/forgot flows | Wire an email provider |

---

## 9. Security

- Passwords hashed with **bcrypt** (cost 12); secrets via validated env only.
- **JWT sessions** in httpOnly, SameSite cookies with DB-backed revocation.
- **RBAC + tenant checks** enforced server-side on every protected route (see `requirePermission`).
- Security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`).
- **Immutable audit log** for auth, AI actions, approvals, sends, billing, and settings changes.
- Input validated with Zod at the API boundary; consistent error envelope avoids leaking internals.
- Data export + (scaffolded) deletion controls for privacy compliance.

---

## 10. Production deployment

**MVP topology (Docker Compose)** — see [`docker-compose.yml`](docker-compose.yml):

- Nginx reverse proxy (HTTPS/HSTS, rate limits) → Next.js app → PostgreSQL + Redis + S3-compatible storage.

**Checklist:**
1. Set a strong `AUTH_SECRET`, real `DATABASE_URL` (Postgres), and provider credentials.
2. Switch Prisma datasource to `postgresql`; run `prisma migrate deploy`.
3. Set `AI_PROVIDER`, `STORAGE_DRIVER=s3`, `QUEUE_DRIVER=redis`, `BILLING_PROVIDER=stripe`.
4. `npm run build && npm start` (or the provided Dockerfile).
5. Configure backups, monitoring (Sentry/OpenTelemetry), and alerting.

---

## 11. Design system

- **Brand:** calm, precise, operational-premium — a *trusted action engine*, not a chatbot.
- **Color:** deep iris/indigo primary, warm amber accent (AI/confidence highlights), warm-slate neutrals, semantic green/amber/red. Full light + dark mode via CSS variables.
- **Type:** Inter stack with tabular numerals for money and metrics.
- **Patterns:** collapsible sidebar, command palette (⌘K), skeleton loaders, empty states with CTAs, toasts, confirmation dialogs for destructive actions, accessible focus states, responsive from mobile to desktop.

---

<div align="center">
Built to be launched — clean architecture, real data models, and a design that feels custom.
</div>
#   A c t i o n I n b o x - A I  
 