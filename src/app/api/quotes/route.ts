import { type NextRequest } from "next/server";
import { handler, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/context";
import { quoteSchema } from "@/lib/validation/entities";
import { createQuote } from "@/lib/services/quotes";

export const POST = handler(async (req: NextRequest) => {
  const ctx = await requirePermission("quote.manage");
  const input = quoteSchema.parse(await req.json());
  const quote = await createQuote(ctx, input);
  return ok({ id: quote.id }, { status: 201 });
});
