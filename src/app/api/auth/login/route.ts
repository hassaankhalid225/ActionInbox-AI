import { type NextRequest } from "next/server";
import { handler, ok } from "@/lib/api/response";
import { loginSchema } from "@/lib/validation/auth";
import { authenticate } from "@/lib/services/account";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ROLE_HOME } from "@/lib/constants/rbac";
import type { Role } from "@/lib/constants/enums";

export const POST = handler(async (req: NextRequest) => {
  const body = await req.json();
  const input = loginSchema.parse(body);

  const userId = await authenticate(input.email, input.password);
  const jwt = await createSession(userId, {
    userAgent: req.headers.get("user-agent") ?? undefined,
    ip: req.headers.get("x-forwarded-for") ?? undefined,
  });
  await setSessionCookie(jwt);

  // Route to onboarding if the active workspace hasn't finished setup, else to
  // the role's default landing screen (App Flow §3).
  const membership = await db.membership.findFirst({
    where: { userId, status: "active" },
    include: { org: true },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  const needsOnboarding = membership && !membership.org.onboardedAt;
  const home = membership ? ROLE_HOME[membership.role as Role] ?? "/dashboard" : "/dashboard";
  const redirect = input.next?.startsWith("/") ? input.next : needsOnboarding ? "/onboarding" : home;

  return ok({ redirect });
});
