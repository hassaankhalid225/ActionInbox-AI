import { db } from "@/lib/db";

export async function getWorkflowRules(orgId: string) {
  return db.workflowRule.findMany({
    where: { orgId },
    include: { _count: { select: { executions: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTemplates(orgId: string) {
  return db.template.findMany({ where: { orgId }, orderBy: [{ type: "asc" }, { createdAt: "desc" }] });
}
