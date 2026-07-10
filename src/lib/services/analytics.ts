import { db } from "@/lib/db";
import { INTENT_LABELS, ACTION_TYPE_LABELS, type Intent, type ActionType } from "@/lib/constants/enums";

export async function getAnalytics(orgId: string) {
  const [
    totalInbound,
    processed,
    executed,
    totalSuggestions,
    feedback,
    avgConf,
    overdueCount,
    receivableAgg,
    intents,
    actionTypes,
    metrics,
    usageAgg,
    completedTasks,
  ] = await Promise.all([
    db.inboundItem.count({ where: { orgId } }),
    db.inboundItem.count({ where: { orgId, status: "processed" } }),
    db.actionSuggestion.count({ where: { orgId, state: "executed" } }),
    db.actionSuggestion.count({ where: { orgId } }),
    db.actionSuggestion.groupBy({ by: ["feedbackRating"], where: { orgId, feedbackRating: { not: null } }, _count: true }),
    db.aiAnalysis.aggregate({ where: { orgId }, _avg: { confidence: true } }),
    db.invoice.count({ where: { orgId, status: "overdue" } }),
    db.invoice.aggregate({ where: { orgId, status: { in: ["sent", "partial", "overdue"] } }, _sum: { totalCents: true, paidCents: true } }),
    db.inboundItem.groupBy({ by: ["intent"], where: { orgId, intent: { not: null } }, _count: true }),
    db.actionSuggestion.groupBy({ by: ["type"], where: { orgId }, _count: true }),
    db.metricsRollup.findMany({ where: { orgId, metric: { in: ["inbound_items", "actions_completed", "quotes_sent"] } }, orderBy: { date: "asc" } }),
    db.usageCost.aggregate({ where: { orgId }, _sum: { costCents: true } }),
    db.task.count({ where: { orgId, status: "done" } }),
  ]);

  const totalFeedback = feedback.reduce((s, f) => s + f._count, 0);
  const wrong = feedback.find((f) => f.feedbackRating === "wrong")?._count ?? 0;
  const partial = feedback.find((f) => f.feedbackRating === "partial")?._count ?? 0;
  const correctionRate = totalFeedback > 0 ? Math.round(((wrong + partial) / totalFeedback) * 100) : 0;
  const automationRate = totalSuggestions > 0 ? Math.round((executed / totalSuggestions) * 100) : 0;
  const receivable = (receivableAgg._sum.totalCents ?? 0) - (receivableAgg._sum.paidCents ?? 0);

  const dates = Array.from(new Set(metrics.map((m) => m.date))).sort();
  const series = dates.map((date) => ({
    date,
    inbound: metrics.find((m) => m.date === date && m.metric === "inbound_items")?.value ?? 0,
    completed: metrics.find((m) => m.date === date && m.metric === "actions_completed")?.value ?? 0,
    quotes: metrics.find((m) => m.date === date && m.metric === "quotes_sent")?.value ?? 0,
  }));

  const intentBars = intents
    .map((i) => ({ label: INTENT_LABELS[i.intent as Intent] ?? String(i.intent), value: i._count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const actionBars = actionTypes
    .map((a) => ({ label: ACTION_TYPE_LABELS[a.type as ActionType] ?? a.type, value: a._count }))
    .sort((a, b) => b.value - a.value);

  return {
    kpis: {
      totalInbound,
      processed,
      executed,
      automationRate,
      correctionRate,
      avgConfidence: Math.round(avgConf._avg.confidence ?? 0),
      overdueCount,
      receivable,
      aiCostCents: usageAgg._sum.costCents ?? 0,
      completedTasks,
    },
    series,
    intentBars,
    actionBars,
  };
}
