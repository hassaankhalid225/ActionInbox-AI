import { type NextRequest } from "next/server";
import { z } from "zod";
import { handler, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { Errors } from "@/lib/api/errors";
import { recordAudit } from "@/lib/services/audit";

const schema = z.object({ status: z.enum(["open", "done", "dismissed"]) });

export const PATCH = handler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requirePermission("document.manage");
  const { status } = schema.parse(await req.json());

  const obligation = await db.obligation.findFirst({ where: { id: params.id, orgId: ctx.org.id } });
  if (!obligation) throw Errors.notFound();

  await db.obligation.update({ where: { id: obligation.id }, data: { status } });

  await recordAudit({
    orgId: ctx.org.id,
    actorId: ctx.user.id,
    action: "obligation.updated",
    targetType: "obligation",
    targetId: obligation.id,
    meta: { status },
  });

  return ok({ id: obligation.id, status });
});
