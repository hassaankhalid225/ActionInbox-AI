import { type NextRequest } from "next/server";
import { z } from "zod";
import { handler, ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { seedSampleData } from "@/lib/services/sample-data";
import { recordAudit } from "@/lib/services/audit";

const schema = z.object({ loadSample: z.boolean().default(true) });

export const POST = handler(async (req: NextRequest) => {
  const ctx = await requireAuth();
  const { loadSample } = schema.parse(await req.json().catch(() => ({})));

  if (loadSample) {
    await seedSampleData(ctx.org.id);
  }

  await db.organization.update({
    where: { id: ctx.org.id },
    data: { onboardedAt: new Date(), onboardingStep: 6 },
  });
  await recordAudit({ orgId: ctx.org.id, actorId: ctx.user.id, action: "onboarding.completed" });

  return ok({ redirect: "/dashboard" });
});
