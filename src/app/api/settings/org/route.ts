import { type NextRequest } from "next/server";
import { z } from "zod";
import { handler, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { parseJson, stringifyJson } from "@/lib/utils/json";
import { recordAudit } from "@/lib/services/audit";

const schema = z.object({
  profile: z
    .object({
      name: z.string().min(2).optional(),
      industry: z.string().optional(),
      country: z.string().optional(),
      currency: z.string().optional(),
      timezone: z.string().optional(),
      primaryLang: z.string().optional(),
      secondaryLang: z.string().nullable().optional(),
      taxId: z.string().nullable().optional(),
      brandColor: z.string().optional(),
    })
    .optional(),
  settings: z
    .object({
      lowConfidenceThreshold: z.number().min(0).max(100).optional(),
      requireApprovalMessages: z.boolean().optional(),
      requireApprovalInvoices: z.boolean().optional(),
      autoCreateTasks: z.boolean().optional(),
      defaultTone: z.string().optional(),
    })
    .optional(),
});

export const PATCH = handler(async (req: NextRequest) => {
  const ctx = await requirePermission("settings.manage");
  const input = schema.parse(await req.json());

  const org = await db.organization.findUniqueOrThrow({ where: { id: ctx.org.id } });
  const data: Record<string, unknown> = {};

  if (input.profile) Object.assign(data, input.profile);
  if (input.settings) {
    const current = parseJson<Record<string, unknown>>(org.settingsJson, {});
    data.settingsJson = stringifyJson({ ...current, ...input.settings });
  }

  await db.organization.update({ where: { id: ctx.org.id }, data });
  await recordAudit({ orgId: ctx.org.id, actorId: ctx.user.id, action: "settings.updated", meta: { keys: Object.keys(data) } });
  return ok({ ok: true });
});
