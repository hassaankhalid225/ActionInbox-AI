import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { Errors } from "@/lib/api/errors";
import type { CatalogItemInput } from "@/lib/validation/entities";

export type CatalogQuery = {
  search?: string;
  /** Restrict to active items only (filter = "active"). */
  activeOnly?: boolean;
  /** Explicit active state, overrides `activeOnly` — used for the "inactive" filter. */
  isActive?: boolean;
  page?: number;
  pageSize?: number;
};

function buildWhere(orgId: string, opts: CatalogQuery): Prisma.CatalogItemWhereInput {
  const where: Prisma.CatalogItemWhereInput = { orgId };

  if (opts.isActive !== undefined) where.isActive = opts.isActive;
  else if (opts.activeOnly) where.isActive = true;

  if (opts.search?.trim()) {
    const q = opts.search.trim();
    where.OR = [
      { name: { contains: q } },
      { sku: { contains: q } },
      { aliases: { some: { alias: { contains: q } } } },
    ];
  }
  return where;
}

export async function getCatalogItems(orgId: string, opts: CatalogQuery = {}) {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 25;
  const where = buildWhere(orgId, opts);

  const [items, total] = await Promise.all([
    db.catalogItem.findMany({
      where,
      include: { aliases: true },
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.catalogItem.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getCatalogCounts(orgId: string) {
  const [all, active] = await Promise.all([
    db.catalogItem.count({ where: { orgId } }),
    db.catalogItem.count({ where: { orgId, isActive: true } }),
  ]);
  return { all, active, inactive: all - active };
}

export type CatalogItemWithAliases = Prisma.CatalogItemGetPayload<{ include: { aliases: true } }>;

/**
 * Create or update a catalog item and fully replace its aliases.
 * Money (`priceCents`) is expected already in integer minor units from the client.
 * When `id` is provided the item must belong to `orgId` (tenant isolation).
 */
export async function upsertCatalogItem(
  orgId: string,
  input: CatalogItemInput,
  id?: string,
): Promise<CatalogItemWithAliases> {
  const { aliases, ...fields } = input;
  const aliasRows = Array.from(
    new Set(aliases.map((a) => a.trim()).filter(Boolean)),
  ).map((alias) => ({ alias }));

  if (id) {
    const existing = await db.catalogItem.findFirst({ where: { id, orgId }, select: { id: true } });
    if (!existing) throw Errors.notFound("Catalog item not found.");

    return db.$transaction(async (tx) => {
      await tx.catalogAlias.deleteMany({ where: { itemId: id } });
      return tx.catalogItem.update({
        where: { id },
        data: { ...fields, aliases: { create: aliasRows } },
        include: { aliases: true },
      });
    });
  }

  return db.catalogItem.create({
    data: { orgId, ...fields, aliases: { create: aliasRows } },
    include: { aliases: true },
  });
}
