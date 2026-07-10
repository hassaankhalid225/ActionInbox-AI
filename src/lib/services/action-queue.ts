import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { ReviewAction } from "@/components/actions/action-review-card";

export type ActionQueueFilter = "open" | "needs_review" | "deferred" | "executed" | "rejected" | "all";

export async function getActionQueue(orgId: string, filter: ActionQueueFilter, typeFilter?: string) {
  const where: Prisma.ActionSuggestionWhereInput = { orgId };
  if (filter === "open") where.state = { in: ["suggested", "needs_review"] };
  else if (filter !== "all") where.state = filter;
  if (typeFilter) where.type = typeFilter;

  const suggestions = await db.actionSuggestion.findMany({
    where,
    include: {
      events: { include: { actor: true }, orderBy: { createdAt: "desc" } },
      inboundItem: { include: { contact: true } },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: 60,
  });

  const actions: (ReviewAction & { contactName: string | null; inboundItemId: string | null })[] = suggestions.map((s) => ({
    id: s.id,
    type: s.type,
    title: s.title,
    summary: s.summary,
    confidence: s.confidence,
    priority: s.priority,
    state: s.state,
    requiresApproval: s.requiresApproval,
    draftJson: s.draftJson,
    rejectionReason: s.rejectionReason,
    feedbackRating: s.feedbackRating,
    resultType: s.resultType,
    resultId: s.resultId,
    events: s.events.map((e) => ({ id: e.id, type: e.type, createdAt: e.createdAt.toISOString(), actorName: e.actor?.name ?? null })),
    contactName: s.inboundItem?.contact?.name ?? null,
    inboundItemId: s.inboundItemId,
  }));

  return actions;
}

export async function getActionCounts(orgId: string) {
  const [open, needsReview, deferred, executed, rejected, all] = await Promise.all([
    db.actionSuggestion.count({ where: { orgId, state: { in: ["suggested", "needs_review"] } } }),
    db.actionSuggestion.count({ where: { orgId, state: "needs_review" } }),
    db.actionSuggestion.count({ where: { orgId, state: "deferred" } }),
    db.actionSuggestion.count({ where: { orgId, state: "executed" } }),
    db.actionSuggestion.count({ where: { orgId, state: "rejected" } }),
    db.actionSuggestion.count({ where: { orgId } }),
  ]);
  return { open, needs_review: needsReview, deferred, executed, rejected, all };
}
