import { db } from "@/lib/db";

export async function getDashboard(orgId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [
    unprocessedInbox,
    pendingActions,
    lowConfidence,
    overdueInvoices,
    overdueAgg,
    todaysActions,
    recentInbox,
    dueTasks,
    metrics,
    executedCount,
    totalSuggestions,
  ] = await Promise.all([
    db.inboundItem.count({ where: { orgId, status: { in: ["received", "processing", "needs_review"] } } }),
    db.actionSuggestion.count({ where: { orgId, state: { in: ["suggested", "needs_review"] } } }),
    db.inboundItem.count({ where: { orgId, status: "needs_review" } }),
    db.invoice.findMany({
      where: { orgId, status: "overdue" },
      include: { contact: true },
      orderBy: { dueAt: "asc" },
      take: 5,
    }),
    db.invoice.aggregate({ where: { orgId, status: { in: ["overdue", "partial", "sent"] } }, _sum: { totalCents: true, paidCents: true } }),
    db.actionSuggestion.findMany({
      where: { orgId, state: { in: ["suggested", "needs_review"] } },
      include: { inboundItem: { include: { contact: true } } },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 6,
    }),
    db.inboundItem.findMany({
      where: { orgId },
      include: { contact: true, attachments: true },
      orderBy: { receivedAt: "desc" },
      take: 6,
    }),
    db.task.findMany({
      where: { orgId, status: { in: ["open", "in_progress"] }, dueAt: { lte: endOfDay } },
      include: { assignee: true, contact: true },
      orderBy: { dueAt: "asc" },
      take: 5,
    }),
    db.metricsRollup.findMany({
      where: { orgId, metric: { in: ["inbound_items", "actions_completed", "quotes_sent"] } },
      orderBy: { date: "asc" },
    }),
    db.actionSuggestion.count({ where: { orgId, state: "executed" } }),
    db.actionSuggestion.count({ where: { orgId } }),
  ]);

  const receivable = (overdueAgg._sum.totalCents ?? 0) - (overdueAgg._sum.paidCents ?? 0);
  const automationRate = totalSuggestions > 0 ? Math.round((executedCount / totalSuggestions) * 100) : 0;

  // Pivot metrics into a chart-friendly series.
  const dates = Array.from(new Set(metrics.map((m) => m.date))).sort();
  const series = dates.map((date) => ({
    date,
    inbound: metrics.find((m) => m.date === date && m.metric === "inbound_items")?.value ?? 0,
    completed: metrics.find((m) => m.date === date && m.metric === "actions_completed")?.value ?? 0,
    quotes: metrics.find((m) => m.date === date && m.metric === "quotes_sent")?.value ?? 0,
  }));

  return {
    stats: { unprocessedInbox, pendingActions, lowConfidence, overdueCount: overdueInvoices.length, receivable, automationRate },
    overdueInvoices,
    todaysActions,
    recentInbox,
    dueTasks,
    series,
  };
}
