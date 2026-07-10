import { db } from "@/lib/db";
import { Errors } from "@/lib/api/errors";
import { parseJson, stringifyJson } from "@/lib/utils/json";
import { recordAudit } from "./audit";
import { computeTotals, nextInvoiceNumber, nextQuoteNumber, resolveDraftItems } from "./commerce";
import type { AuthContext } from "@/lib/auth/context";
import { can } from "@/lib/constants/rbac";

type Decision = "approve" | "reject" | "defer" | "edit";
type DecisionInput = { decision: Decision; reason?: string | null; draftJson?: string | null; deferUntil?: string | null };

const EXECUTE_PERMISSION: Record<string, Parameters<typeof can>[1]> = {
  quote: "quote.manage",
  invoice: "invoice.manage",
  task: "task.manage",
  reminder: "task.manage",
  followup: "action.execute",
  crm_update: "customer.manage",
  calendar: "task.manage",
  approval: "action.review",
  document: "document.manage",
};

export async function decideAction(ctx: AuthContext, suggestionId: string, input: DecisionInput) {
  const suggestion = await db.actionSuggestion.findFirst({
    where: { id: suggestionId, orgId: ctx.org.id },
    include: { inboundItem: { include: { contact: true } } },
  });
  if (!suggestion) throw Errors.notFound("Action not found.");

  switch (input.decision) {
    case "edit": {
      await db.actionSuggestion.update({ where: { id: suggestionId }, data: { draftJson: input.draftJson ?? suggestion.draftJson } });
      await logEvent(ctx, suggestionId, "edited");
      return { state: suggestion.state, resultType: null as string | null, resultId: null as string | null };
    }
    case "reject": {
      await db.actionSuggestion.update({ where: { id: suggestionId }, data: { state: "rejected", rejectionReason: input.reason ?? null } });
      await logEvent(ctx, suggestionId, "rejected", { reason: input.reason });
      await recordAudit({ orgId: ctx.org.id, actorId: ctx.user.id, action: "action.rejected", targetType: "action_suggestion", targetId: suggestionId });
      return { state: "rejected", resultType: null, resultId: null };
    }
    case "defer": {
      const deferUntil = input.deferUntil ? new Date(input.deferUntil) : new Date(Date.now() + 86400000);
      await db.actionSuggestion.update({ where: { id: suggestionId }, data: { state: "deferred", deferUntil } });
      await logEvent(ctx, suggestionId, "deferred", { deferUntil });
      return { state: "deferred", resultType: null, resultId: null };
    }
    case "approve": {
      const perm = EXECUTE_PERMISSION[suggestion.type];
      if (perm && !can(ctx.role, perm)) throw Errors.forbidden(`Your role cannot execute a ${suggestion.type} action.`);

      // Apply any pending edits to the draft first.
      if (input.draftJson) {
        await db.actionSuggestion.update({ where: { id: suggestionId }, data: { draftJson: input.draftJson } });
        suggestion.draftJson = input.draftJson;
      }

      await logEvent(ctx, suggestionId, "approved");
      const result = await executeSuggestion(ctx, suggestion);

      await db.actionSuggestion.update({
        where: { id: suggestionId },
        data: { state: "executed", resultType: result.resultType, resultId: result.resultId },
      });
      await logEvent(ctx, suggestionId, "executed", { resultType: result.resultType, resultId: result.resultId });
      await recordAudit({
        orgId: ctx.org.id,
        actorId: ctx.user.id,
        action: `action.executed.${suggestion.type}`,
        targetType: result.resultType,
        targetId: result.resultId,
        meta: { suggestionId },
      });
      return { state: "executed", ...result };
    }
  }
}

type Suggestion = Awaited<ReturnType<typeof db.actionSuggestion.findFirst>> & {
  inboundItem?: { contact?: { id: string; name: string } | null } | null;
};

