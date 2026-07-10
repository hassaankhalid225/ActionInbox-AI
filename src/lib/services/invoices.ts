import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { Errors } from "@/lib/api/errors";
import { computeTotals, nextInvoiceNumber } from "./commerce";
import { recordAudit } from "./audit";
import { notifyRoles } from "./notifications";
import type { AuthContext } from "@/lib/auth/context";
import type { InvoiceInput } from "@/lib/validation/entities";

export type InvoiceStatusFilter = "all" | "draft" | "sent" | "paid" | "partial" | "overdue" | "void";

export async function getInvoices(orgId: string, opts: { status?: InvoiceStatusFilter; search?: string; page?: number; pageSize?: number }) {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 25;
  const where: Prisma.InvoiceWhereInput = { orgId };
  if (opts.status && opts.status !== "all") where.status = opts.status;
  if (opts.search?.trim()) {
    where.OR = [{ number: { contains: opts.search } }, { contact: { is: { name: { contains: opts.search } } } }];
  }
  const [items, total, agg] = await Promise.all([
    db.invoice.findMany({ where, include: { contact: true }, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    db.invoice.count({ where }),
    db.invoice.aggregate({ where: { orgId, status: { in: ["sent", "partial", "overdue"] } }, _sum: { totalCents: true, paidCents: true } }),
  ]);
  const outstanding = (agg._sum.totalCents ?? 0) - (agg._sum.paidCents ?? 0);
  return { items, total, page, pageSize, outstanding };
}

export async function getInvoiceCounts(orgId: string) {
  const rows = await db.invoice.groupBy({ by: ["status"], where: { orgId }, _count: true });
  const base = { all: 0, draft: 0, sent: 0, paid: 0, partial: 0, overdue: 0, void: 0 } as Record<string, number>;
  for (const r of rows) {
    base[r.status] = r._count;
    base.all += r._count;
  }
  return base;
}

export async function getInvoice(orgId: string, id: string) {
  return db.invoice.findFirst({ where: { id, orgId }, include: { contact: true, items: true, quote: true, payments: true } });
}

export async function createInvoice(ctx: AuthContext, input: InvoiceInput) {
  const t = computeTotals(input.items, input.discountCents);
  const number = await nextInvoiceNumber(ctx.org.id);
  const invoice = await db.invoice.create({
    data: {
      orgId: ctx.org.id,
      number,
      contactId: input.contactId ?? null,
      quoteId: input.quoteId ?? null,
      currency: input.currency,
      notes: input.notes,
      terms: input.terms,
      dueAt: input.dueAt ? new Date(input.dueAt) : new Date(Date.now() + 14 * 86400000),
      subtotalCents: t.subtotalCents,
      taxCents: t.taxCents,
      discountCents: t.discountCents,
      totalCents: t.totalCents,
      items: { create: t.lines.map((l) => ({ name: l.name, description: l.description ?? null, quantity: l.quantity, unitPriceCents: l.unitPriceCents, taxPercent: l.taxPercent, lineTotalCents: l.lineTotalCents })) },
    },
  });
  await recordAudit({ orgId: ctx.org.id, actorId: ctx.user.id, action: "invoice.created", targetType: "invoice", targetId: invoice.id });
  return invoice;
}

export async function updateInvoice(ctx: AuthContext, id: string, input: InvoiceInput) {
  const existing = await db.invoice.findFirst({ where: { id, orgId: ctx.org.id } });
  if (!existing) throw Errors.notFound("Invoice not found.");
  const t = computeTotals(input.items, input.discountCents);
  const version = existing.status === "draft" ? existing.version : existing.version + 1;
  await db.invoiceItem.deleteMany({ where: { invoiceId: id } });
  const invoice = await db.invoice.update({
    where: { id },
    data: {
      contactId: input.contactId ?? null,
      currency: input.currency,
      notes: input.notes,
      terms: input.terms,
      dueAt: input.dueAt ? new Date(input.dueAt) : existing.dueAt,
      subtotalCents: t.subtotalCents,
      taxCents: t.taxCents,
      discountCents: t.discountCents,
      totalCents: t.totalCents,
      version,
      items: { create: t.lines.map((l) => ({ name: l.name, description: l.description ?? null, quantity: l.quantity, unitPriceCents: l.unitPriceCents, taxPercent: l.taxPercent, lineTotalCents: l.lineTotalCents })) },
    },
  });
  await recordAudit({ orgId: ctx.org.id, actorId: ctx.user.id, action: "invoice.updated", targetType: "invoice", targetId: id });
  return invoice;
}

export async function sendInvoice(ctx: AuthContext, id: string) {
  const invoice = await db.invoice.findFirst({ where: { id, orgId: ctx.org.id } });
  if (!invoice) throw Errors.notFound("Invoice not found.");
  await db.invoice.update({ where: { id }, data: { status: "sent", sentAt: new Date() } });
  await recordAudit({ orgId: ctx.org.id, actorId: ctx.user.id, action: "invoice.sent", targetType: "invoice", targetId: id });
}

/** Record a payment (SRS FR-020/021, App Flow §9) and recompute status. */
export async function recordPayment(ctx: AuthContext, id: string, input: { amountCents: number; method: string; reference?: string | null }) {
  const invoice = await db.invoice.findFirst({ where: { id, orgId: ctx.org.id } });
  if (!invoice) throw Errors.notFound("Invoice not found.");

  await db.paymentEvent.create({
    data: { orgId: ctx.org.id, invoiceId: id, amountCents: input.amountCents, method: input.method, reference: input.reference ?? null, status: "verified" },
  });

  const paidCents = invoice.paidCents + input.amountCents;
  const status = paidCents >= invoice.totalCents ? "paid" : paidCents > 0 ? "partial" : invoice.status;
  await db.invoice.update({ where: { id }, data: { paidCents, status } });
  await recordAudit({ orgId: ctx.org.id, actorId: ctx.user.id, action: "invoice.payment_recorded", targetType: "invoice", targetId: id, meta: { amountCents: input.amountCents } });
  return { paidCents, status };
}

export async function markInvoicePaid(ctx: AuthContext, id: string) {
  const invoice = await db.invoice.findFirst({ where: { id, orgId: ctx.org.id } });
  if (!invoice) throw Errors.notFound("Invoice not found.");
  const remaining = invoice.totalCents - invoice.paidCents;
  if (remaining > 0) return recordPayment(ctx, id, { amountCents: remaining, method: "manual", reference: "Marked paid" });
  await db.invoice.update({ where: { id }, data: { status: "paid" } });
  return { paidCents: invoice.paidCents, status: "paid" };
}

export async function voidInvoice(ctx: AuthContext, id: string) {
  const invoice = await db.invoice.findFirst({ where: { id, orgId: ctx.org.id } });
  if (!invoice) throw Errors.notFound("Invoice not found.");
  await db.invoice.update({ where: { id }, data: { status: "void" } });
  await recordAudit({ orgId: ctx.org.id, actorId: ctx.user.id, action: "invoice.voided", targetType: "invoice", targetId: id });
}

/** Schedule a payment follow-up reminder (App Flow §9). */
export async function scheduleFollowup(ctx: AuthContext, id: string) {
  const invoice = await db.invoice.findFirst({ where: { id, orgId: ctx.org.id }, include: { contact: true } });
  if (!invoice) throw Errors.notFound("Invoice not found.");
  const reminder = await db.reminder.create({
    data: {
      orgId: ctx.org.id,
      title: `Payment follow-up: ${invoice.number} (${invoice.contact?.name ?? "customer"})`,
      remindAt: new Date(Date.now() + 2 * 86400000),
      kind: "payment",
      contactId: invoice.contactId,
      relatedType: "invoice",
      relatedId: id,
    },
  });
  await notifyRoles({ orgId: ctx.org.id, roles: ["owner", "finance"], type: "overdue", title: `Follow-up scheduled for ${invoice.number}`, severity: "info", linkUrl: `/invoices/${id}` });
  await recordAudit({ orgId: ctx.org.id, actorId: ctx.user.id, action: "invoice.followup_scheduled", targetType: "invoice", targetId: id });
  return reminder;
}
