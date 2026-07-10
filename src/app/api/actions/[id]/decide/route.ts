import { type NextRequest } from "next/server";
import { handler, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/context";
import { actionDecisionSchema } from "@/lib/validation/entities";
import { decideAction } from "@/lib/services/actions";

export const POST = handler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requirePermission("action.review");
  const input = actionDecisionSchema.parse(await req.json());
  const result = await decideAction(ctx, params.id, input);
  return ok(result);
});
