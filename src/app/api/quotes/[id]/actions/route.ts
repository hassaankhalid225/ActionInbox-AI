import { type NextRequest } from "next/server";
import { z } from "zod";
import { handler, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/context";
import { sendQuote, setQuoteStatus, convertQuoteToInvoice } from "@/lib/services/quotes";

const schema = z.object({ action: z.enum(["send", "accept", "reject", "expire", "convert"]) });

export const POST = handler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const ctx = await requirePermission("quote.manage");
  const { action } = schema.parse(await req.json());

  switch (action) {
    case "send":
      await sendQuote(ctx, params.id);
      return ok({ status: "sent" });
    case "accept":
      await setQuoteStatus(ctx, params.id, "accepted");
      return ok({ status: "accepted" });
    case "reject":
      await setQuoteStatus(ctx, params.id, "rejected");
      return ok({ status: "rejected" });
    case "expire":
      await setQuoteStatus(ctx, params.id, "expired");
      return ok({ status: "expired" });
    case "convert": {
      const invoice = await convertQuoteToInvoice(ctx, params.id);
      return ok({ redirect: `/invoices/${invoice.id}`, invoiceId: invoice.id });
    }
  }
});
