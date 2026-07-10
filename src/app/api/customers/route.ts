import { type NextRequest } from "next/server";
import { handler, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { recordAudit } from "@/lib/services/audit";
import { contactSchema } from "@/lib/validation/entities";

export const POST = handler(async (req: NextRequest) => {
  const ctx = await requirePermission("customer.manage");
  const input = contactSchema.parse(await req.json());

  const row = await db.contact.create({
    data: {
      orgId: ctx.org.id,
      kind: input.kind,
      name: input.name,
      company: input.company ?? null,
      phone: input.phone ?? null,
      email: input.email ? input.email : null,
      language: input.language ?? null,
      tags: input.tags ?? null,
      notes: input.notes ?? null,
    },
  });

  await recordAudit({
    orgId: ctx.org.id,
    actorId: ctx.user.id,
    action: "customer.created",
    targetType: "contact",
    targetId: row.id,
  });

  return ok(row, { status: 201 });
});
