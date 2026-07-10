import { handler, ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/context";
import { db } from "@/lib/db";

export const POST = handler(async () => {
  const ctx = await requireAuth();
  await db.notification.updateMany({
    where: { orgId: ctx.org.id, userId: ctx.user.id, isRead: false },
    data: { isRead: true },
  });
  return ok({ ok: true });
});
