import { type NextRequest } from "next/server";
import { z } from "zod";
import { handler, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { Errors } from "@/lib/api/errors";
import { recordAudit } from "@/lib/services/audit";
import { notify } from "@/lib/services/notifications";

const schema = z.object({ assigneeId: z.string().nullable() });

export const POST = handler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requirePermission("inbox.assign");
  const { assigneeId } = schema.parse(await req.json());

  const item = await db.inboundItem.findFirst({ where: { id: params.id, orgId: ctx.org.id } });
  if (!item) throw Errors.notFound();

  // Validate assignee belongs to the org (tenant isolation).
  if (assigneeId) {
    const member = await db.membership.findFirst({ where: { userId: assigneeId, orgId: ctx.org.id, status: "active" } });
    if (!member) throw Errors.badRequest("Assignee is not a member of this workspace.");
  }

  await db.inboundItem.update({ where: { id: item.id }, data: { assignedToId: assigneeId } });
  await recordAudit({ orgId: ctx.org.id, actorId: ctx.user.id, action: "inbox.assigned", targetType: "inbound_item", targetId: item.id, meta: { assigneeId } });

  if (assigneeId && assigneeId !== ctx.user.id) {
    await notify({ orgId: ctx.org.id, userId: assigneeId, type: "assignment", title: "An inbox item was assigned to you", linkUrl: `/inbox/${item.id}`, severity: "info" });
  }
  return ok({ assigneeId });
});
