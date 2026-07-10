import { type NextRequest } from "next/server";
import { handler, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/context";
import { reminderSchema } from "@/lib/validation/entities";
import { db } from "@/lib/db";
import { recordAudit } from "@/lib/services/audit";

export const POST = handler(async (req: NextRequest) => {
  const ctx = await requirePermission("task.manage");
  const input = reminderSchema.parse(await req.json());
  const reminder = await db.reminder.create({
    data: {
      orgId: ctx.org.id,
      title: input.title,
      remindAt: new Date(input.remindAt),
      kind: input.kind,
      contactId: input.contactId ?? null,
    },
  });
  await recordAudit({ orgId: ctx.org.id, actorId: ctx.user.id, action: "reminder.created", targetType: "reminder", targetId: reminder.id });
  return ok({ id: reminder.id }, { status: 201 });
});
