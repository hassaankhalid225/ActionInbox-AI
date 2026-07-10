import { type NextRequest } from "next/server";
import { handler, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { Errors } from "@/lib/api/errors";
import { recordAudit } from "@/lib/services/audit";
import { contactSchema } from "@/lib/validation/entities";

export const PATCH = handler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requirePermission("customer.manage");

  const existing = await db.contact.findFirst({ where: { id: params.id, orgId: ctx.org.id } });
  if (!existing) throw Errors.notFound();

  const input = contactSchema.partial().parse(await req.json());

  const data: Record<string, unknown> = {};
  if (input.kind !== undefined) data.kind = input.kind;
  if (input.name !== undefined) data.name = input.name;
  if (input.company !== undefined) data.company = input.company ?? null;
  if (input.phone !== undefined) data.phone = input.phone ?? null;
  if (input.email !== undefined) data.email = input.email ? input.email : null;
  if (input.language !== undefined) data.language = input.language ?? null;
  if (input.tags !== undefined) data.tags = input.tags ?? null;
  if (input.notes !== undefined) data.notes = input.notes ?? null;

  const row = await db.contact.update({ where: { id: existing.id }, data });

  await recordAudit({
    orgId: ctx.org.id,
    actorId: ctx.user.id,
    action: "customer.updated",
    targetType: "contact",
    targetId: row.id,
  });

  return ok(row);
});

export const DELETE = handler(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requirePermission("customer.manage");

  const existing = await db.contact.findFirst({ where: { id: params.id, orgId: ctx.org.id } });
  if (!existing) throw Errors.notFound();

  await db.contact.delete({ where: { id: existing.id } });

  await recordAudit({
    orgId: ctx.org.id,
    actorId: ctx.user.id,
    action: "customer.deleted",
    targetType: "contact",
    targetId: existing.id,
  });

  return ok({ id: existing.id });
});
