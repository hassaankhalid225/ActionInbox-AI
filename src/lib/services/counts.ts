import { db } from "@/lib/db";

// Live counts for sidebar badges + dashboard headline metrics.
export async function getNavBadges(orgId: string) {
  const [inbox, actions, approvals, overdue] = await Promise.all([
    db.inboundItem.count({ where: { orgId, status: { in: ["received", "processing", "needs_review"] }, isRead: false } }),
    db.actionSuggestion.count({ where: { orgId, state: { in: ["suggested", "needs_review"] } } }),
    db.actionSuggestion.count({ where: { orgId, state: "needs_review" } }),
    db.invoice.count({ where: { orgId, status: "overdue" } }),
  ]);
  return { inbox, actions, approvals, overdue };
}
