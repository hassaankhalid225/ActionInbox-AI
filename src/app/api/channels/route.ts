import { type NextRequest } from "next/server";
import { z } from "zod";
import { handler, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { recordAudit } from "@/lib/services/audit";
import { PLANS, type PlanId } from "@/lib/constants/plans";
import { Errors } from "@/lib/api/errors";

const schema = z.object({ type: z.enum(["whatsapp", "email", "upload"]), label: z.string().min(1).max(80) });

export const POST = handler(async (req: NextRequest) => {
  const ctx = await requirePermission("channel.manage");
  const input = schema.parse(await req.json());

  // Enforce plan channel limit (FR-046).
  const sub = await db.subscription.findUnique({ where: { orgId: ctx.org.id } });
  const limit = PLANS[(sub?.plan as PlanId) ?? "team"].limits.channels;
  const count = await db.channelAccount.count({ where: { orgId: ctx.org.id, status: { not: "disabled" } } });
  if (count >= limit) throw Errors.usageLimit(`Your plan allows ${limit} channels. Upgrade to add more.`);

  const identifier =
    input.type === "whatsapp" ? "+92 3•• •••••••" : input.type === "email" ? `${ctx.org.slug}@${env.EMAIL_INBOUND_DOMAIN}` : null;

  const channel = await db.channelAccount.create({
    data: { orgId: ctx.org.id, type: input.type, label: input.label, status: "connected", identifier, lastEventAt: new Date() },
  });
  await recordAudit({ orgId: ctx.org.id, actorId: ctx.user.id, action: "channel.connected", targetType: "channel_account", targetId: channel.id, meta: { type: input.type } });
  return ok({ id: channel.id }, { status: 201 });
});
