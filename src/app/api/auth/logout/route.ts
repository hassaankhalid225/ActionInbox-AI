import { handler, ok } from "@/lib/api/response";
import { destroySession } from "@/lib/auth/session";

export const POST = handler(async () => {
  await destroySession();
  return ok({ redirect: "/login" });
});
