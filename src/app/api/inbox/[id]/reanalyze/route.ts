import { type NextRequest } from "next/server";
import { handler, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { Errors } from "@/lib/api/errors";
import { enqueue } from "@/lib/jobs/queue";

export const POST = handler(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requirePermission("action.review");
  const item = await db.inboundItem.findFirst({ where: { id: params.id, orgId: ctx.org.id } });
  if (!item) throw Errors.notFound("Inbox item not found.");

  await db.inboundItem.update({ where: { id: item.id }, data: { status: "processing" } });
  enqueue({ type: "reanalyze", itemId: item.id, delayMs: 200 });
  return ok({ status: "processing" });
});
