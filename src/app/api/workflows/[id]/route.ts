import { type NextRequest } from "next/server";
import { z } from "zod";
import { handler, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { Errors } from "@/lib/api/errors";
import { recordAudit } from "@/lib/services/audit";

const patchSchema = z.object({ isActive: z.boolean() });

export const PATCH = handler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requirePermission("workflow.manage");
  const { isActive } = patchSchema.parse(await req.json());
  const rule = await db.workflowRule.findFirst({ where: { id: params.id, orgId: ctx.org.id } });
  if (!rule) throw Errors.notFound();
  await db.workflowRule.update({ where: { id: params.id }, data: { isActive } });
  await recordAudit({ orgId: ctx.org.id, actorId: ctx.user.id, action: isActive ? "workflow.enabled" : "workflow.disabled", targetType: "workflow_rule", targetId: params.id });
  return ok({ isActive });
});

export const DELETE = handler(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requirePermission("workflow.manage");
  const rule = await db.workflowRule.findFirst({ where: { id: params.id, orgId: ctx.org.id } });
  if (!rule) throw Errors.notFound();
  await db.workflowRule.delete({ where: { id: params.id } });
  return ok({ ok: true });
});
