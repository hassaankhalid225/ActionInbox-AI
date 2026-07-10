import { type NextRequest } from "next/server";
import { handler, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/context";
import { invoiceSchema } from "@/lib/validation/entities";
import { updateInvoice } from "@/lib/services/invoices";

export const PATCH = handler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requirePermission("invoice.manage");
  const input = invoiceSchema.parse(await req.json());
  await updateInvoice(ctx, params.id, input);
  return ok({ id: params.id });
});
