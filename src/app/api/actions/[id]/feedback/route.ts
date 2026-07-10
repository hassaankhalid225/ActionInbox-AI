import { type NextRequest } from "next/server";
import { z } from "zod";
import { handler, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/context";
import { submitFeedback } from "@/lib/services/actions";

const schema = z.object({ rating: z.enum(["wrong", "partial", "correct"]) });

export const POST = handler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requirePermission("action.review");
  const { rating } = schema.parse(await req.json());
  await submitFeedback(ctx, params.id, rating);
  return ok({ ok: true });
});
