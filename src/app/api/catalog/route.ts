import { type NextRequest } from "next/server";
import { handler, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/context";
import { catalogItemSchema } from "@/lib/validation/entities";
import { upsertCatalogItem } from "@/lib/services/catalog";
import { recordAudit } from "@/lib/services/audit";

export const POST = handler(async (req: NextRequest) => {
  const ctx = await requirePermission("catalog.manage");
  const input = catalogItemSchema.parse(await req.json());

  const row = await upsertCatalogItem(ctx.org.id, input);
  await recordAudit({
    orgId: ctx.org.id,
    actorId: ctx.user.id,
    action: "catalog.created",
    targetType: "catalog_item",
    targetId: row.id,
  });

  return ok(row, { status: 201 });
});
