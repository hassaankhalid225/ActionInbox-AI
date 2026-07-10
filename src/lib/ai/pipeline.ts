import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { parseJson, stringifyJson } from "@/lib/utils/json";
import { getAiProvider } from "./gateway";
import type { AnalyzeInput, AiAnalysisResult } from "./types";
import { recordAudit } from "@/lib/services/audit";
import { evaluateWorkflows } from "@/lib/services/workflow-engine";
import { createHash } from "crypto";

const PRIORITY_RANK: Record<string, number> = { low: 0, normal: 1, high: 2, urgent: 3 };

type OrgSettings = { lowConfidenceThreshold?: number; requireApprovalMessages?: boolean };

/**
 * Full inbound → AI understanding → action generation pipeline (App Flow §6).
 * Idempotent per inbound item: re-running replaces the analysis + regenerated
 * suggestions that have not yet been acted on.
 */
export async function processInboundItem(itemId: string): Promise<void> {
  const item = await db.inboundItem.findUnique({
    where: { id: itemId },
    include: { attachments: true, contact: true, org: true },
  });
  if (!item) {
    logger.warn("processInboundItem: item not found", { itemId });
    return;
  }

  await db.inboundItem.update({ where: { id: itemId }, data: { status: "processing" } });
  const provider = getAiProvider();
  const settings = parseJson<OrgSettings>(item.org.settingsJson, {});
  const threshold = settings.lowConfidenceThreshold ?? 70;

  try {
    // 1. Resolve media → text (transcription / OCR), persisting per-attachment.
    let text = item.bodyText ?? "";
    for (const att of item.attachments) {
      if (att.kind === "audio") {
        const job = await startJob(item.orgId, itemId, "transcription", provider.name);
        const t = await provider.transcribe({ filename: att.filename, hint: att.transcriptText ?? undefined });
        await db.attachment.update({ where: { id: att.id }, data: { transcriptText: t.text } });
        await finishJob(job.id, { text: t.text, confidence: t.confidence });
        await logUsage(item.orgId, job.id, provider.name, "transcription", att.durationSec ?? 30, 2);
        text += `\n${t.text}`;
      } else if (att.kind === "document" || att.kind === "image") {
        const job = await startJob(item.orgId, itemId, "ocr", provider.name);
        const o = await provider.ocr({ filename: att.filename, hint: att.transcriptText ?? undefined });
        await finishJob(job.id, { text: o.text, confidence: o.confidence });
        await logUsage(item.orgId, job.id, provider.name, "ocr", o.pages, 3);
        text += `\n${o.text}`;
      }
    }

    // 2. Load catalog memory for entity resolution.
    const catalog = await db.catalogItem.findMany({
      where: { orgId: item.orgId, isActive: true },
      include: { aliases: true },
      take: 200,
    });

    const input: AnalyzeInput = {
      text: text.trim(),
      channelType: item.channelType,
      contactName: item.contact?.name ?? null,
      contactLanguage: item.contact?.language ?? null,
      attachments: item.attachments.map((a) => ({ kind: a.kind, filename: a.filename })),
      catalog: catalog.map((c) => ({
        id: c.id,
        name: c.name,
        aliases: c.aliases.map((a) => a.alias),
        priceCents: c.priceCents,
        unit: c.unit,
        taxPercent: c.taxPercent,
      })),
      lowConfidenceThreshold: threshold,
    };

    // 3. Run analysis.
    const analyzeJob = await startJob(item.orgId, itemId, "classify", provider.name);
    const result = await provider.analyze(input);
    await finishJob(analyzeJob.id, result as unknown as Record<string, unknown>);
    for (const u of result.usage) {
      await logUsage(item.orgId, analyzeJob.id, provider.name, u.operation, u.units, u.costCents);
    }

    await persistAnalysis(item.orgId, itemId, result, threshold);

    // 4. Update the inbound item + increment usage counter.
    const needsReview = result.confidence < threshold || result.riskFlags.includes("low_confidence");
    const topPriority = result.suggestedActions.reduce(
      (acc, a) => (PRIORITY_RANK[a.priority] > PRIORITY_RANK[acc] ? a.priority : acc),
      "normal",
    );
    await db.inboundItem.update({
      where: { id: itemId },
      data: {
        status: needsReview ? "needs_review" : "processed",
        intent: result.intent,
        confidence: result.confidence,
        priority: topPriority,
        processedAt: new Date(),
      },
    });
    await bumpUsage(item.orgId, "ai_actions", result.suggestedActions.length);

    await recordAudit({
      orgId: item.orgId,
      actorType: "ai",
      action: "ai.analysis.completed",
      targetType: "inbound_item",
      targetId: itemId,
      meta: { intent: result.intent, confidence: result.confidence, actions: result.suggestedActions.length },
    });

    // 5. Fire workflow rules (assignment, auto-tag, escalation…).
    await evaluateWorkflows(item.orgId, "inbound_received", { inboundItemId: itemId, intent: result.intent });

    logger.info("Inbound item processed", { itemId, intent: result.intent, confidence: result.confidence });
  } catch (err) {
    logger.error("Pipeline failed", { itemId, error: String(err) });
    await db.inboundItem.update({ where: { id: itemId }, data: { status: "failed" } });
    await recordAudit({
      orgId: item.orgId,
      actorType: "system",
      action: "ai.analysis.failed",
      targetType: "inbound_item",
      targetId: itemId,
      meta: { error: String(err) },
    });
  }
}

