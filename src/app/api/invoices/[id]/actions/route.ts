import { type NextRequest } from "next/server";
import { z } from "zod";
import { handler, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/context";
import { paymentSchema } from "@/lib/validation/entities";
import { sendInvoice, markInvoicePaid, recordPayment, scheduleFollowup, voidInvoice } from "@/lib/services/invoices";
import { Errors } from "@/lib/api/errors";

const schema = z.object({
  action: z.enum(["send", "mark_paid", "record_payment", "followup", "void"]),
  payment: paymentSchema.optional(),
});

export const POST = handler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  // Recording payments requires payment.verify; other lifecycle ops require invoice.manage.
  const body = schema.parse(await req.json());
  if (body.action === "record_payment") {
    const ctx = await requirePermission("payment.verify");
    if (!body.payment) throw Errors.badRequest("Payment details required.");
    const res = await recordPayment(ctx, params.id, body.payment);
    return ok(res);
  }

  const ctx = await requirePermission("invoice.manage");
  switch (body.action) {
    case "send":
      await sendInvoice(ctx, params.id);
      return ok({ status: "sent" });
    case "mark_paid":
      return ok(await markInvoicePaid(ctx, params.id));
    case "followup":
      await scheduleFollowup(ctx, params.id);
      return ok({ scheduled: true });
    case "void":
      await voidInvoice(ctx, params.id);
      return ok({ status: "void" });
  }
});
