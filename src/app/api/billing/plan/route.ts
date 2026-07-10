import { type NextRequest } from "next/server";
import { z } from "zod";
import { handler, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/constants/plans";
import { recordAudit } from "@/lib/services/audit";

const schema = z.object({ plan: z.enum(["solo", "team", "ops"]) });

// Mock billing (BILLING_PROVIDER=mock). A real Stripe/Paddle checkout would run
// here and the plan would change on webhook confirmation (SRS FR-048).
export const POST = handler(async (req: NextRequest) => {
  const ctx = await requirePermission("billing.manage");
  const { plan } = schema.parse(await req.json());
  const limits = PLANS[plan].limits;
  const period = new Date().toISOString().slice(0, 7);

  await db.subscription.update({
    where: { orgId: ctx.org.id },
    data: { plan, status: "active", seats: limits.seats, currentPeriodEnd: new Date(Date.now() + 30 * 86400000) },
  });

  // Update entitlement limits on usage counters.
  const map: Record<string, number> = {
    ai_actions: limits.aiActions,
    ocr_pages: limits.ocrPages,
    voice_minutes: limits.voiceMinutes,
    storage_mb: limits.storageMb,
    seats: limits.seats,
  };
  for (const [metric, limit] of Object.entries(map)) {
    await db.usageCounter.upsert({
      where: { orgId_metric_period: { orgId: ctx.org.id, metric, period } },
      update: { limit },
      create: { orgId: ctx.org.id, metric, period, used: 0, limit },
    });
  }

  await recordAudit({ orgId: ctx.org.id, actorId: ctx.user.id, action: "billing.plan_changed", meta: { plan } });
  return ok({ plan });
});
