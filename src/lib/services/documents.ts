import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type DocumentListItem = Prisma.DocumentGetPayload<{
  include: { contact: true; _count: { select: { obligations: true } } };
}>;

function buildWhere(orgId: string, docType?: string, search?: string): Prisma.DocumentWhereInput {
  const where: Prisma.DocumentWhereInput = { orgId };

  if (docType && docType !== "all") {
    if (docType === "other") {
      // Group the long-tail doc types under "Other" alongside quote/id.
      where.docType = { in: ["other", "quote", "id"] };
    } else {
      where.docType = docType;
    }
  }

  if (search?.trim()) {
    const q = search.trim();
    where.OR = [{ title: { contains: q } }, { ocrText: { contains: q } }];
  }
  return where;
}

export async function getDocuments(
  orgId: string,
  opts: { docType?: string; search?: string; page?: number; pageSize?: number },
) {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = opts.pageSize ?? 24;
  const where = buildWhere(orgId, opts.docType, opts.search);

  const [items, total] = await Promise.all([
    db.document.findMany({
      where,
      include: {
        contact: true,
        _count: { select: { obligations: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.document.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getDocumentCounts(orgId: string) {
  const [all, invoice, receipt, contract, notice, payment_proof, other] = await Promise.all([
    db.document.count({ where: { orgId } }),
    db.document.count({ where: { orgId, docType: "invoice" } }),
    db.document.count({ where: { orgId, docType: "receipt" } }),
    db.document.count({ where: { orgId, docType: "contract" } }),
    db.document.count({ where: { orgId, docType: "notice" } }),
    db.document.count({ where: { orgId, docType: "payment_proof" } }),
    db.document.count({ where: { orgId, docType: { in: ["other", "quote", "id"] } } }),
  ]);
  return { all, invoice, receipt, contract, notice, payment_proof, other };
}

export async function getDocument(orgId: string, id: string) {
  return db.document.findFirst({
    where: { id, orgId },
    include: {
      contact: true,
      inboundItem: true,
      obligations: { orderBy: [{ status: "asc" }, { dueAt: "asc" }] },
    },
  });
}

export type DocumentDetail = NonNullable<Awaited<ReturnType<typeof getDocument>>>;
