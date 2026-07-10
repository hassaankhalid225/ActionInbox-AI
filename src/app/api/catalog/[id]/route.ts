import { type NextRequest } from "next/server";
import { handler, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { Errors } from "@/lib/api/errors";
import { catalogItemSchema } from "@/lib/validation/entities";
import { upsertCatalogItem } from "@/lib/services/catalog";
import { recordAudit } from "@/lib/services/audit";

export const PATCH = handler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requirePermission("catalog.manage");
  const input = catalogItemSchema.parse(await req.json());

  const row = await upsertCatalogItem(ctx.org.id, input, params.id);
  await recordAudit({
    orgId: ctx.org.id,
    actorId: ctx.user.id,
    action: "catalog.updated",
    targetType: "catalog_item",
    targetId: row.id,
  });

  return ok(row);
});

export const DELETE = handler(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requirePermission("catalog.manage");

  const existing = await db.catalogItem.findFirst({ where: { id: params.id, orgId: ctx.org.id }, select: { id: true } });
  if (!existing) throw Errors.notFound("Catalog item not found.");

  await db.catalogItem.delete({ where: { id: existing.id } });
  await recordAudit({
    orgId: ctx.org.id,
    actorId: ctx.user.id,
    action: "catalog.deleted",
    targetType: "catalog_item",
    targetId: existing.id,
  });

  return ok({ id: existing.id });
});
