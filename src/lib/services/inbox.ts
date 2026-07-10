import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type InboxFilter = "all" | "unread" | "unprocessed" | "mine" | "urgent" | "low_confidence" | "needs_review";

function buildWhere(orgId: string, filter: InboxFilter, userId: string, search?: string): Prisma.InboundItemWhereInput {
  const where: Prisma.InboundItemWhereInput = { orgId };

  switch (filter) {
    case "unread":
      where.isRead = false;
      break;
    case "unprocessed":
      where.status = { in: ["received", "processing"] };
      break;
    case "mine":
      where.assignedToId = userId;
      break;
    case "urgent":
      where.priority = "urgent";
      break;
    case "low_confidence":
      where.OR = [{ status: "needs_review" }, { confidence: { lt: 60 } }];
      break;
    case "needs_review":
      where.status = "needs_review";
      break;
  }

  if (search?.trim()) {
    const q = search.trim();
    where.AND = [
      {
        OR: [
          { bodyText: { contains: q } },
          { fromIdentifier: { contains: q } },
          { contact: { is: { name: { contains: q } } } },
        ],
      },
    ];
  }
  return where;
}

export async function getInboxItems(
  orgId: string,
  opts: { filter: InboxFilter; userId: string; search?: string; page?: number; pageSize?: number },
) {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 25;
  const where = buildWhere(orgId, opts.filter, opts.userId, opts.search);

  const [items, total] = await Promise.all([
    db.inboundItem.findMany({
      where,
      include: {
        contact: true,
        attachments: true,
        assignedTo: true,
        analysis: { select: { intent: true, confidence: true, summary: true } },
        _count: { select: { suggestions: true } },
      },
      orderBy: { receivedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.inboundItem.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getInboxCounts(orgId: string, userId: string) {
  const [all, unread, unprocessed, mine, urgent, lowConfidence] = await Promise.all([
    db.inboundItem.count({ where: { orgId } }),
    db.inboundItem.count({ where: { orgId, isRead: false } }),
    db.inboundItem.count({ where: { orgId, status: { in: ["received", "processing"] } } }),
    db.inboundItem.count({ where: { orgId, assignedToId: userId } }),
    db.inboundItem.count({ where: { orgId, priority: "urgent" } }),
    db.inboundItem.count({ where: { orgId, OR: [{ status: "needs_review" }, { confidence: { lt: 60 } }] } }),
  ]);
  return { all, unread, unprocessed, mine, urgent, low_confidence: lowConfidence };
}

export async function getInboxItem(orgId: string, id: string) {
  return db.inboundItem.findFirst({
    where: { id, orgId },
    include: {
      contact: true,
      assignedTo: true,
      channel: true,
      conversation: true,
      attachments: true,
      analysis: { include: { entities: true } },
      suggestions: {
        orderBy: [{ state: "asc" }, { confidence: "desc" }],
        include: { events: { include: { actor: true }, orderBy: { createdAt: "desc" } } },
      },
    },
  });
}

export async function markInboxRead(orgId: string, id: string) {
  await db.inboundItem.updateMany({ where: { id, orgId }, data: { isRead: true } });
}
