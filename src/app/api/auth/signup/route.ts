import { type NextRequest } from "next/server";
import { handler, ok } from "@/lib/api/response";
import { signupSchema } from "@/lib/validation/auth";
import { createAccount } from "@/lib/services/account";
import { createSession, setSessionCookie } from "@/lib/auth/session";

export const POST = handler(async (req: NextRequest) => {
  const body = await req.json();
  const input = signupSchema.parse(body);

  const { userId } = await createAccount(input);
  const jwt = await createSession(userId, {
    userAgent: req.headers.get("user-agent") ?? undefined,
    ip: req.headers.get("x-forwarded-for") ?? undefined,
  });
  await setSessionCookie(jwt);

  return ok({ redirect: "/onboarding" }, { status: 201 });
});
