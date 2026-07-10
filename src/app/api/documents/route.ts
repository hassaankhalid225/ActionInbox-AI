import { type NextRequest } from "next/server";
import { handler, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { documentSchema } from "@/lib/validation/entities";
import { recordAudit } from "@/lib/services/audit";
import { stringifyJson } from "@/lib/utils/json";
import { z } from "zod";

// Simulated upload + OCR (App Flow §9). Real file handling lives behind the
// storage abstraction (STORAGE_DRIVER); here we persist a ready Document record
// with a deterministic confidence and, for obligation-bearing docs, a starter
// obligation so the reviewer has something to action.
const createSchema = documentSchema.extend({
  ocrText: z.string().max(20000).optional().nullable(),
});

const DOCS_WITH_OBLIGATIONS = new Set(["invoice", "notice", "contract"]);

export const POST = handler(async (req: NextRequest) => {
  const ctx = await requirePermission("document.manage");
  const input = createSchema.parse(await req.json());

  const confidence = 85; // deterministic stand-in for the OCR/extraction score.
  const ocrText = input.ocrText?.trim() || null;

  const extracted: Record<string, string> = {
    document_type: input.docType,
    title: input.title,
    detected_language: "en",
    source: "manual_upload",
  };

  const document = await db.document.create({
    data: {
      orgId: ctx.org.id,
      contactId: input.contactId ?? null,
      title: input.title,
      docType: input.docType,
      status: "ready",
      mimeType: "application/pdf",
      pageCount: 1,
      ocrText,
      extractedJson: stringifyJson(extracted),
      confidence,
      obligations: DOCS_WITH_OBLIGATIONS.has(input.docType)
        ? {
            create: [
              {
                orgId: ctx.org.id,
                title: `Review ${input.title}`,
                dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                riskLevel: "normal",
                status: "open",
              },
            ],
          }
        : undefined,
    },
  });

  // Best-effort usage metering — never blocks the primary flow.
  try {
    const period = new Date().toISOString().slice(0, 7);
    await db.usageCounter.upsert({
      where: { orgId_metric_period: { orgId: ctx.org.id, metric: "ocr_pages", period } },
      update: { used: { increment: 1 } },
      create: { orgId: ctx.org.id, metric: "ocr_pages", period, used: 1, limit: 0 },
    });
  } catch {
    // ignore metering failures
  }

  await recordAudit({
    orgId: ctx.org.id,
    actorId: ctx.user.id,
    action: "document.created",
    targetType: "document",
    targetId: document.id,
    meta: { docType: input.docType },
  });

  return ok({ id: document.id, status: document.status }, { status: 201 });
});
