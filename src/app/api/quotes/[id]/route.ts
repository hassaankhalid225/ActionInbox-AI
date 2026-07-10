import { type NextRequest } from "next/server";
import { handler, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/context";
import { quoteSchema } from "@/lib/validation/entities";
import { updateQuote } from "@/lib/services/quotes";

export const PATCH = handler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requirePermission("quote.manage");
  const input = quoteSchema.parse(await req.json());
  await updateQuote(ctx, params.id, input);
  return ok({ id: params.id });
});