async function persistAnalysis(orgId: string, itemId: string, result: AiAnalysisResult, threshold: number) {
  const outputHash = createHash("sha256").update(stringifyJson(result)).digest("hex").slice(0, 32);

  // Replace prior analysis (and its entities via cascade).
  await db.aiAnalysis.deleteMany({ where: { inboundItemId: itemId } });
  const analysis = await db.aiAnalysis.create({
    data: {
      orgId,
      inboundItemId: itemId,
      intent: result.intent,
      secondaryIntent: result.secondaryIntent ?? null,
      language: result.language,
      summary: result.summary,
      confidence: result.confidence,
      entitiesJson: stringifyJson(result.entities),
      riskFlagsJson: stringifyJson(result.riskFlags),
      sourceEvidenceJson: stringifyJson(result.sourceEvidence),
      provider: result.provider,
      model: result.model,
      outputHash,
      entities: {
        create: result.entities.map((e) => ({
          type: e.type,
          value: e.value,
          confidence: e.confidence,
          source: e.source,
          resolved: Boolean(e.resolvedRef),
          resolvedRef: e.resolvedRef ?? null,
        })),
      },
    },
  });

  // Regenerate not-yet-acted suggestions (keep executed/approved/rejected history).
  await db.actionSuggestion.deleteMany({
    where: { inboundItemId: itemId, state: { in: ["suggested", "needs_review"] } },
  });

  for (const a of result.suggestedActions) {
    const low = a.confidence < threshold;
    await db.actionSuggestion.create({
      data: {
        orgId,
        inboundItemId: itemId,
        type: a.type,
        title: a.title,
        summary: a.summary,
        confidence: a.confidence,
        priority: a.priority,
        requiresApproval: a.requiresApproval,
        state: low ? "needs_review" : "suggested",
        draftJson: a.draft ? stringifyJson(a.draft) : null,
        sourceEvidenceJson: stringifyJson(result.sourceEvidence),
      },
    });
  }

  return analysis;
}

// ── Job + usage helpers ─────────────────────────────────────────────────────
async function startJob(orgId: string, itemId: string, stage: string, provider: string) {
  return db.aiJob.create({
    data: { orgId, inboundItemId: itemId, stage, provider, status: "running", startedAt: new Date() },
  });
}

async function finishJob(jobId: string, output: Record<string, unknown>) {
  const job = await db.aiJob.findUnique({ where: { id: jobId } });
  const latency = job?.startedAt ? Date.now() - job.startedAt.getTime() : null;
  await db.aiJob.update({
    where: { id: jobId },
    data: { status: "done", outputJson: stringifyJson(output), finishedAt: new Date(), latencyMs: latency },
  });
}

async function logUsage(orgId: string, jobId: string, provider: string, operation: string, units: number, costCents: number) {
  await db.usageCost.create({ data: { orgId, jobId, provider, operation, units, costCents } });
}

async function bumpUsage(orgId: string, metric: string, by: number) {
  const period = new Date().toISOString().slice(0, 7);
  await db.usageCounter.upsert({
    where: { orgId_metric_period: { orgId, metric, period } },
    update: { used: { increment: by } },
    create: { orgId, metric, period, used: by, limit: 0 },
  });
}