async function executeSuggestion(ctx: AuthContext, s: NonNullable<Suggestion>) {
  const orgId = ctx.org.id;
  const contactId = s.inboundItem?.contact?.id ?? null;
  const draft = parseJson<Record<string, any>>(s.draftJson, {});

  switch (s.type) {
    case "task": {
      const task = await db.task.create({
        data: {
          orgId,
          title: draft.title ?? s.title,
          description: s.summary,
          priority: s.priority,
          contactId,
          assigneeId: s.assignedToId ?? ctx.user.id,
          createdById: ctx.user.id,
          sourceType: "action",
          sourceId: s.id,
        },
      });
      return { resultType: "task", resultId: task.id };
    }
    case "quote": {
      const items = await resolveDraftItems(orgId, draft.items ?? []);
      const t = computeTotals(items.length ? items : [{ name: "Item", quantity: 1, unitPriceCents: 0, taxPercent: 0 }]);
      const number = await nextQuoteNumber(orgId);
      const quote = await db.quote.create({
        data: {
          orgId, number, contactId, status: "draft", currency: ctx.org.currency,
          subtotalCents: t.subtotalCents, taxCents: t.taxCents, totalCents: t.totalCents,
          sourceItemId: s.inboundItemId,
          items: { create: t.lines.map((l) => ({ name: l.name, quantity: l.quantity, unitPriceCents: l.unitPriceCents, taxPercent: l.taxPercent, lineTotalCents: l.lineTotalCents })) },
        },
      });
      return { resultType: "quote", resultId: quote.id };
    }
    case "invoice": {
      const items = await resolveDraftItems(orgId, draft.items ?? []);
      const t = computeTotals(items.length ? items : [{ name: "Item", quantity: 1, unitPriceCents: 0, taxPercent: 0 }]);
      const number = await nextInvoiceNumber(orgId);
      const invoice = await db.invoice.create({
        data: {
          orgId, number, contactId, status: "draft", currency: ctx.org.currency,
          subtotalCents: t.subtotalCents, taxCents: t.taxCents, totalCents: t.totalCents,
          dueAt: new Date(Date.now() + 14 * 86400000),
          items: { create: t.lines.map((l) => ({ name: l.name, quantity: l.quantity, unitPriceCents: l.unitPriceCents, taxPercent: l.taxPercent, lineTotalCents: l.lineTotalCents })) },
        },
      });
      return { resultType: "invoice", resultId: invoice.id };
    }
    case "reminder":
    case "calendar": {
      const reminder = await db.reminder.create({
        data: {
          orgId,
          title: draft.title ?? s.title,
          remindAt: draft.remindAt ? new Date(draft.remindAt) : new Date(Date.now() + 2 * 86400000),
          kind: s.type === "calendar" ? "appointment" : "followup",
          contactId,
        },
      });
      return { resultType: "reminder", resultId: reminder.id };
    }
    case "followup": {
      const task = await db.task.create({
        data: {
          orgId,
          title: `Send follow-up: ${s.inboundItem?.contact?.name ?? "customer"}`,
          description: draft.body ?? s.summary,
          priority: s.priority,
          contactId,
          assigneeId: ctx.user.id,
          createdById: ctx.user.id,
          sourceType: "action",
          sourceId: s.id,
        },
      });
      return { resultType: "task", resultId: task.id };
    }
    case "crm_update": {
      if (contactId) {
        await db.note.create({ data: { orgId, authorId: ctx.user.id, targetType: "contact", targetId: contactId, body: s.summary ?? "AI update applied." } });
      }
      return { resultType: "contact", resultId: contactId };
    }
    case "approval": {
      const approval = await db.approval.create({
        data: { orgId, type: "outbound_message", status: "pending", subjectType: "inbound_item", subjectId: s.inboundItemId ?? "", requestedById: ctx.user.id },
      });
      return { resultType: "approval", resultId: approval.id };
    }
    case "document": {
      const doc = await db.document.create({
        data: { orgId, inboundItemId: s.inboundItemId, contactId, title: s.title, docType: "other", status: "ready", confidence: s.confidence },
      });
      return { resultType: "document", resultId: doc.id };
    }
    default:
      return { resultType: null as string | null, resultId: null as string | null };
  }
}

export async function submitFeedback(ctx: AuthContext, suggestionId: string, rating: "wrong" | "partial" | "correct") {
  const s = await db.actionSuggestion.findFirst({ where: { id: suggestionId, orgId: ctx.org.id } });
  if (!s) throw Errors.notFound();
  await db.actionSuggestion.update({ where: { id: suggestionId }, data: { feedbackRating: rating } });
  await logEvent(ctx, suggestionId, "edited", { feedback: rating });
  // FR-051/052: collect corrections without training global models (opt-in only).
  await recordAudit({ orgId: ctx.org.id, actorId: ctx.user.id, action: "ai.feedback", targetType: "action_suggestion", targetId: suggestionId, meta: { rating } });
}

async function logEvent(ctx: AuthContext, suggestionId: string, type: string, detail?: Record<string, unknown>) {
  await db.actionEvent.create({
    data: { orgId: ctx.org.id, suggestionId, actorId: ctx.user.id, type, detailJson: detail ? stringifyJson(detail) : null },
  });
}
