import { type NextRequest } from "next/server";
import { z } from "zod";
import { handler, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { Errors } from "@/lib/api/errors";
import { recordAudit } from "@/lib/services/audit";

const patchSchema = z.object({ status: z.enum(["scheduled", "sent", "done", "dismissed"]) });

export const PATCH = handler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requirePermission("task.manage");
  const { status } = patchSchema.parse(await req.json());
  const reminder = await db.reminder.findFirst({ where: { id: params.id, orgId: ctx.org.id } });
  if (!reminder) throw Errors.notFound();
  await db.reminder.update({ where: { id: params.id }, data: { status } });
  await recordAudit({ orgId: ctx.org.id, actorId: ctx.user.id, action: `reminder.${status}`, targetType: "reminder", targetId: params.id });
  return ok({ id: params.id });
});

export const DELETE = handler(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requirePermission("task.manage");
  const reminder = await db.reminder.findFirst({ where: { id: params.id, orgId: ctx.org.id } });
  if (!reminder) throw Errors.notFound();
  await db.reminder.delete({ where: { id: params.id } });
  return ok({ ok: true });
});
