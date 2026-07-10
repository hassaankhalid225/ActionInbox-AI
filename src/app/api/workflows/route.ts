import { type NextRequest } from "next/server";
import { handler, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/context";
import { workflowRuleSchema } from "@/lib/validation/entities";
import { db } from "@/lib/db";
import { stringifyJson } from "@/lib/utils/json";
import { recordAudit } from "@/lib/services/audit";

export const POST = handler(async (req: NextRequest) => {
  const ctx = await requirePermission("workflow.manage");
  const input = workflowRuleSchema.parse(await req.json());
  const rule = await db.workflowRule.create({
    data: {
      orgId: ctx.org.id,
      name: input.name,
      description: input.description ?? null,
      trigger: input.trigger,
      isActive: input.isActive,
      requiresApproval: input.requiresApproval,
      conditionsJson: stringifyJson(input.conditions),
      actionsJson: stringifyJson(input.actions),
    },
  });
  await recordAudit({ orgId: ctx.org.id, actorId: ctx.user.id, action: "workflow.created", targetType: "workflow_rule", targetId: rule.id });
  return ok({ id: rule.id }, { status: 201 });
});
