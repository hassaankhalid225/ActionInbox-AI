import { type NextRequest } from "next/server";
import { z } from "zod";
import { handler, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { Errors } from "@/lib/api/errors";
import { recordAudit } from "@/lib/services/audit";
import { PRIORITIES, TASK_STATUS } from "@/lib/constants/enums";

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(TASK_STATUS).optional(),
  priority: z.enum(PRIORITIES).optional(),
  dueAt: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  contactId: z.string().nullable().optional(),
});

export const PATCH = handler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requirePermission("task.manage");
  const input = patchSchema.parse(await req.json());

  const task = await db.task.findFirst({ where: { id: params.id, orgId: ctx.org.id } });
  if (!task) throw Errors.notFound("Task not found.");

  if (input.assigneeId) {
    const member = await db.membership.findFirst({ where: { userId: input.assigneeId, orgId: ctx.org.id, status: "active" } });
    if (!member) throw Errors.badRequest("Assignee is not a workspace member.");
  }

  await db.task.update({
    where: { id: params.id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
      ...(input.contactId !== undefined ? { contactId: input.contactId } : {}),
      ...(input.dueAt !== undefined ? { dueAt: input.dueAt ? new Date(input.dueAt) : null } : {}),
      ...(input.status !== undefined ? { status: input.status, completedAt: input.status === "done" ? new Date() : null } : {}),
    },
  });
  await recordAudit({ orgId: ctx.org.id, actorId: ctx.user.id, action: "task.updated", targetType: "task", targetId: params.id });
  return ok({ id: params.id });
});

export const DELETE = handler(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requirePermission("task.manage");
  const task = await db.task.findFirst({ where: { id: params.id, orgId: ctx.org.id } });
  if (!task) throw Errors.notFound();
  await db.task.delete({ where: { id: params.id } });
  await recordAudit({ orgId: ctx.org.id, actorId: ctx.user.id, action: "task.deleted", targetType: "task", targetId: params.id });
  return ok({ ok: true });
});
