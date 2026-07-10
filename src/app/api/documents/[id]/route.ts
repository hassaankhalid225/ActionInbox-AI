import { type NextRequest } from "next/server";
import { handler, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { Errors } from "@/lib/api/errors";
import { recordAudit } from "@/lib/services/audit";

export const DELETE = handler(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requirePermission("document.manage");

  const document = await db.document.findFirst({ where: { id: params.id, orgId: ctx.org.id } });
  if (!document) throw Errors.notFound();

  // Obligations cascade via the schema relation (onDelete: Cascade).
  await db.document.delete({ where: { id: document.id } });

  await recordAudit({
    orgId: ctx.org.id,
    actorId: ctx.user.id,
    action: "document.deleted",
    targetType: "document",
    targetId: document.id,
    meta: { title: document.title, docType: document.docType },
  });

  return ok({ id: document.id });
});
