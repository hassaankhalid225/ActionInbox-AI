import { type NextRequest } from "next/server";
import { z } from "zod";
import { handler, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { Errors } from "@/lib/api/errors";
import { recordAudit } from "@/lib/services/audit";
import { ROLES } from "@/lib/constants/enums";

// `id` here is the userId of the member within the current org.
const patchSchema = z.object({ role: z.enum(ROLES).optional(), status: z.enum(["active", "suspended"]).optional() });

export const PATCH = handler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requirePermission("member.manage");
  const input = patchSchema.parse(await req.json());

  const membership = await db.membership.findFirst({ where: { orgId: ctx.org.id, userId: params.id } });
  if (!membership) throw Errors.notFound("Member not found.");

  // Guardrails: don't lock out the last owner; only an owner can grant owner.
  if (membership.role === "owner" && input.role && input.role !== "owner") {
    const owners = await db.membership.count({ where: { orgId: ctx.org.id, role: "owner", status: "active" } });
    if (owners <= 1) throw Errors.badRequest("You cannot remove the last owner.");
  }
  if (input.role === "owner" && ctx.role !== "owner") throw Errors.forbidden("Only an owner can grant the owner role.");

  await db.membership.update({
    where: { id: membership.id },
    data: { ...(input.role ? { role: input.role } : {}), ...(input.status ? { status: input.status } : {}) },
  });
  await recordAudit({ orgId: ctx.org.id, actorId: ctx.user.id, action: "member.updated", targetType: "user", targetId: params.id, meta: input });
  return ok({ ok: true });
});
