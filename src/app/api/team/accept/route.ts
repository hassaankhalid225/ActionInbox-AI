import { type NextRequest } from "next/server";
import { z } from "zod";
import { handler, ok } from "@/lib/api/response";
import { db } from "@/lib/db";
import { Errors } from "@/lib/api/errors";
import { hashPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { recordAudit } from "@/lib/services/audit";

const schema = z.object({
  token: z.string().min(10),
  name: z.string().min(2).max(80),
  password: z.string().min(8),
});

// Accept an invitation → create the user (if needed) + membership.
export const POST = handler(async (req: NextRequest) => {
  const input = schema.parse(await req.json());
  const invite = await db.invitation.findUnique({ where: { token: input.token }, include: { org: true } });
  if (!invite || invite.status !== "pending") throw Errors.notFound("This invitation is no longer valid.");
  if (invite.expiresAt < new Date()) throw Errors.badRequest("This invitation has expired.");

  let user = await db.user.findUnique({ where: { email: invite.email } });
  if (!user) {
    user = await db.user.create({
      data: { name: input.name.trim(), email: invite.email, passwordHash: await hashPassword(input.password), emailVerified: true, lastLoginAt: new Date() },
    });
  }

  const existing = await db.membership.findUnique({ where: { userId_orgId: { userId: user.id, orgId: invite.orgId } } });
  if (!existing) {
    await db.membership.create({ data: { userId: user.id, orgId: invite.orgId, role: invite.role, status: "active", isDefault: true } });
  }
  await db.invitation.update({ where: { id: invite.id }, data: { status: "accepted" } });
  await recordAudit({ orgId: invite.orgId, actorId: user.id, action: "member.joined", targetType: "user", targetId: user.id });

  const jwt = await createSession(user.id, { userAgent: req.headers.get("user-agent") ?? undefined });
  await setSessionCookie(jwt);
  return ok({ redirect: "/dashboard" });
});
