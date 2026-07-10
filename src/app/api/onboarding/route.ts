import { type NextRequest } from "next/server";
import { z } from "zod";
import { handler, ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { stringifyJson, parseJson } from "@/lib/utils/json";

const stepSchema = z.object({
  step: z.number().int().min(0).max(6),
  profile: z
    .object({
      name: z.string().min(2),
      industry: z.string(),
      country: z.string(),
      currency: z.string(),
      timezone: z.string(),
      teamSize: z.string(),
      primaryLang: z.string(),
      secondaryLang: z.string().nullable().optional(),
    })
    .optional(),
  primaryGoal: z.string().optional(),
  approvals: z
    .object({
      requireApprovalMessages: z.boolean(),
      requireApprovalInvoices: z.boolean(),
      autoCreateTasks: z.boolean(),
      lowConfidenceThreshold: z.number(),
    })
    .optional(),
});

// Persist a single onboarding step.
export const PATCH = handler(async (req: NextRequest) => {
  const ctx = await requireAuth();
  const input = stepSchema.parse(await req.json());

  const data: Record<string, unknown> = { onboardingStep: input.step };

  if (input.profile) {
    Object.assign(data, {
      name: input.profile.name,
      industry: input.profile.industry,
      country: input.profile.country,
      currency: input.profile.currency,
      timezone: input.profile.timezone,
      teamSize: input.profile.teamSize,
      primaryLang: input.profile.primaryLang,
      secondaryLang: input.profile.secondaryLang ?? null,
    });
  }
  if (input.primaryGoal) data.primaryGoal = input.primaryGoal;

  if (input.approvals) {
    const org = await db.organization.findUnique({ where: { id: ctx.org.id } });
    const settings = parseJson<Record<string, unknown>>(org?.settingsJson ?? null, {});
    data.settingsJson = stringifyJson({ ...settings, ...input.approvals });
  }

  await db.organization.update({ where: { id: ctx.org.id }, data });
  return ok({ ok: true });
});
