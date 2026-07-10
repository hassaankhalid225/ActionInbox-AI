import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { Errors } from "@/lib/api/errors";
import { computeTotals, nextQuoteNumber, nextInvoiceNumber } from "./commerce";
import { recordAudit } from "./audit";
import type { AuthContext } from "@/lib/auth/context";
import type { QuoteInput } from "@/lib/validation/entities";

export type QuoteStatusFilter = "all" | "draft" | "sent" | "accepted" | "expired" | "converted";

export async function getQuotes(orgId: string, opts: { status?: QuoteStatusFilter; search?: string; page?: number; pageSize?: number }) {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 25;
  const where: Prisma.QuoteWhereInput = { orgId };
  if (opts.status && opts.status !== "all") where.status = opts.status;
  if (opts.search?.trim()) {
    where.OR = [{ number: { contains: opts.search } }, { contact: { is: { name: { contains: opts.search } } } }];
  }
  const [items, total] = await Promise.all([
    db.quote.findMany({ where, include: { contact: true, _count: { select: { items: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    db.quote.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export async function getQuoteCounts(orgId: string) {
  const rows = await db.quote.groupBy({ by: ["status"], where: { orgId }, _count: true });
  const base = { all: 0, draft: 0, sent: 0, accepted: 0, expired: 0, converted: 0 } as Record<string, number>;
  for (const r of rows) {
    base[r.status] = r._count;
    base.all += r._count;
  }
  return base;
}

export async function getQuote(orgId: string, id: string) {
  return db.quote.findFirst({ where: { id, orgId }, include: { contact: true, items: true, invoices: true } });
}

export async function createQuote(ctx: AuthContext, input: QuoteInput) {
  const t = computeTotals(input.items, input.discountCents);
  const number = await nextQuoteNumber(ctx.org.id);
  const quote = await db.quote.create({
    data: {
      orgId: ctx.org.id,
      number,
      contactId: input.contactId ?? null,
      currency: input.currency,
      notes: input.notes,
      terms: input.terms,
      validUntil: input.validUntil ? new Date(input.validUntil) : null,
      subtotalCents: t.subtotalCents,
      taxCents: t.taxCents,
      discountCents: t.discountCents,
      totalCents: t.totalCents,
      items: { create: t.lines.map((l) => ({ name: l.name, description: l.description ?? null, quantity: l.quantity, unitPriceCents: l.unitPriceCents, taxPercent: l.taxPercent, lineTotalCents: l.lineTotalCents })) },
    },
  });
  await recordAudit({ orgId: ctx.org.id, actorId: ctx.user.id, action: "quote.created", targetType: "quote", targetId: quote.id });
  return quote;
}

export async function updateQuote(ctx: AuthContext, id: string, input: QuoteInput) {
  const existing = await db.quote.findFirst({ where: { id, orgId: ctx.org.id } });
  if (!existing) throw Errors.notFound("Quote not found.");
  const t = computeTotals(input.items, input.discountCents);
  // Preserve version history: bump version if it was already sent (BR-005).
  const version = existing.status === "draft" ? existing.version : existing.version + 1;
  await db.quoteItem.deleteMany({ where: { quoteId: id } });
  const quote = await db.quote.update({
    where: { id },
    data: {
      contactId: input.contactId ?? null,
      currency: input.currency,
      notes: input.notes,
      terms: input.terms,
      validUntil: input.validUntil ? new Date(input.validUntil) : null,
      subtotalCents: t.subtotalCents,
      taxCents: t.taxCents,
      discountCents: t.discountCents,
      totalCents: t.totalCents,
      version,
      items: { create: t.lines.map((l) => ({ name: l.name, description: l.description ?? null, quantity: l.quantity, unitPriceCents: l.unitPriceCents, taxPercent: l.taxPercent, lineTotalCents: l.lineTotalCents })) },
    },
  });
  await recordAudit({ orgId: ctx.org.id, actorId: ctx.user.id, action: "quote.updated", targetType: "quote", targetId: id });
  return quote;
}

export async function sendQuote(ctx: AuthContext, id: string) {
  const quote = await db.quote.findFirst({ where: { id, orgId: ctx.org.id } });
  if (!quote) throw Errors.notFound("Quote not found.");
  await db.quote.update({ where: { id }, data: { status: "sent", sentAt: new Date() } });
  await recordAudit({ orgId: ctx.org.id, actorId: ctx.user.id, action: "quote.sent", targetType: "quote", targetId: id });
}

export async function setQuoteStatus(ctx: AuthContext, id: string, status: string) {
  const quote = await db.quote.findFirst({ where: { id, orgId: ctx.org.id } });
  if (!quote) throw Errors.notFound("Quote not found.");
  await db.quote.update({ where: { id }, data: { status } });
  await recordAudit({ orgId: ctx.org.id, actorId: ctx.user.id, action: `quote.${status}`, targetType: "quote", targetId: id });
}

export async function convertQuoteToInvoice(ctx: AuthContext, id: string) {
  const quote = await db.quote.findFirst({ where: { id, orgId: ctx.org.id }, include: { items: true } });
  if (!quote) throw Errors.notFound("Quote not found.");
  const number = await nextInvoiceNumber(ctx.org.id);
  const invoice = await db.invoice.create({
    data: {
      orgId: ctx.org.id,
      number,
      contactId: quote.contactId,
      quoteId: quote.id,
      status: "draft",
      currency: quote.currency,
      subtotalCents: quote.subtotalCents,
      taxCents: quote.taxCents,
      discountCents: quote.discountCents,
      totalCents: quote.totalCents,
      dueAt: new Date(Date.now() + 14 * 86400000),
      notes: quote.notes,
      terms: quote.terms,
      items: { create: quote.items.map((i) => ({ name: i.name, description: i.description, quantity: i.quantity, unitPriceCents: i.unitPriceCents, taxPercent: i.taxPercent, lineTotalCents: i.lineTotalCents })) },
    },
  });
  await db.quote.update({ where: { id }, data: { status: "converted" } });
  await recordAudit({ orgId: ctx.org.id, actorId: ctx.user.id, action: "quote.converted", targetType: "invoice", targetId: invoice.id, meta: { quoteId: id } });
  return invoice;
}
