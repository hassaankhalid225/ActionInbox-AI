import { db } from "@/lib/db";
import { parseJson } from "@/lib/utils/json";
import { logger } from "@/lib/logger";
import { recordAudit } from "./audit";
import { notifyRoles } from "./notifications";

// ---------------------------------------------------------------------------
// Lightweight rule engine (TRD §17 — "custom simple rules for MVP").
// Trigger → conditions (all must pass) → actions. Kept intentionally small and
// extensible; a durable engine (Temporal) can replace it later.
// ---------------------------------------------------------------------------

type Condition = { field: string; op: string; value: string };
type Action = { type: string; configJson?: string };
type Context = { inboundItemId?: string; intent?: string; [k: string]: unknown };

function matches(cond: Condition, ctx: Context): boolean {
  const actual = String(ctx[cond.field] ?? "").toLowerCase();
  const expected = cond.value.toLowerCase();
  switch (cond.op) {
    case "eq":
      return actual === expected;
    case "neq":
      return actual !== expected;
    case "contains":
      return actual.includes(expected);
    default:
      return false;
  }
}

export async function evaluateWorkflows(orgId: string, trigger: string, ctx: Context): Promise<void> {
  const rules = await db.workflowRule.findMany({ where: { orgId, trigger, isActive: true } });

  for (const rule of rules) {
    const conditions = parseJson<Condition[]>(rule.conditionsJson, []);
    const actions = parseJson<Action[]>(rule.actionsJson, []);
    const passed = conditions.every((c) => matches(c, ctx));

    if (!passed) {
      await db.workflowExecution.create({ data: { orgId, ruleId: rule.id, status: "skipped" } });
      continue;
    }

    try {
      for (const action of actions) {
        await applyAction(orgId, action, ctx);
      }
      await db.workflowRule.update({ where: { id: rule.id }, data: { runCount: { increment: 1 } } });
      await db.workflowExecution.create({ data: { orgId, ruleId: rule.id, status: "success" } });
      await recordAudit({ orgId, actorType: "system", action: "workflow.executed", targetType: "workflow_rule", targetId: rule.id });
    } catch (err) {
      logger.error("Workflow action failed", { ruleId: rule.id, error: String(err) });
      await db.workflowExecution.create({ data: { orgId, ruleId: rule.id, status: "failed" } });
    }
  }
}

async function applyAction(orgId: string, action: Action, ctx: Context): Promise<void> {
  const config = parseJson<Record<string, string>>(action.configJson ?? "{}", {});
  switch (action.type) {
    case "assign_role": {
      // Assign the inbound item to the first active member of a role.
      if (!ctx.inboundItemId) return;
      const member = await db.membership.findFirst({
        where: { orgId, role: config.role ?? "finance", status: "active" },
      });
      if (member) {
        await db.inboundItem.update({ where: { id: ctx.inboundItemId }, data: { assignedToId: member.userId } });
      }
      break;
    }
    case "add_label": {
      if (!ctx.inboundItemId || !config.label) return;
      const item = await db.inboundItem.findUnique({ where: { id: ctx.inboundItemId } });
      const labels = parseJson<string[]>(item?.labelsJson ?? "[]", []);
      if (!labels.includes(config.label)) labels.push(config.label);
      await db.inboundItem.update({ where: { id: ctx.inboundItemId }, data: { labelsJson: JSON.stringify(labels) } });
      break;
    }
    case "set_priority": {
      if (!ctx.inboundItemId) return;
      await db.inboundItem.update({ where: { id: ctx.inboundItemId }, data: { priority: config.priority ?? "high" } });
      break;
    }
    case "notify_managers": {
      await notifyRoles({
        orgId,
        roles: ["owner", "admin", "manager"],
        type: "processing_error",
        title: config.title ?? "Workflow triggered",
        severity: "warning",
        linkUrl: ctx.inboundItemId ? `/inbox/${ctx.inboundItemId}` : undefined,
      });
      break;
    }
  }
}
