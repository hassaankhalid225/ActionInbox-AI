import { type NextRequest } from "next/server";
import { z } from "zod";
import { handler, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { Errors } from "@/lib/api/errors";
import { recordAudit } from "@/lib/services/audit";

const schema = z.object({ status: z.enum(["connected", "disabled"]) });

export const PATCH = handler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requirePermission("channel.manage");
  const { status } = schema.parse(await req.json());
  const channel = await db.channelAccount.findFirst({ where: { id: params.id, orgId: ctx.org.id } });
  if (!channel) throw Errors.notFound();
  await db.channelAccount.update({ where: { id: params.id }, data: { status } });
  await recordAudit({ orgId: ctx.org.id, actorId: ctx.user.id, action: `channel.${status === "connected" ? "enabled" : "disabled"}`, targetType: "channel_account", targetId: params.id });
  return ok({ status });
});

export const DELETE = handler(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requirePermission("channel.manage");
  const channel = await db.channelAccount.findFirst({ where: { id: params.id, orgId: ctx.org.id } });
  if (!channel) throw Errors.notFound();
  await db.channelAccount.update({ where: { id: params.id }, data: { status: "disabled" } });
  return ok({ ok: true });
});
