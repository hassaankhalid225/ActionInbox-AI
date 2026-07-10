import { type NextRequest } from "next/server";
import { z } from "zod";
import { handler, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { enqueue } from "@/lib/jobs/queue";
import { recordAudit } from "@/lib/services/audit";

// Simulated inbound ingestion (App Flow §6). In production this is driven by the
// WhatsApp/email webhooks; here it lets users drop a message/file to see the
// full AI pipeline run live.
const schema = z.object({
  channelType: z.enum(["whatsapp", "email", "upload"]).default("whatsapp"),
  kind: z.enum(["text", "audio", "image", "document", "email"]).default("text"),
  bodyText: z.string().optional(),
  contactId: z.string().optional().nullable(),
  fromIdentifier: z.string().optional(),
  attachment: z
    .object({ filename: z.string(), kind: z.enum(["audio", "image", "document", "csv"]), transcript: z.string().optional() })
    .optional(),
});

export const POST = handler(async (req: NextRequest) => {
  const ctx = await requirePermission("inbox.view");
  const input = schema.parse(await req.json());

  let contactId = input.contactId ?? null;
  if (!contactId && input.fromIdentifier) {
    // BR-004: auto-create a contact only when a stable identifier exists.
    const existing = await db.contact.findFirst({
      where: { orgId: ctx.org.id, OR: [{ phone: input.fromIdentifier }, { email: input.fromIdentifier }] },
    });
    contactId = existing?.id ?? (await db.contact.create({
      data: {
        orgId: ctx.org.id,
        kind: "customer",
        name: input.fromIdentifier,
        phone: input.channelType === "whatsapp" ? input.fromIdentifier : null,
        email: input.channelType === "email" ? input.fromIdentifier : null,
        autoCreated: true,
      },
    })).id;
  }

  const conversation = await db.conversation.create({
    data: { orgId: ctx.org.id, contactId, channelType: input.channelType, lastMessageAt: new Date(), unread: true },
  });

  const item = await db.inboundItem.create({
    data: {
      orgId: ctx.org.id,
      conversationId: conversation.id,
      contactId,
      channelType: input.channelType,
      kind: input.kind,
      bodyText: input.bodyText ?? "",
      fromIdentifier: input.fromIdentifier,
      attachments: input.attachment
        ? {
            create: [{
              orgId: ctx.org.id,
              filename: input.attachment.filename,
              mimeType: input.attachment.kind === "audio" ? "audio/ogg" : input.attachment.kind === "image" ? "image/jpeg" : "application/pdf",
              kind: input.attachment.kind,
              storageKey: `ingest/${Date.now()}-${input.attachment.filename}`,
              transcriptText: input.attachment.transcript ?? null,
              status: "ready",
            }],
          }
        : undefined,
    },
  });

  await recordAudit({ orgId: ctx.org.id, actorId: ctx.user.id, action: "inbox.ingested", targetType: "inbound_item", targetId: item.id });
  enqueue({ type: "process_inbound", itemId: item.id, delayMs: 600 });

  return ok({ id: item.id, status: "processing" }, { status: 201 });
});
