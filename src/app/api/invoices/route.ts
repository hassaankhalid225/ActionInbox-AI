import { type NextRequest } from "next/server";
import { handler, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/context";
import { invoiceSchema } from "@/lib/validation/entities";
import { createInvoice } from "@/lib/services/invoices";

export const POST = handler(async (req: NextRequest) => {
  const ctx = await requirePermission("invoice.manage");
  const input = invoiceSchema.parse(await req.json());
  const invoice = await createInvoice(ctx, input);
  return ok({ id: invoice.id }, { status: 201 });
});
