import { type NextRequest } from "next/server";
import { handler, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/context";
import { taskSchema } from "@/lib/validation/entities";
import { db } from "@/lib/db";
import { recordAudit } from "@/lib/services/audit";

export const POST = handler(async (req: NextRequest) => {
  const ctx = await requirePermission("task.manage");
  const input = taskSchema.parse(await req.json());

  const task = await db.task.create({
    data: {
      orgId: ctx.org.id,
      title: input.title,
      description: input.description ?? null,
      status: input.status,
      priority: input.priority,
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
      contactId: input.contactId ?? null,
      assigneeId: input.assigneeId ?? null,
      createdById: ctx.user.id,
      sourceType: "manual",
    },
  });
  await recordAudit({ orgId: ctx.org.id, actorId: ctx.user.id, action: "task.created", targetType: "task", targetId: task.id });
  return ok({ id: task.id }, { status: 201 });
});
