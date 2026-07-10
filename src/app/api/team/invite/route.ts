import { type NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { handler, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/context";
import { inviteSchema } from "@/lib/validation/auth";
import { db } from "@/lib/db";
import { Errors } from "@/lib/api/errors";
import { recordAudit } from "@/lib/services/audit";

export const POST = handler(async (req: NextRequest) => {
  const ctx = await requirePermission("member.manage");
  const input = inviteSchema.parse(await req.json());
  const email = input.email.toLowerCase();

  // Already a member?
  const existing = await db.membership.findFirst({ where: { orgId: ctx.org.id, user: { email } } });
  if (existing) throw Errors.conflict("That person is already a member.");

  const token = randomBytes(24).toString("hex");
  const invite = await db.invitation.upsert({
    where: { token },
    update: {},
    create: {
      orgId: ctx.org.id,
      email,
      role: input.role,
      token,
      invitedById: ctx.user.id,
      expiresAt: new Date(Date.now() + 7 * 86400000),
    },
  });

  await recordAudit({ orgId: ctx.org.id, actorId: ctx.user.id, action: "member.invited", meta: { email, role: input.role } });
  // NOTE: email delivery is stubbed. Return the accept link so it can be shared.
  return ok({ id: invite.id, inviteUrl: `/invite/${token}` }, { status: 201 });
});
