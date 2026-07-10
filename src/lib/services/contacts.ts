import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type ContactKind = "customer" | "vendor" | "lead";

export type ContactListItem = Prisma.ContactGetPayload<{
  include: { _count: { select: { quotes: true; invoices: true; tasks: true } } };
}>;

function buildWhere(orgId: string, kind?: string, search?: string): Prisma.ContactWhereInput {
  const where: Prisma.ContactWhereInput = { orgId };

  if (kind && kind !== "all") where.kind = kind;

  if (search?.trim()) {
    const q = search.trim();
    where.OR = [
      { name: { contains: q } },
      { company: { contains: q } },
      { phone: { contains: q } },
      { email: { contains: q } },
    ];
  }
  return where;
}

export async function getContacts(
  orgId: string,
  opts: { kind?: string; search?: string; page?: number; pageSize?: number },
) {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = opts.pageSize ?? 25;
  const where = buildWhere(orgId, opts.kind, opts.search);

  const [items, total] = await Promise.all([
    db.contact.findMany({
      where,
      include: {
        _count: { select: { quotes: true, invoices: true, tasks: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.contact.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getContactCounts(orgId: string) {
  const [all, customer, vendor, lead] = await Promise.all([
    db.contact.count({ where: { orgId } }),
    db.contact.count({ where: { orgId, kind: "customer" } }),
    db.contact.count({ where: { orgId, kind: "vendor" } }),
    db.contact.count({ where: { orgId, kind: "lead" } }),
  ]);
  return { all, customer, vendor, lead };
}

export async function getContact(orgId: string, id: string) {
  return db.contact.findFirst({
    where: { id, orgId },
    include: {
      quotes: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      tasks: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { assignee: true },
      },
      conversations: {
        orderBy: { lastMessageAt: "desc" },
        take: 5,
        include: {
          items: { orderBy: { receivedAt: "desc" }, take: 1 },
        },
      },
      documents: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      _count: { select: { quotes: true, invoices: true, tasks: true, documents: true } },
    },
  });
}

export type ContactDetail = NonNullable<Awaited<ReturnType<typeof getContact>>>;
