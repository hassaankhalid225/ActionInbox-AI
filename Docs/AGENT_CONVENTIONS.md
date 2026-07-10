# ActionInbox AI — Build Conventions (for module authors)

Next.js 14 App Router + TypeScript (strict) + Tailwind + Prisma (SQLite dev). Path alias `@/` → `src/`.

## Golden rules
- **Tenant isolation:** every DB query MUST be scoped by `orgId` from the auth context. Never trust a client-supplied orgId.
- **Server-side RBAC:** every mutating API route calls `requirePermission("<perm>")`. List/read pages use `requireAuth()`.
- **Money is integer cents.** Use `formatMoney(cents, currency)` to display, `parseMoneyToCents` to read input.
- **Validate with Zod** (schemas live in `src/lib/validation/entities.ts`). Parse request bodies before touching the DB.
- **Enums are strings** validated by Zod (see `src/lib/constants/enums.ts`). No Prisma enums.
- Pages are Server Components by default; add `export const dynamic = "force-dynamic"` on data pages. Interactive bits are `"use client"` components.

## Auth / context (server)
```ts
import { requireAuth, requirePermission, can } from "@/lib/auth/context";
const ctx = await requireAuth();          // ctx.user.{id,name,email}, ctx.org.{id,name,currency,...}, ctx.role
```
Permissions: `customer.manage`, `catalog.manage`, `task.manage`, `document.manage`, `quote.manage`, `invoice.manage`, `payment.verify`, `inbox.view`, `action.review`, `analytics.view`, `settings.manage`, `billing.manage`, `member.manage`, `channel.manage`, `template.manage`, `workflow.manage`, `audit.view`.

## API route pattern
```ts
import { handler, ok, pageParams, paginate } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/context";
export const POST = handler(async (req, { params }) => {
  const ctx = await requirePermission("customer.manage");
  const input = someSchema.parse(await req.json());
  const row = await db.contact.create({ data: { orgId: ctx.org.id, ...input } });
  await recordAudit({ orgId: ctx.org.id, actorId: ctx.user.id, action: "customer.created", targetType: "contact", targetId: row.id });
  return ok(row, { status: 201 });
});
```
`handler()` wraps errors into the envelope. Throw `Errors.notFound()/forbidden()/badRequest()` from `@/lib/api/errors`.
Audit: `import { recordAudit } from "@/lib/services/audit"`.

## Client API calls
```ts
import { api, ApiError } from "@/lib/api/client";   // api.get/post/patch/del — returns unwrapped `data`
import { toast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";        // router.refresh() after mutations
```

## UI components (import from @/components/ui/*)
- `Button` variant: primary|secondary|outline|ghost|danger|success|subtle|link; size sm|md|lg|icon; prop `loading`.
- `Input`, `Textarea` (prop `leftIcon`, `error`); `Field` (label+error wrapper from `ui/label`), `Label`.
- `Select, SelectTrigger, SelectValue, SelectContent, SelectItem` (Radix; value/onValueChange).
- `Switch`, `Checkbox`.
- `Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter` (`interactive` prop).
- `Badge` variant neutral|primary|accent|success|warning|danger|info|outline, size sm|md, prop `dot`.
- `Dialog, DialogTrigger, DialogContent(size sm|md|lg|xl), DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose`.
- `Sheet, SheetTrigger, SheetContent(side, width), SheetHeader, SheetBody, SheetFooter, SheetTitle`.
- `DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem(destructive), DropdownMenuLabel, DropdownMenuSeparator`.
- `Tabs, TabsList, TabsTrigger, TabsContent`.
- `Tooltip` (`content` prop), `Popover, PopoverTrigger, PopoverContent`.
- `DataTable, THead, TBody, TR, TH, TD` (from `ui/table`).
- `Avatar` ({name,color?,size xs|sm|md|lg}), `Skeleton, SkeletonRows`, `Spinner, LoadingBlock`, `Progress`.
- `EmptyState` ({icon,title,description,action,compact}).
- `ConfirmDialog` ({open,onOpenChange,title,description,onConfirm,variant,loading}).
- Status badges from `ui/status`: `StatusBadge({status})`, `PriorityBadge({priority})`, `IntentBadge({intent})`, `ConfidenceBadge({value})`, `ConfidenceMeter({value})`.

## Shared components (@/components/shared/*)
- `PageHeader` ({title, description, actions}).
- `StatTile` ({label, value, icon, tone, hint, href, delta}).
- `FilterTabs` ({tabs:[{key,label,count}], active, basePath, extraParams}).
- `SearchInput` ({placeholder, paramKey}).
- `Pagination` ({page,total,pageSize,basePath,params}).
- `ActionIcon` ({type}) from `@/components/shared/action-icon`.

## Utils (@/lib/utils/format)
`formatMoney, parseMoneyToCents, formatNumber, formatPercent, formatDate, formatDateTime, formatRelative, timeAgo, dueLabel, initials, titleCase, truncate`.
JSON string columns: `parseJson(str, fallback)`, `stringifyJson(v)` from `@/lib/utils/json`.

## Prisma models (see prisma/schema.prisma) — key ones
Contact(kind customer|vendor|lead), CatalogItem + CatalogAlias, Quote + QuoteItem, Invoice + InvoiceItem + PaymentEvent, Task, Reminder, Document + Obligation, WorkflowRule, Template, Note, Notification, AuditLog, Subscription, UsageCounter.

## Design language
Indigo primary + amber accent, warm-slate neutrals, rounded-xl cards, soft shadows, tabular-nums for money (`className="tabnum"`). Always include loading, empty, and error states. Responsive: mobile-first, cards stack, tables scroll in `overflow-x-auto`. Keep it premium and consistent with existing pages (see `src/app/(app)/inbox/page.tsx` and `dashboard/page.tsx`).

Do NOT run `next build` or the dev server. Just write clean, type-correct files.
